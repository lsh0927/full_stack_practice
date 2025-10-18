import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

/**
 * AuthService - 인증 관련 비즈니스 로직
 * Spring Security의 AuthenticationManager와 유사
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 사용자 인증 (이메일 + 비밀번호)
   * - bcrypt로 비밀번호 검증
   * - Spring Security의 authenticate()와 유사
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      return null;
    }

    // bcrypt로 비밀번호 비교
    // Spring Security의 PasswordEncoder.matches()와 동일
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // 비밀번호 제외하고 반환
    delete user.password;
    return user;
  }

  /**
   * 로그인 - JWT 토큰 발급
   * - Access Token 생성
   * - Spring Security의 TokenProvider와 유사
   */
  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profileImage: user.profileImage,
      },
    };
  }

  /**
   * JWT 토큰 검증
   * - 토큰에서 사용자 정보 추출
   */
  async validateToken(payload: any): Promise<User> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    return user;
  }
}
