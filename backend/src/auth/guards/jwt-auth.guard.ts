import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard - JWT 인증 가드
 * Spring Security의 @PreAuthorize("isAuthenticated()")와 유사
 *
 * 사용법:
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
