import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport, ClientProvider } from '@nestjs/microservices';
import { QUEUE_NAMES } from './constants/queue.constants';
import { EmailService } from './services/email.service';
import { NotificationService } from './services/notification.service';
import { ImageService } from './services/image.service';
import { EmailConsumer } from './consumers/email.consumer';
import { NotificationConsumer } from './consumers/notification.consumer';
import { ImageConsumer } from './consumers/image.consumer';

/**
 * QueueModule - RabbitMQ 메시지 큐 모듈
 *
 * 비동기 작업 처리를 위한 RabbitMQ 클라이언트 설정
 * Spring Boot의 @EnableAsync + RabbitMQ와 유사한 역할
 *
 * 주요 큐:
 * - EMAIL_QUEUE: 이메일 발송 큐
 * - NOTIFICATION_QUEUE: 알림 전송 큐
 * - IMAGE_QUEUE: 이미지 처리 큐
 */
@Module({
  imports: [
    /**
     * RabbitMQ 클라이언트 등록
     * 각 큐별로 독립적인 클라이언트 생성
     */
    ClientsModule.registerAsync([
      // 이메일 발송 큐
      {
        name: 'EMAIL_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService): ClientProvider => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>(
                'RABBITMQ_URL',
                'amqp://rabbitmq_user:rabbitmq_password@localhost:5672',
              ),
            ],
            queue: QUEUE_NAMES.EMAIL,
            queueOptions: {
              durable: true, // 서버 재시작 시에도 큐 유지
            },
            // 재연결 설정
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
            },
          },
        }),
      },

      // 알림 전송 큐
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService): ClientProvider => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>(
                'RABBITMQ_URL',
                'amqp://rabbitmq_user:rabbitmq_password@localhost:5672',
              ),
            ],
            queue: QUEUE_NAMES.NOTIFICATION,
            queueOptions: {
              durable: true,
            },
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
            },
          },
        }),
      },

      // 이미지 처리 큐
      {
        name: 'IMAGE_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService): ClientProvider => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>(
                'RABBITMQ_URL',
                'amqp://rabbitmq_user:rabbitmq_password@localhost:5672',
              ),
            ],
            queue: QUEUE_NAMES.IMAGE,
            queueOptions: {
              durable: true,
            },
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [EmailConsumer, NotificationConsumer, ImageConsumer], // Consumer 등록
  providers: [EmailService, NotificationService, ImageService], // Service 등록
  exports: [ClientsModule], // 다른 모듈에서 사용할 수 있도록 export
})
export class QueueModule {}
