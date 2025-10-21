import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { RedisService } from '../redis/redis.service';

/**
 * PostsViewsScheduler - 조회수 배치 업데이트 스케줄러
 *
 * Redis에 임시 저장된 조회수를 주기적으로 PostgreSQL에 동기화
 * - Redis INCR로 빠른 조회수 증가
 * - 5분마다 DB에 배치 업데이트
 * - 성능 최적화: 매 조회마다 DB 업데이트하지 않음
 */
@Injectable()
export class PostsViewsScheduler {
  private readonly logger = new Logger(PostsViewsScheduler.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 조회수 배치 업데이트 Cron 작업
   * - 매 5분마다 실행
   * - Redis의 조회수 데이터를 PostgreSQL에 동기화
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncViewsToDatabase() {
    this.logger.log('🔄 Starting batch view count sync...');

    try {
      // Redis에서 모든 조회수 키 조회
      // 패턴: post:views:{postId}
      const keys = await this.redisService.keys('post:views:*');

      if (keys.length === 0) {
        this.logger.log('✅ No view counts to sync');
        return;
      }

      this.logger.log(`📊 Found ${keys.length} posts with view counts to sync`);

      // 각 게시글의 조회수를 DB에 업데이트
      for (const key of keys) {
        const postId = key.replace('post:views:', '');
        const redisViews = await this.redisService.get(key);

        if (redisViews) {
          const viewCount = parseInt(redisViews, 10);

          // DB에서 현재 조회수 조회
          const post = await this.postRepository.findOne({
            where: { id: postId },
            select: ['id', 'views'],
          });

          if (post) {
            // Redis의 증가분을 DB에 반영
            await this.postRepository.increment({ id: postId }, 'views', viewCount);

            this.logger.debug(
              `📈 Updated post ${postId}: +${viewCount} views (total: ${post.views + viewCount})`,
            );

            // Redis에서 해당 키 삭제 (동기화 완료)
            await this.redisService.del(key);
          } else {
            // 게시글이 삭제된 경우 Redis 키도 삭제
            this.logger.warn(`⚠️  Post ${postId} not found, removing Redis key`);
            await this.redisService.del(key);
          }
        }
      }

      this.logger.log(`✅ Successfully synced ${keys.length} view counts to database`);
    } catch (error) {
      this.logger.error('❌ Error syncing view counts:', error);
    }
  }
}
