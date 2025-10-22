import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * FollowsController - 팔로우/언팔로우 관리 컨트롤러
 */
@Controller('follows')
@UseGuards(JwtAuthGuard) // 모든 엔드포인트에 JWT 인증 적용
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  /**
   * POST /follows/:userId - 사용자 팔로우하기
   * @param userId 팔로우할 사용자 ID
   */
  @Post(':userId')
  async followUser(@Param('userId') userId: string, @Request() req) {
    const followerId = req.user.id;
    return this.followsService.follow(followerId, userId);
  }

  /**
   * DELETE /follows/:userId - 사용자 언팔로우하기
   * @param userId 언팔로우할 사용자 ID
   */
  @Delete(':userId')
  async unfollowUser(@Param('userId') userId: string, @Request() req) {
    const followerId = req.user.id;
    return this.followsService.unfollow(followerId, userId);
  }

  /**
   * POST /follows/:userId/toggle - 팔로우 토글 (팔로우 중이면 언팔로우, 아니면 팔로우)
   * @param userId 대상 사용자 ID
   */
  @Post(':userId/toggle')
  async toggleFollow(@Param('userId') userId: string, @Request() req) {
    const followerId = req.user.id;
    return this.followsService.toggleFollow(followerId, userId);
  }

  /**
   * GET /follows/:userId/stats - 팔로우 통계 조회
   * @param userId 조회할 사용자 ID
   */
  @Get(':userId/stats')
  async getFollowStats(@Param('userId') userId: string, @Request() req) {
    const currentUserId = req.user.id;
    return this.followsService.getFollowStats(userId, currentUserId);
  }

  /**
   * GET /follows/:userId/is-following - 팔로우 여부 확인
   * @param userId 확인할 사용자 ID
   */
  @Get(':userId/is-following')
  async isFollowing(@Param('userId') userId: string, @Request() req) {
    const followerId = req.user.id;
    const isFollowing = await this.followsService.isFollowing(
      followerId,
      userId,
    );
    return { isFollowing };
  }

  /**
   * GET /follows/:userId/mutual - 맞팔로우 여부 확인
   * @param userId 확인할 사용자 ID
   */
  @Get(':userId/mutual')
  async checkMutualFollow(@Param('userId') userId: string, @Request() req) {
    const currentUserId = req.user.id;
    const isMutual = await this.followsService.checkMutualFollow(
      currentUserId,
      userId,
    );
    return { isMutual };
  }

  /**
   * GET /follows/:userId/followers - 팔로워 목록 조회 (페이지네이션)
   * @param userId 조회할 사용자 ID
   * @param page 페이지 번호 (기본값: 1)
   * @param limit 페이지당 개수 (기본값: 20)
   */
  @Get(':userId/followers')
  async getFollowers(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Request() req,
  ) {
    const currentUserId = req.user.id;
    return this.followsService.getFollowers(userId, currentUserId, page, limit);
  }

  /**
   * GET /follows/:userId/following - 팔로잉 목록 조회 (페이지네이션)
   * @param userId 조회할 사용자 ID
   * @param page 페이지 번호 (기본값: 1)
   * @param limit 페이지당 개수 (기본값: 20)
   */
  @Get(':userId/following')
  async getFollowing(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Request() req,
  ) {
    const currentUserId = req.user.id;
    return this.followsService.getFollowing(userId, currentUserId, page, limit);
  }
}
