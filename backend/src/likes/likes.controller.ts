import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * LikesController
 *
 * 좋아요 관련 API 엔드포인트를 제공하는 컨트롤러
 */
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /**
   * 게시글에 좋아요 추가
   * POST /posts/:id/like
   */
  @Post(':id/like')
  async likePost(@Param('id') postId: string, @Req() req) {
    const userId = req.user.id;
    const like = await this.likesService.likePost(postId, userId);

    return {
      message: '좋아요를 추가했습니다.',
      like,
    };
  }

  /**
   * 게시글 좋아요 취소
   * DELETE /posts/:id/like
   */
  @Delete(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlikePost(@Param('id') postId: string, @Req() req) {
    const userId = req.user.id;
    await this.likesService.unlikePost(postId, userId);
  }

  /**
   * 특정 게시글의 좋아요 개수 조회
   * GET /posts/:id/likes/count
   */
  @Get(':id/likes/count')
  async getLikesCount(@Param('id') postId: string) {
    const count = await this.likesService.getLikesCount(postId);
    return { count };
  }

  /**
   * 현재 사용자의 좋아요 상태 확인
   * GET /posts/:id/like/status
   */
  @Get(':id/like/status')
  async getLikeStatus(@Param('id') postId: string, @Req() req) {
    const userId = req.user.id;
    const isLiked = await this.likesService.isLikedByUser(postId, userId);
    return { isLiked };
  }

  /**
   * 특정 게시글의 좋아요 목록 조회
   * GET /posts/:id/likes
   */
  @Get(':id/likes')
  async getLikesByPost(
    @Param('id') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.likesService.getLikesByPost(postId, page, limit);
  }
}

/**
 * UserLikesController
 *
 * 사용자의 좋아요 목록을 조회하는 컨트롤러
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserLikesController {
  constructor(private readonly likesService: LikesService) {}

  /**
   * 사용자가 좋아요한 게시글 목록 조회
   * GET /users/:id/likes
   */
  @Get(':id/likes')
  async getLikesByUser(
    @Param('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.likesService.getLikesByUser(userId, page, limit);
  }
}
