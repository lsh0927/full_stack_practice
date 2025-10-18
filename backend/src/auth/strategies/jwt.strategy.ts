import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * JwtStrategy - JWT 토큰 인증 전략
 * Spring Security의 JwtAuthenticationFilter와 유사
 *
 * Bearer Token 방식:
 * Authorization: Bearer <token>
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Bearer Token에서 추출
      ignoreExpiration: false, // 만료된 토큰 거부
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret-key', // 환경 변수에서 시크릿 키 가져오기
    });
  }

  /**
   * validate 메서드 - JWT 페이로드 검증
   * - Passport가 토큰 검증 후 자동으로 호출
   * - 반환값이 req.user에 저장됨
   */
  async validate(payload: any) {
    // 토큰 페이로드에서 사용자 정보 추출
    const user = await this.authService.validateToken(payload);
    return user; // req.user에 저장됨
  }
}
