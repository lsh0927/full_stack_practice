import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './entities/comment.entity';
import { BlocksModule } from '../blocks/blocks.module';

/**
 * CommentsModule - 댓글 관리 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    BlocksModule, // 차단 기능 사용
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
