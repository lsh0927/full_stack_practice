import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * LocalAuthGuard - 로컬 인증 가드
 * 로그인 엔드포인트에서 사용
 *
 * 사용법:
 * @UseGuards(LocalAuthGuard)
 * @Post('login')
 * login(@CurrentUser() user: User) {
 *   return this.authService.login(user);
 * }
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
