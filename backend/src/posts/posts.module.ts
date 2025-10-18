import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';

/**
 * PostsModule - 게시글 모듈
 * Mongoose에서 TypeORM으로 마이그레이션
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Post]), // TypeORM Repository 등록
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}