import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { KakaoAuthService } from './kakao-auth.service';
import { KakaoAuthController } from './kakao-auth.controller';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../queue/queue.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * AuthModule - 인증 모듈
 * Spring Security 설정과 유사
 */
@Module({
  imports: [
    UsersModule, // UsersService 사용
    QueueModule, // RabbitMQ 큐 사용
    PassportModule, // Passport 기본 설정
    ConfigModule, // ConfigService 사용을 위해 추가
    /**
     * JwtModule - JWT 토큰 생성/검증
     * Spring Security의 JwtTokenProvider와 유사
     */
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
        signOptions: {
          expiresIn: '7d', // string literal로 명시
        },
      }),
    }),
  ],
  controllers: [
    AuthController,
    KakaoAuthController, // 카카오 OAuth 컨트롤러 추가
  ],
  providers: [
    AuthService,
    KakaoAuthService, // 카카오 OAuth 서비스 추가
    LocalStrategy,
    JwtStrategy,
  ],
  exports: [AuthService, KakaoAuthService], // 다른 모듈에서 사용할 수 있도록 export
})
export class AuthModule {}
