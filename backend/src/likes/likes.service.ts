import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { Post } from '../posts/entities/post.entity';
import { RedisService } from '../redis/redis.service';

/**
 * LikesService
 *
 * 좋아요 비즈니스 로직을 처리하는 서비스
 */
@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 게시글에 좋아요 추가
   * @param postId 게시글 ID
   * @param userId 사용자 ID
   */
  async likePost(postId: string, userId: string): Promise<Like> {
    // 게시글 존재 확인
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`게시글을 찾을 수 없습니다. (ID: ${postId})`);
    }

    // 이미 좋아요를 눌렀는지 확인
    const existingLike = await this.likeRepository.findOne({
      where: { postId, userId },
    });

    if (existingLike) {
      throw new ConflictException('이미 좋아요를 누른 게시글입니다.');
    }

    // 좋아요 생성
    const like = this.likeRepository.create({
      userId,
      postId,
    });

    await this.likeRepository.save(like);

    // Post의 likesCount 증가
    await this.postRepository.increment({ id: postId }, 'likesCount', 1);

    // 게시글 목록 캐시 무효화 (좋아요 개수가 변경되었으므로)
    await this.redisService.delByPattern('posts:list:*');
    console.log('🗑️  Invalidated cache: posts:list:* (like added)');

    return like;
  }

  /**
   * 게시글 좋아요 취소
   * @param postId 게시글 ID
   * @param userId 사용자 ID
   */
  async unlikePost(postId: string, userId: string): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: { postId, userId },
    });

    if (!like) {
      throw new NotFoundException('좋아요를 찾을 수 없습니다.');
    }

    await this.likeRepository.remove(like);

    // Post의 likesCount 감소
    await this.postRepository.decrement({ id: postId }, 'likesCount', 1);

    // 게시글 목록 캐시 무효화 (좋아요 개수가 변경되었으므로)
    await this.redisService.delByPattern('posts:list:*');
    console.log('🗑️  Invalidated cache: posts:list:* (like removed)');
  }

  /**
   * 특정 게시글의 좋아요 개수 조회
   * @param postId 게시글 ID
   */
  async getLikesCount(postId: string): Promise<number> {
    return await this.likeRepository.count({ where: { postId } });
  }

  /**
   * 특정 게시글에 사용자가 좋아요를 눌렀는지 확인
   * @param postId 게시글 ID
   * @param userId 사용자 ID
   */
  async isLikedByUser(postId: string, userId: string): Promise<boolean> {
    const like = await this.likeRepository.findOne({
      where: { postId, userId },
    });
    return !!like;
  }

  /**
   * 특정 게시글의 좋아요 목록 조회 (페이지네이션)
   * @param postId 게시글 ID
   * @param page 페이지 번호
   * @param limit 페이지당 개수
   */
  async getLikesByPost(
    postId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ likes: Like[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [likes, total] = await this.likeRepository.findAndCount({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      likes,
      total,
      page,
      limit,
    };
  }

  /**
   * 사용자가 좋아요한 게시글 목록 조회 (페이지네이션)
   * @param userId 사용자 ID
   * @param page 페이지 번호
   * @param limit 페이지당 개수
   */
  async getLikesByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ likes: Like[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [likes, total] = await this.likeRepository.findAndCount({
      where: { userId },
      relations: ['post', 'post.author'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      likes,
      total,
      page,
      limit,
    };
  }
}
