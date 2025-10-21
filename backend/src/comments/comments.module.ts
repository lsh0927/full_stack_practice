import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './entities/comment.entity';
import { BlocksModule } from '../blocks/blocks.module';
import { PostsModule } from '../posts/posts.module';
import { QueueModule } from '../queue/queue.module';

/**
 * CommentsModule - 댓글 관리 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    BlocksModule, // 차단 기능 사용
    PostsModule, // 게시글 정보 조회 (알림용)
    QueueModule, // RabbitMQ 알림 큐
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
