import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { User } from '../users/entities/user.entity';
import { RefreshTokenPayload } from './dto/refresh-token.dto';

/**
 * AuthService - 인증 관련 비즈니스 로직
 * Spring Security의 AuthenticationManager와 유사
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
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

    // 비밀번호 제외하고 반환 (password를 undefined로 설정)
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * 로그인 - JWT 토큰 발급
   * - Access Token 생성 (짧은 만료 시간)
   * - Refresh Token 생성 (긴 만료 시간) 및 Redis 저장
   * - Spring Security의 TokenProvider와 유사
   */
  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    // Access Token 생성 (15분)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    // Refresh Token 생성 (7일)
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
        expiresIn: '7d',
      },
    );

    // Refresh Token을 Redis에 저장 (7일 TTL)
    const refreshTokenPayload: RefreshTokenPayload = {
      userId: user.id,
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
    };

    const redisKey = `refresh_token:${user.id}`;
    const ttl = 7 * 24 * 60 * 60; // 7일 (초 단위)
    await this.redisService.set(redisKey, refreshTokenPayload, ttl);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
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

  /**
   * Refresh Token으로 새로운 Access Token 발급
   * - Refresh Token 검증
   * - Redis에 저장된 토큰과 비교
   * - 새로운 Access Token 발급
   */
  async refreshToken(refreshToken: string) {
    try {
      // Refresh Token 검증
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      });

      // Redis에서 저장된 Refresh Token 조회
      const redisKey = `refresh_token:${payload.sub}`;
      const storedTokenData = await this.redisService.get<RefreshTokenPayload>(
        redisKey,
      );

      // Redis에 토큰이 없거나 토큰이 일치하지 않으면 거부
      if (!storedTokenData || storedTokenData.token !== refreshToken) {
        throw new UnauthorizedException('유효하지 않은 Refresh Token입니다.');
      }

      // 사용자 정보 조회
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      // 새로운 Access Token 생성
      const newAccessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        username: user.username,
      });

      return {
        access_token: newAccessToken,
        refresh_token: refreshToken, // 기존 Refresh Token 재사용
      };
    } catch (error) {
      throw new UnauthorizedException('토큰 갱신에 실패했습니다.');
    }
  }

  /**
   * 로그아웃 - Refresh Token 삭제
   * - Redis에서 사용자의 Refresh Token 제거
   */
  async logout(userId: string): Promise<void> {
    const redisKey = `refresh_token:${userId}`;
    await this.redisService.del(redisKey);
  }
}
