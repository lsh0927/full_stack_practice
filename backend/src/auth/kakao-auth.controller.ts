import { Controller, Get, Query, Redirect, HttpException, HttpStatus } from '@nestjs/common';
import { KakaoAuthService } from './kakao-auth.service';

@Controller('auth/kakao')
export class KakaoAuthController {
  constructor(private readonly kakaoAuthService: KakaoAuthService) {}

  /**
   * 카카오 로그인 페이지로 리다이렉트
   */
  @Get()
  @Redirect()
  kakaoLogin() {
    const url = this.kakaoAuthService.getKakaoLoginUrl();
    return { url };
  }

  /**
   * 카카오 로그인 콜백 처리
   */
  @Get('callback')
  @Redirect()
  async kakaoCallback(
    @Query('code') code?: string,
    @Query('error') error?: string,
  ) {
    const frontendUrl = 'http://localhost:3002';

    // 에러 처리
    if (error) {
      console.error('카카오 로그인 에러:', error);
      return {
        url: `${frontendUrl}/auth/login?error=kakao_auth_failed`,
      };
    }

    // 코드가 없는 경우
    if (!code) {
      return {
        url: `${frontendUrl}/auth/login?error=missing_auth_code`,
      };
    }

    try {
      // 카카오 로그인 처리
      const result = await this.kakaoAuthService.handleKakaoLogin(code);

      // 성공 시 프론트엔드로 리다이렉트 (JWT 토큰과 리프레시 토큰 포함)
      // 프론트엔드에서 URL 파라미터로 토큰을 받아 처리
      return {
        url: `${frontendUrl}/auth/callback?token=${result.access_token}&refresh_token=${result.refresh_token}&provider=kakao`,
      };
    } catch (error) {
      console.error('카카오 로그인 처리 실패:', error);

      // 에러 시 로그인 페이지로 리다이렉트
      return {
        url: `${frontendUrl}/auth/login?error=authentication_failed`,
      };
    }
  }

  /**
   * 카카오 로그인 API 엔드포인트 (프론트엔드에서 직접 호출용)
   * 프론트엔드에서 인가 코드를 받아와서 직접 호출하는 경우 사용
   */
  @Get('token')
  async getKakaoToken(@Query('code') code: string) {
    if (!code) {
      throw new HttpException(
        '인가 코드가 필요합니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.kakaoAuthService.handleKakaoLogin(code);
      return result;
    } catch (error) {
      console.error('카카오 토큰 교환 실패:', error);
      throw new HttpException(
        '카카오 인증에 실패했습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}