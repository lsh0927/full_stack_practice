import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CommentsService } from './comments.service';
import { PostsService } from '../posts/posts.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { MESSAGE_PATTERNS } from '../queue/constants/queue.constants';

/**
 * CommentsController - 댓글 관리 컨트롤러
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly postsService: PostsService,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  /**
   * POST /posts/:postId/comments - 댓글 작성
   * - 게시글에 댓글 추가
   * - 대댓글 작성 가능 (parentId 제공 시)
   * - 게시글 작성자에게 알림 전송 (비동기)
   */
  @Post('posts/:postId/comments')
  async create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    // 댓글 생성
    const comment = await this.commentsService.create(
      postId,
      createCommentDto,
      user.id,
    );

    // 게시글 정보 조회 (작성자 정보 필요)
    const post = await this.postsService.findOne(postId);

    // 자기 게시글에 댓글 작성한 경우는 알림 안보냄
    if (post.authorId !== user.id) {
      // 🐰 댓글 알림을 RabbitMQ 큐에 전송 (비동기)
      this.notificationClient.emit(MESSAGE_PATTERNS.NOTIFICATION_COMMENT, {
        postAuthorId: post.authorId,
        postId: post.id,
        postTitle: post.title,
        commenterUsername: user.username,
        commentContent: createCommentDto.content,
      });
    }

    return comment;
  }

  /**
   * GET /posts/:postId/comments - 게시글의 댓글 목록 조회
   * - 최상위 댓글과 대댓글 계층 구조로 반환
   * - 차단한 사용자의 댓글 숨김 처리
   */
  @Get('posts/:postId/comments')
  async findByPost(
    @Param('postId') postId: string,
    @CurrentUser() user?: User,
  ) {
    return this.commentsService.findByPost(postId, user?.id);
  }

  /**
   * GET /posts/:postId/comments/count - 게시글의 댓글 수 조회
   */
  @Get('posts/:postId/comments/count')
  async countByPost(@Param('postId') postId: string) {
    const count = await this.commentsService.countByPost(postId);
    return { count };
  }

  /**
   * PATCH /comments/:id - 댓글 수정
   * - 작성자만 수정 가능
   */
  @Patch('comments/:id')
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.update(id, updateCommentDto, user.id);
  }

  /**
   * DELETE /comments/:id - 댓글 삭제
   * - 작성자만 삭제 가능
   * - CASCADE로 대댓글도 함께 삭제
   */
  @Delete('comments/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.commentsService.remove(id, user.id);
    return { message: '댓글이 삭제되었습니다.' };
  }
}
