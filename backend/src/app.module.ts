import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { CommentsModule } from './comments/comments.module';
import { BlocksModule } from './blocks/blocks.module';
import { User } from './users/entities/user.entity';
import { Post } from './posts/entities/post.entity';
import { Comment } from './comments/entities/comment.entity';
import { Block } from './blocks/entities/block.entity';

/**
 * AppModule - 루트 모듈
 *
 * Spring Boot의 @SpringBootApplication과 유사한 역할
 * 전역 설정 및 모듈 통합
 */
@Module({
  imports: [
    /**
     * ConfigModule - 환경 변수 관리
     * Spring의 @ConfigurationProperties와 유사
     * isGlobal: true로 전역에서 사용 가능
     */
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    /**
     * TypeOrmModule - PostgreSQL 연결 설정
     * Spring JPA의 application.yml 설정과 유사
     *
     * 주요 설정:
     * - type: 'postgres' - PostgreSQL 사용
     * - synchronize: true (개발 환경) - 엔티티 변경 시 스키마 자동 동기화
     *   ⚠️ 프로덕션에서는 false로 설정하고 마이그레이션 사용
     * - logging: true - SQL 쿼리 로깅 (N+1 문제 디버깅에 유용)
     */
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [User, Post, Comment, Block], // 엔티티 등록
        synchronize: true, // 개발 환경: true, 프로덕션: false
        logging: true, // SQL 쿼리 로깅 활성화
      }),
    }),

    RedisModule,
    UsersModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    BlocksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}