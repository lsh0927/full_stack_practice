import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

/**
 * BlocksController - 사용자 차단 API
 *
 * 모든 엔드포인트는 JWT 인증 필수
 */
@Controller('blocks')
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  /**
   * 사용자 차단
   * POST /blocks/:userId
   * @param userId - 차단할 사용자 ID
   * @param user - 현재 로그인한 사용자
   */
  @Post(':userId')
  @HttpCode(HttpStatus.CREATED)
  async blockUser(@Param('userId') userId: string, @CurrentUser() user: User) {
    return await this.blocksService.blockUser(user.id, userId);
  }

  /**
   * 차단 해제
   * DELETE /blocks/:userId
   * @param userId - 차단 해제할 사용자 ID
   * @param user - 현재 로그인한 사용자
   */
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblockUser(@Param('userId') userId: string, @CurrentUser() user: User) {
    await this.blocksService.unblockUser(user.id, userId);
  }

  /**
   * 내가 차단한 사용자 목록 조회
   * GET /blocks?page=1&limit=20
   * @param page - 페이지 번호
   * @param limit - 페이지당 항목 수
   * @param user - 현재 로그인한 사용자
   */
  @Get()
  async getBlockedUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @CurrentUser() user: User,
  ) {
    return await this.blocksService.getBlockedUsers(user.id, page, limit);
  }
}
