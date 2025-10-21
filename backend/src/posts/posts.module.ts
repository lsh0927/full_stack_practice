import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsViewsScheduler } from './posts-views.scheduler';
import { Post } from './entities/post.entity';
import { BlocksModule } from '../blocks/blocks.module';
import { RedisModule } from '../redis/redis.module';

/**
 * PostsModule - 게시글 모듈
 * Mongoose에서 TypeORM으로 마이그레이션
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Post]), // TypeORM Repository 등록
    BlocksModule, // 차단 기능 사용
    RedisModule, // Redis 캐싱 및 조회수 임시 저장
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsViewsScheduler],
  exports: [PostsService], // 다른 모듈에서 사용할 수 있도록 export
})
export class PostsModule {}