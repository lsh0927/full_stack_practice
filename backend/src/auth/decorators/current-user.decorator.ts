import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser - 현재 인증된 사용자 정보 추출 데코레이터
 * Spring Security의 @AuthenticationPrincipal과 유사
 *
 * 사용법:
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Passport가 req.user에 저장한 사용자 정보
  },
);
