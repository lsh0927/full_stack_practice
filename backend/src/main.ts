import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

/* main() */
/*app.module.ts = @Configuration + @ComponentScan. 모듈(Bean) 등록 및 의존성 관리 */
/*app.controller.ts = @RestController. HTTP 요청 처리
app.service.ts = @Service. 비즈니스 로직*/

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // 정적 파일 제공 설정 - 업로드된 이미지 파일 제공
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // CORS 설정 - 프론트엔드에서 백엔드 API를 호출할 수 있도록 허용
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ], // 프론트엔드 주소 (개발 환경)
    credentials: true,
  });

  // 🐰 RabbitMQ Microservice 연결 (Consumer 실행)
  // HTTP 서버와 함께 RabbitMQ Consumer도 실행
  const rabbitmqUrl =
    process.env.RABBITMQ_URL ||
    'amqp://rabbitmq_user:rabbitmq_password@localhost:5672';

  // Email Queue
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'email-queue',
      queueOptions: { durable: true },
      prefetchCount: 1,
    },
  });

  // Notification Queue
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'notification-queue',
      queueOptions: { durable: true },
      prefetchCount: 1,
    },
  });

  // Image Queue
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'image-queue',
      queueOptions: { durable: true },
      prefetchCount: 1,
    },
  });

  // Microservice 시작
  await app.startAllMicroservices();
  console.log('🐰 RabbitMQ Consumers are running...');
  console.log('   - EmailConsumer (email-queue)');
  console.log('   - NotificationConsumer (notification-queue)');
  console.log('   - ImageConsumer (image-queue)');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();