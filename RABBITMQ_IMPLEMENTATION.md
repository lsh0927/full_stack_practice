# RabbitMQ 메시지 큐 시스템 구현

> **Task 7 - Phase 5: 메시지 큐 시스템 도입**
> NestJS + RabbitMQ를 사용한 비동기 작업 처리 시스템 구현

---

## 📋 목차

1. [개요](#개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [구현된 큐 시스템](#구현된-큐-시스템)
4. [핵심 구현 사항](#핵심-구현-사항)
5. [트러블슈팅](#트러블슈팅)
6. [테스트 결과](#테스트-결과)
7. [성능 고려사항](#성능-고려사항)

---

## 개요

### 구현 목적

- **시스템 확장성**: 비동기 작업 처리를 통한 응답 시간 개선
- **안정성**: 메시지 ACK/NACK을 통한 작업 처리 보장
- **분산 처리**: Consumer를 독립적으로 확장 가능

### 기술 스택

- **메시지 브로커**: RabbitMQ 3.x (Docker Compose)
- **NestJS 패키지**:
  - `@nestjs/microservices` - NestJS 마이크로서비스 모듈
  - `amqplib` - AMQP 프로토콜 클라이언트
  - `amqp-connection-manager` - RabbitMQ 연결 관리
- **이미지 처리**: Sharp (고성능 이미지 처리 라이브러리)

### 구현 기간

- 2025-10-21 구현 완료

---

## 시스템 아키텍처

### NestJS 마이크로서비스 패턴

```
┌─────────────────────────────────────────────────────────────┐
│                        NestJS Application                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │  Controller  │────────>│   Producer   │                │
│  │  (HTTP API)  │         │  (ClientProxy)│                │
│  └──────────────┘         └───────┬───────┘                │
│                                    │                         │
│                                    │ emit()                  │
│                                    ▼                         │
│                          ┌──────────────────┐               │
│                          │   RabbitMQ       │               │
│                          │   (3 Queues)     │               │
│                          │                  │               │
│                          │  • email-queue   │               │
│                          │  • notification  │               │
│                          │  • image-queue   │               │
│                          └────────┬─────────┘               │
│                                   │                          │
│                                   │ subscribe                │
│                                   ▼                          │
│                          ┌──────────────────┐               │
│                          │   Consumer       │               │
│                          │  (@EventPattern) │               │
│                          └────────┬─────────┘               │
│                                   │                          │
│                                   │ process                  │
│                                   ▼                          │
│                          ┌──────────────────┐               │
│                          │    Service       │               │
│                          │  (비즈니스 로직)   │               │
│                          └──────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 메시지 처리 플로우

```
1. HTTP Request
   ↓
2. Controller가 비즈니스 로직 처리 (동기)
   ↓
3. 즉시 HTTP Response 반환 (사용자 대기 시간 최소화)
   ↓
4. Producer가 RabbitMQ로 메시지 emit (비동기)
   ↓
5. RabbitMQ가 메시지 큐에 저장 (Durable)
   ↓
6. Consumer가 메시지 수신 및 처리
   ↓
7. 처리 성공 → ACK (메시지 삭제)
   처리 실패 → NACK (메시지 재시도)
```

---

## 구현된 큐 시스템

### 1. Email Queue (이메일 발송 큐)

**목적**: 회원가입 시 환영 이메일 발송

**Producer**: `src/auth/auth.controller.ts`
```typescript
@Post('signup')
async signup(@Body() createUserDto: CreateUserDto) {
  const user = await this.usersService.create(createUserDto);

  // 🐰 비동기 이메일 발송
  this.emailClient.emit(MESSAGE_PATTERNS.EMAIL_WELCOME, {
    to: user.email,
    username: user.username,
  });

  return this.authService.login(user);
}
```

**Consumer**: `src/queue/consumers/email.consumer.ts`
```typescript
@EventPattern(MESSAGE_PATTERNS.EMAIL_WELCOME)
async handleWelcomeEmail(
  @Payload() data: WelcomeEmailDto,
  @Ctx() context: RmqContext,
) {
  try {
    await this.emailService.sendWelcomeEmail(data);

    // 성공 시 ACK
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  } catch (error) {
    // 실패 시 NACK (재시도)
    channel.nack(originalMsg, false, true);
  }
}
```

**메시지 패턴**:
- `email.welcome` - 환영 이메일
- `email.password.reset` - 비밀번호 재설정 (향후 구현)
- `email.notification` - 알림 이메일 (향후 구현)

---

### 2. Notification Queue (알림 전송 큐)

**목적**: 댓글 작성 시 게시글 작성자에게 알림 전송

**Producer**: `src/comments/comments.controller.ts`
```typescript
@Post('posts/:postId/comments')
async create(
  @Param('postId') postId: string,
  @Body() createCommentDto: CreateCommentDto,
  @CurrentUser() user: User,
) {
  const comment = await this.commentsService.create(postId, createCommentDto, user.id);
  const post = await this.postsService.findOne(postId);

  // 자기 게시글에 댓글 작성한 경우는 알림 안보냄
  if (post.authorId !== user.id) {
    // 🐰 비동기 알림 전송
    this.notificationClient.emit(MESSAGE_PATTERNS.NOTIFICATION_COMMENT, {
      postAuthorId: post.authorId,
      postId: post.id,
      postTitle: post.title,
      commenterUsername: user.username,
      commentContent: createCommentDto.content,
    });
  }

  return comment;
}
```

**Consumer**: `src/queue/consumers/notification.consumer.ts`
```typescript
@EventPattern(MESSAGE_PATTERNS.NOTIFICATION_COMMENT)
async handleCommentNotification(
  @Payload() data: CommentNotificationDto,
  @Ctx() context: RmqContext,
) {
  try {
    await this.notificationService.sendCommentNotification(data);
    channel.ack(originalMsg);
  } catch (error) {
    channel.nack(originalMsg, false, true);
  }
}
```

**메시지 패턴**:
- `notification.comment` - 댓글 알림
- `notification.chat` - 채팅 메시지 알림 (향후 구현)

---

### 3. Image Queue (이미지 처리 큐)

**목적**: 프로필 이미지 업로드 시 썸네일 생성 및 최적화

**Producer**: `src/users/users.controller.ts`
```typescript
@Post('profile/image')
async uploadProfileImage(
  @Request() req,
  @UploadedFile() file: Express.Multer.File,
) {
  await this.usersService.updateProfileImage(userId, imageUrl);

  const filePath = join(process.cwd(), file.path);
  const thumbnailPath = join(process.cwd(), 'uploads', 'profiles', 'thumbnails', `thumb-${file.filename}`);

  // 🐰 썸네일 생성 큐 전송
  this.imageClient.emit(MESSAGE_PATTERNS.IMAGE_THUMBNAIL, {
    filePath,
    outputPath: thumbnailPath,
    width: 200,
    height: 200,
  });

  // 🐰 이미지 최적화 큐 전송
  this.imageClient.emit(MESSAGE_PATTERNS.IMAGE_OPTIMIZE, {
    filePath,
    quality: 85,
  });

  return { message: '프로필 사진이 업로드되었습니다.', imageUrl };
}
```

**Consumer**: `src/queue/consumers/image.consumer.ts`
```typescript
@EventPattern(MESSAGE_PATTERNS.IMAGE_THUMBNAIL)
async handleCreateThumbnail(
  @Payload() data: CreateThumbnailDto,
  @Ctx() context: RmqContext,
) {
  try {
    await this.imageService.createThumbnail(data);
    channel.ack(originalMsg);
  } catch (error) {
    channel.nack(originalMsg, false, true);
  }
}
```

**이미지 처리 기능** (`src/queue/services/image.service.ts`):
```typescript
// Sharp를 사용한 고성능 이미지 처리
async createThumbnail(data: CreateThumbnailDto): Promise<void> {
  await sharp(data.filePath)
    .resize(data.width, data.height, {
      fit: 'cover',      // 비율 유지하면서 크롭
      position: 'center', // 중앙 기준 크롭
    })
    .jpeg({ quality: 70 })
    .toFile(data.outputPath);
}

async optimizeImage(data: OptimizeImageDto): Promise<void> {
  const metadata = await sharp(data.filePath).metadata();

  if (metadata.format === 'jpeg') {
    await sharp(data.filePath)
      .jpeg({ quality: data.quality || 80, progressive: true })
      .toFile(outputPath + '.tmp');
  }

  await fs.rename(outputPath + '.tmp', outputPath);
}
```

**메시지 패턴**:
- `image.thumbnail` - 썸네일 생성 (200x200, fit: cover)
- `image.optimize` - 이미지 최적화 (quality: 85, progressive JPEG)
- `image.resize` - 이미지 리사이징 (향후 사용)

---

## 핵심 구현 사항

### 1. Queue Module 구성

**파일**: `src/queue/queue.module.ts`

**핵심 포인트**:
- ClientsModule.registerAsync로 환경변수 기반 동적 설정
- 3개 독립적인 큐 클라이언트 등록
- Durable Queue 설정으로 메시지 영속성 보장

```typescript
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'EMAIL_SERVICE',
        useFactory: (configService: ConfigService): ClientProvider => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL', 'amqp://rabbitmq_user:rabbitmq_password@localhost:5672')],
            queue: QUEUE_NAMES.EMAIL,
            queueOptions: { durable: true }, // 메시지 영속성
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
            },
          },
        }),
      },
      // NOTIFICATION_SERVICE, IMAGE_SERVICE 동일 패턴
    ]),
  ],
  controllers: [EmailConsumer, NotificationConsumer, ImageConsumer],
  providers: [EmailService, NotificationService, ImageService],
  exports: [ClientsModule],
})
```

### 2. Consumer 등록 (main.ts)

**NestJS 특성**: 하나의 앱에서 여러 마이크로서비스 연결 가능

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq_user:rabbitmq_password@localhost:5672';

  // Email Queue Consumer
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'email-queue',
      queueOptions: { durable: true },
      prefetchCount: 1, // 동시 처리 메시지 수
    },
  });

  // Notification Queue Consumer
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'notification-queue',
      queueOptions: { durable: true },
      prefetchCount: 1,
    },
  });

  // Image Queue Consumer
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'image-queue',
      queueOptions: { durable: true },
      prefetchCount: 1,
    },
  });

  // 모든 마이크로서비스 시작
  await app.startAllMicroservices();

  // HTTP 서버 시작
  await app.listen(port);
}
```

### 3. Message Patterns (상수 관리)

**파일**: `src/queue/constants/queue.constants.ts`

```typescript
export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  NOTIFICATION: 'notification-queue',
  IMAGE: 'image-queue',
} as const;

export const MESSAGE_PATTERNS = {
  EMAIL_WELCOME: 'email.welcome',
  EMAIL_PASSWORD_RESET: 'email.password.reset',
  EMAIL_NOTIFICATION: 'email.notification',
  NOTIFICATION_COMMENT: 'notification.comment',
  NOTIFICATION_CHAT: 'notification.chat',
  IMAGE_RESIZE: 'image.resize',
  IMAGE_OPTIMIZE: 'image.optimize',
  IMAGE_THUMBNAIL: 'image.thumbnail',
} as const;
```

**장점**:
- 타입 안정성 (TypeScript `as const`)
- 오타 방지
- IDE 자동완성 지원

### 4. ACK/NACK 메커니즘

```typescript
try {
  // 비즈니스 로직 처리
  await this.emailService.sendWelcomeEmail(data);

  // ✅ 성공 시 ACK - 메시지 큐에서 제거
  const channel = context.getChannelRef();
  const originalMsg = context.getMessage();
  channel.ack(originalMsg);

} catch (error) {
  // ❌ 실패 시 NACK - 메시지 재시도
  // nack(msg, allUpTo, requeue)
  // allUpTo: false (현재 메시지만)
  // requeue: true (큐에 다시 넣기)
  channel.nack(originalMsg, false, true);
}
```

---

## 트러블슈팅

### 1. TypeScript Import 에러 (Sharp)

**에러**:
```
error TS2349: This expression is not callable.
Type 'typeof sharp' has no call signatures.
```

**원인**:
- `import * as sharp from 'sharp'` 방식은 namespace import
- Sharp는 default export를 사용

**해결**:
```typescript
// ❌ 잘못된 방법
import * as sharp from 'sharp';

// ✅ 올바른 방법
import sharp from 'sharp';
```

### 2. RabbitMQ 인증 실패

**에러**:
```
ACCESS_REFUSED - Login was refused using authentication mechanism PLAIN
```

**원인**:
- RabbitMQ가 이전 설정 파일(definitions.json)을 로드하여 비밀번호 덮어씀

**해결**:
1. RabbitMQ Management UI 접속 (http://localhost:15672)
2. Admin 탭에서 `rabbitmq_user` 비밀번호를 `rabbitmq_password`로 재설정

### 3. RabbitMQ 권한 에러

**에러**:
```
Expected ConnectionOpenOk; got <ConnectionClose>
```

**원인**:
- `rabbitmq_user`가 virtual host `/`에 대한 권한 없음

**해결**:
1. RabbitMQ Management UI → Admin → Users
2. `rabbitmq_user` 클릭
3. Virtual Host `/`에 대한 권한 설정:
   - Configure regexp: `.*`
   - Write regexp: `.*`
   - Read regexp: `.*`

### 4. 큐가 1개만 생성되는 문제

**원인**:
- 초기 구현에서 main.ts에 하나의 connectMicroservice만 등록

**해결**:
- 각 큐마다 별도의 connectMicroservice 호출
```typescript
// Email Queue
app.connectMicroservice({ /* ... */ });
// Notification Queue
app.connectMicroservice({ /* ... */ });
// Image Queue
app.connectMicroservice({ /* ... */ });

await app.startAllMicroservices(); // 모두 시작
```

### 5. TypeScript ClientProvider 타입 에러

**에러**:
```
Type '(configService: ConfigService) => {...}' is not assignable to type 'useFactory'
```

**해결**:
```typescript
// ✅ 명시적 반환 타입 지정
import { ClientProvider } from '@nestjs/microservices';

useFactory: (configService: ConfigService): ClientProvider => ({
  transport: Transport.RMQ,
  // ...
})
```

### 6. 환경변수 undefined 에러

**에러**:
```
Type '(string | undefined)[]' is not assignable to type 'string[]'
```

**해결**:
```typescript
// ✅ 기본값 제공
configService.get<string>('RABBITMQ_URL', 'amqp://rabbitmq_user:rabbitmq_password@localhost:5672')
```

### 7. PostsService 의존성 해결 실패

**에러**:
```
Nest can't resolve dependencies of the CommentsController (CommentsService, ?, NOTIFICATION_SERVICE)
```

**원인**:
- CommentsController가 PostsService를 주입받는데, PostsModule이 export하지 않음

**해결**:
```typescript
// src/posts/posts.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Post]), BlocksModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService], // ✅ 추가
})
export class PostsModule {}
```

---

## 테스트 결과

### 1. Email Queue 테스트

**테스트 계정**: rabbitmq-test@example.com

**결과**:
```
✅ 회원가입 성공
✅ 이메일 큐 메시지 전송 확인
✅ EmailConsumer 메시지 수신 확인
✅ EmailService 처리 완료
```

**로그**:
```
[EmailConsumer] 📨 Received WELCOME email request: rabbitmq-test@example.com
[EmailService] 📧 Sending welcome email to: rabbitmq-test@example.com
[EmailService] 📧 Username: rabbitmqtest
[EmailConsumer] ✅ WELCOME email sent successfully to: rabbitmq-test@example.com
```

### 2. Notification Queue 테스트

**시나리오**: 댓글 작성

**결과**:
```
✅ 댓글 작성 성공
✅ 알림 큐 메시지 전송 확인 (자기 게시글 제외 로직 동작)
✅ NotificationConsumer 메시지 수신 확인
```

### 3. Image Queue 테스트

**테스트 파일**: test-profile.jpg (200x200, 521 bytes)

**결과**:
```
✅ 이미지 업로드 성공
✅ 썸네일 생성 큐 메시지 전송
✅ 이미지 최적화 큐 메시지 전송
✅ ImageConsumer 2개 메시지 처리
✅ 썸네일 파일 생성 확인 (uploads/profiles/thumbnails/)
✅ 원본 이미지 최적화 완료
```

**로그**:
```
[ImageConsumer] 🖼️  Received THUMBNAIL request: profile-1761023521127-408922271.jpg
[ImageService] 🖼️  Creating thumbnail: (200x200)
[ImageService] ✅ Thumbnail created successfully: thumb-profile-1761023521127-408922271.jpg
[ImageConsumer] ✅ THUMBNAIL created

[ImageConsumer] 🖼️  Received OPTIMIZE image request: profile-1761023521127-408922271.jpg
[ImageService] 🖼️  Optimizing image: profile-1761023521127-408922271.jpg
[ImageService] ✅ Image optimized successfully
[ImageConsumer] ✅ OPTIMIZE image completed
```

### RabbitMQ Management UI 확인

```bash
curl -s -u rabbitmq_user:rabbitmq_password http://localhost:15672/api/queues
```

**결과**:
```json
[
  { "name": "email-queue", "messages": 0, "consumers": 1 },
  { "name": "notification-queue", "messages": 0, "consumers": 1 },
  { "name": "image-queue", "messages": 0, "consumers": 1 }
]
```

---

## 성능 고려사항

### 1. Prefetch Count

```typescript
prefetchCount: 1  // 동시 처리 메시지 수
```

**설정 근거**:
- 이미지 처리는 CPU/메모리 집약적 → 1개씩 처리
- 향후 필요시 증가 가능 (예: 이메일 발송은 3~5개)

### 2. Durable Queue

```typescript
queueOptions: { durable: true }
```

**장점**:
- RabbitMQ 서버 재시작 시에도 큐 유지
- 메시지 손실 방지

**단점**:
- 디스크 I/O 발생 (성능 약간 감소)

### 3. 재연결 설정

```typescript
socketOptions: {
  heartbeatIntervalInSeconds: 60,  // 연결 상태 확인
  reconnectTimeInSeconds: 5,       // 재연결 간격
}
```

### 4. Sharp 최적화

- **메모리 효율**: libvips 기반으로 ImageMagick보다 4~5배 빠름
- **Progressive JPEG**: 웹 로딩 성능 개선
- **임시 파일**: 원본 파일 보존 후 교체 (데이터 손실 방지)

---

## 향후 개선사항

### 1. Dead Letter Queue (DLQ)

실패한 메시지를 별도 큐로 이동하여 분석

```typescript
queueOptions: {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': 'dlx',
    'x-dead-letter-routing-key': 'failed-messages',
  },
}
```

### 2. 재시도 전략

- 지수 백오프 (Exponential Backoff)
- 최대 재시도 횟수 설정

### 3. 모니터링

- Prometheus + Grafana 연동
- 큐 길이, 처리 시간, 실패율 메트릭 수집

### 4. 큐 우선순위

```typescript
queueOptions: {
  durable: true,
  arguments: { 'x-max-priority': 10 },
}
```

### 5. 실제 SMTP 연동

현재는 로깅만 수행, 실제 이메일 발송 구현:
- Nodemailer
- SendGrid
- AWS SES

---

## 참고 자료

- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [AMQP 0-9-1 Protocol](https://www.rabbitmq.com/tutorials/amqp-concepts.html)

---

## 기여자

- **개발**: Claude Code + 사용자
- **구현 기간**: 2025-10-21
- **Task Master**: Task #7 완료
