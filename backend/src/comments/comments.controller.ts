import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * CommentsController - 댓글 관리 컨트롤러
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * POST /posts/:postId/comments - 댓글 작성
   * - 게시글에 댓글 추가
   * - 대댓글 작성 가능 (parentId 제공 시)
   */
  @Post('posts/:postId/comments')
  async create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.commentsService.create(postId, createCommentDto, userId);
  }

  /**
   * GET /posts/:postId/comments - 게시글의 댓글 목록 조회
   * - 최상위 댓글과 대댓글 계층 구조로 반환
   */
  @Get('posts/:postId/comments')
  async findByPost(@Param('postId') postId: string) {
    return this.commentsService.findByPost(postId);
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
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.commentsService.update(id, updateCommentDto, userId);
  }

  /**
   * DELETE /comments/:id - 댓글 삭제
   * - 작성자만 삭제 가능
   * - CASCADE로 대댓글도 함께 삭제
   */
  @Delete('comments/:id')
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    await this.commentsService.remove(id, userId);
    return { message: '댓글이 삭제되었습니다.' };
  }
}
