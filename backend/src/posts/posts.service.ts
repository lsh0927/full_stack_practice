import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not, In } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { BlocksService } from '../blocks/blocks.service';

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
  ) {}

  /**
   * 게시글 생성
   * - 인증된 사용자 필수
   * - User와 Post 관계 설정
   */
  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const post = this.postRepository.create({
      ...createPostDto,
      authorId: userId,
    });

    return this.postRepository.save(post);
  }

  /**
   * 게시글 목록 조회 (페이지네이션 + 검색 + 차단 필터링)
   *
   * N+1 문제 해결:
   * - leftJoinAndSelect로 author 정보를 한 번의 JOIN 쿼리로 조회
   * - Lazy Loading 대신 Eager Loading 사용
   *
   * 차단 필터링:
   * - 내가 차단한 사용자의 게시글 숨김
   * - 나를 차단한 사용자의 게시글 숨김
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

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
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
   * - Atomic operation으로 동시성 보장
   */
  async incrementViews(id: string): Promise<Post> {
    // increment: UPDATE posts SET views = views + 1 WHERE id = ?
    await this.postRepository.increment({ id }, 'views', 1);

    return this.findOne(id);
  }

  /**
   * 게시글 수정
   * - 작성자만 수정 가능
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

    return this.postRepository.save(post);
  }

  /**
   * 게시글 삭제
   * - 작성자만 삭제 가능
   * - CASCADE로 관련 데이터도 함께 삭제
   */
  async remove(id: string, userId: string): Promise<void> {
    const post = await this.findOne(id);

    // 권한 확인: 작성자만 삭제 가능
    if (post.authorId !== userId) {
      throw new ForbiddenException('게시글을 삭제할 권한이 없습니다.');
    }

    await this.postRepository.remove(post);
  }
}
