import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not, In } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { BlocksService } from '../blocks/blocks.service';
import { RedisService } from '../redis/redis.service';

/**
 * PostsService - TypeORM 기반 게시글 관리 서비스
 * Mongoose에서 TypeORM으로 마이그레이션
 */
@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly blocksService: BlocksService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 게시글 생성
   * - 인증된 사용자 필수
   * - User와 Post 관계 설정
   * - 캐시 무효화: 게시글 목록 캐시 전체 삭제
   */
  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const post = this.postRepository.create({
      ...createPostDto,
      authorId: userId,
    });

    const savedPost = await this.postRepository.save(post);

    // 게시글 목록 캐시 무효화
    await this.redisService.delByPattern('posts:list:*');
    console.log('🗑️  Invalidated cache: posts:list:*');

    return savedPost;
  }

  /**
   * 게시글 목록 조회 (커서 기반 페이지네이션 + 검색 + 차단 필터링)
   *
   * 커서 기반 페이지네이션:
   * - Offset 기반보다 성능이 우수 (OFFSET을 건너뛰지 않음)
   * - 무한 스크롤에 최적화
   * - cursor: 이전 요청의 마지막 게시글의 createdAt 값
   * - 실시간성이 중요한 피드에 적합 (새 게시글 추가 시 페이지 번호가 밀리지 않음)
   *
   * 실행되는 SQL:
   * SELECT post.*, user.*
   * FROM posts
   * LEFT JOIN users ON posts.authorId = users.id
   * WHERE post.createdAt < :cursor
   * AND post.authorId NOT IN (blocked_user_ids)
   * AND (post.title ILIKE '%search%' OR post.content ILIKE '%search%')
   * ORDER BY post.createdAt DESC
   * LIMIT :limit + 1
   *
   * + 1개를 조회하여 다음 페이지 존재 여부 확인
   */
  async findAllWithCursor(
    cursor: string,
    limit: number = 10,
    search?: string,
    userId?: string,
  ) {
    // 커서를 Date로 변환
    const cursorDate = new Date(cursor);

    // QueryBuilder 사용
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author') // JOIN으로 N+1 방지
      .where('post.createdAt < :cursor', { cursor: cursorDate })
      .orderBy('post.createdAt', 'DESC')
      .take(limit + 1); // +1로 다음 페이지 존재 여부 확인

    // 차단 필터링
    if (userId) {
      const blockedUserIds = await this.blocksService.getBlockedUserIds(userId);
      const blockerUserIds = await this.blocksService.getBlockerUserIds(userId);
      const excludedUserIds = [
        ...new Set([...blockedUserIds, ...blockerUserIds]),
      ];

      if (excludedUserIds.length > 0) {
        queryBuilder.andWhere('post.authorId NOT IN (:...excludedUserIds)', {
          excludedUserIds,
        });
      }
    }

    // 검색 조건
    if (search) {
      queryBuilder.andWhere(
        '(post.title ILIKE :search OR post.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const posts = await queryBuilder.getMany();

    // 다음 페이지 존재 여부 확인
    const hasNext = posts.length > limit;
    const items = hasNext ? posts.slice(0, limit) : posts;

    // 다음 커서 생성 (마지막 아이템의 createdAt)
    const nextCursor = items.length > 0
      ? items[items.length - 1].createdAt.toISOString()
      : null;

    return {
      items,
      hasNext,
      nextCursor,
      count: items.length,
    };
  }

  /**
   * 게시글 목록 조회 (페이지네이션 + 검색 + 차단 필터링 + Redis 캐싱)
   *
   * N+1 문제 해결:
   * - leftJoinAndSelect로 author 정보를 한 번의 JOIN 쿼리로 조회
   * - Lazy Loading 대신 Eager Loading 사용
   *
   * 차단 필터링:
   * - 내가 차단한 사용자의 게시글 숨김
   * - 나를 차단한 사용자의 게시글 숨김
   *
   * Redis 캐싱:
   * - 캐시 키: posts:list:page:X:limit:Y:search:Z:user:W
   * - TTL: 300초 (5분)
   * - 캐시 히트: Redis에서 반환
   * - 캐시 미스: DB 조회 후 Redis에 저장
   *
   * 실행되는 SQL:
   * SELECT post.*, user.*
   * FROM posts
   * LEFT JOIN users ON posts.authorId = users.id
   * WHERE post.authorId NOT IN (blocked_user_ids)
   * AND (post.title ILIKE '%search%' OR post.content ILIKE '%search%')
   * ORDER BY post.createdAt DESC
   * LIMIT 10 OFFSET 0
   *
   * + COUNT 쿼리 1회
   * = 총 2개의 쿼리로 완료 (N+1 문제 없음)
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    userId?: string,
  ) {
    // Redis 캐시 키 생성
    const cacheKey = `posts:list:page:${page}:limit:${limit}:search:${search || 'none'}:user:${userId || 'guest'}`;

    // 캐시 확인
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      console.log('✅ Cache HIT:', cacheKey);
      return cachedData;
    }

    console.log('❌ Cache MISS:', cacheKey);

    const skip = (page - 1) * limit;

    // QueryBuilder 사용으로 N+1 문제 방지
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author') // JOIN으로 N+1 방지
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // 차단 필터링 (userId가 있는 경우에만 적용)
    if (userId) {
      // 내가 차단한 사용자 ID 목록 조회
      const blockedUserIds = await this.blocksService.getBlockedUserIds(userId);
      // 나를 차단한 사용자 ID 목록 조회
      const blockerUserIds = await this.blocksService.getBlockerUserIds(userId);

      // 차단 관계가 있는 모든 사용자 ID
      const excludedUserIds = [
        ...new Set([...blockedUserIds, ...blockerUserIds]),
      ];

      // 차단한 사용자의 게시글 제외
      if (excludedUserIds.length > 0) {
        queryBuilder.andWhere('post.authorId NOT IN (:...excludedUserIds)', {
          excludedUserIds,
        });
      }
    }

    // 검색 조건 추가
    if (search) {
      queryBuilder.andWhere(
        '(post.title ILIKE :search OR post.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // findAndCount: 데이터 + 총 개수를 한 번에 조회
    const [posts, total] = await queryBuilder.getManyAndCount();

    const result = {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };

    // Redis에 캐시 저장 (TTL: 300초 = 5분)
    await this.redisService.set(cacheKey, result, 300);
    console.log('💾 Cached:', cacheKey);

    return result;
  }

  /**
   * 게시글 상세 조회
   * - author 정보 포함 (N+1 방지)
   */
  async findOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author'], // N+1 방지: 명시적 JOIN
    });

    if (!post) {
      throw new NotFoundException(`게시글을 찾을 수 없습니다.`);
    }

    return post;
  }

  /**
   * 조회수 증가
   * - Redis INCR로 빠른 조회수 증가
   * - 배치 작업으로 주기적으로 DB에 동기화
   * - 동시성 보장: Redis의 INCR은 atomic operation
   */
  async incrementViews(id: string): Promise<Post> {
    // Redis에 조회수 증가 (임시 저장)
    const redisKey = `post:views:${id}`;
    await this.redisService.incr(redisKey, 1);

    // 게시글 정보 반환 (DB에서 조회)
    // 실제 조회수는 배치 작업으로 동기화되므로, 최신 값이 아닐 수 있음
    return this.findOne(id);
  }

  /**
   * 게시글 수정
   * - 작성자만 수정 가능
   * - 캐시 무효화: 게시글 목록 캐시 전체 삭제
   */
  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    userId: string,
  ): Promise<Post> {
    const post = await this.findOne(id);

    // 디버깅: 비교 값 출력
    console.log('=== 게시글 수정 권한 검증 ===');
    console.log('post.authorId:', post.authorId, 'type:', typeof post.authorId);
    console.log('userId:', userId, 'type:', typeof userId);
    console.log('비교 결과:', post.authorId === userId);

    // 권한 확인: 작성자만 수정 가능
    if (post.authorId !== userId) {
      throw new ForbiddenException('게시글을 수정할 권한이 없습니다.');
    }

    // 부분 업데이트
    Object.assign(post, updatePostDto);

    const updatedPost = await this.postRepository.save(post);

    // 게시글 목록 캐시 무효화
    await this.redisService.delByPattern('posts:list:*');
    console.log('🗑️  Invalidated cache: posts:list:*');

    return updatedPost;
  }

  /**
   * 게시글 삭제
   * - 작성자만 삭제 가능
   * - CASCADE로 관련 데이터도 함께 삭제
   * - 캐시 무효화: 게시글 목록 캐시 전체 삭제
   */
  async remove(id: string, userId: string): Promise<void> {
    const post = await this.findOne(id);

    // 권한 확인: 작성자만 삭제 가능
    if (post.authorId !== userId) {
      throw new ForbiddenException('게시글을 삭제할 권한이 없습니다.');
    }

    await this.postRepository.remove(post);

    // 게시글 목록 캐시 무효화
    await this.redisService.delByPattern('posts:list:*');
    console.log('🗑️  Invalidated cache: posts:list:*');
  }
}
