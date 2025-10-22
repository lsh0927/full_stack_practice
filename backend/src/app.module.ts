import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
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
import { ChatRoom } from './chats/entities/chat-room.entity';
import { Like } from './likes/entities/like.entity';
import { Follow } from './follows/entities/follow.entity';
import { ChatsModule } from './chats/chats.module';
import { LikesModule } from './likes/likes.module';
import { QueueModule } from './queue/queue.module';
import { FollowsModule } from './follows/follows.module';

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
     * ScheduleModule - Cron 작업 스케줄링
     * @nestjs/schedule 사용하여 주기적인 배치 작업 실행
     * 조회수 배치 업데이트 등에 사용
     */
    ScheduleModule.forRoot(),

    /**
     * TypeOrmModule - PostgreSQL 연결 설정
     * Spring JPA의 application.yml 설정과 유사
     *
     * 주요 설정:
     * - type: 'postgres' - PostgreSQL 사용
     * - synchronize: true (개발 환경) - 엔티티 변경 시 스키마 자동 동기화
     *   ⚠️ 프로덕션에서는 false로 설정하고 마이그레이션 사용
     * - logging: ['error', 'warn', 'schema'] - 에러, 경고, 스키마 변경 로깅
     * - maxQueryExecutionTime: 1000ms - 1초 이상 걸리는 느린 쿼리 경고
     *
     * 연결 풀 최적화:
     * - extra.max: 20 - 최대 연결 수 (기본값 10에서 증가)
     * - extra.min: 5 - 최소 연결 수
     * - extra.idleTimeoutMillis: 30000 - 유휴 연결 타임아웃 (30초)
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
        entities: [User, Post, Comment, Block, ChatRoom, Like, Follow], // 엔티티 등록
        synchronize: true, // 개발 환경: true, 프로덕션: false
        logging: ['error', 'warn', 'schema'], // 에러, 경고, 스키마 변경만 로깅
        maxQueryExecutionTime: 1000, // 1초 이상 걸리는 쿼리 경고
        // 연결 풀 설정 (pg driver의 pool 옵션)
        extra: {
          max: 20, // 최대 연결 수
          min: 5, // 최소 연결 수
          idleTimeoutMillis: 30000, // 유휴 연결 타임아웃 (30초)
        },
      }),
    }),

    /**
     * MongooseModule - MongoDB 연결 설정 (채팅 메시지용)
     * 채팅 메시지는 MongoDB에 저장하여 빠른 조회 성능 확보
     */
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    RedisModule,
    QueueModule,
    UsersModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    BlocksModule,
    ChatsModule,
    LikesModule,
    FollowsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}