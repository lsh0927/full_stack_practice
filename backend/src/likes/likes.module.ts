import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Post } from '../posts/entities/post.entity';
import { LikesService } from './likes.service';
import { LikesController, UserLikesController } from './likes.controller';
import { RedisModule } from '../redis/redis.module';

/**
 * LikesModule
 *
 * 좋아요 기능을 제공하는 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Like, Post]),
    RedisModule, // Redis 캐시 무효화를 위해 추가
  ],
  controllers: [LikesController, UserLikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
