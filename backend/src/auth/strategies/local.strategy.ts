import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

/**
 * LocalStrategy - 이메일/비밀번호 인증 전략
 * Spring Security의 UsernamePasswordAuthenticationFilter와 유사
 *
 * Passport의 local strategy 사용
 * - username 대신 email 사용하도록 설정
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // 기본값 'username'을 'email'로 변경
      passwordField: 'password',
    });
  }

  /**
   * validate 메서드 - 인증 로직
   * - Passport가 자동으로 호출
   * - 인증 성공 시 반환값이 req.user에 저장됨
   */
  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    return user;
  }
}
