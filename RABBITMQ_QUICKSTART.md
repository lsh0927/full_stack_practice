# RabbitMQ Quick Start Guide

> NestJS + RabbitMQ 메시지 큐 빠른 시작 가이드

## 🚀 빠른 시작

### 1. RabbitMQ 시작

```bash
# Docker Compose로 RabbitMQ 실행
docker-compose up -d rabbitmq

# RabbitMQ 상태 확인
docker ps | grep rabbitmq
```

### 2. RabbitMQ Management UI 접속

- URL: http://localhost:15672
- 기본 계정: `guest` / `guest`

### 3. 사용자 설정 (필수)

Management UI에서:

1. **Admin** 탭 → **Users** 클릭
2. `rabbitmq_user` 클릭
3. **Password** 필드에 `rabbitmq_password` 입력 후 **Update**
4. **Virtual Host** `/`에 권한 설정:
   - Configure regexp: `.*`
   - Write regexp: `.*`
   - Read regexp: `.*`
5. **Set permission** 클릭

### 4. 백엔드 서버 시작

```bash
cd backend
npm run start:dev
```

**시작 성공 로그**:
```
🐰 RabbitMQ Consumers are running...
   - EmailConsumer (email-queue)
   - NotificationConsumer (notification-queue)
   - ImageConsumer (image-queue)
🚀 Application is running on: http://localhost:3000
```

## 📝 테스트

### Email Queue 테스트

```bash
# 회원가입
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test1234",
    "username": "testuser"
  }'
```

**서버 로그 확인**:
```
[EmailConsumer] 📨 Received WELCOME email request: test@example.com
[EmailService] 📧 Sending welcome email to: test@example.com
[EmailConsumer] ✅ WELCOME email sent successfully
```

### Image Queue 테스트

```bash
# 1. 로그인하여 토큰 얻기
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}' \
  -s | jq -r '.access_token')

# 2. 프로필 이미지 업로드
curl -X POST http://localhost:3000/users/profile/image \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**서버 로그 확인**:
```
[ImageConsumer] 🖼️  Received THUMBNAIL request
[ImageService] 🖼️  Creating thumbnail: (200x200)
[ImageConsumer] ✅ THUMBNAIL created

[ImageConsumer] 🖼️  Received OPTIMIZE image request
[ImageService] ✅ Image optimized successfully
```

## 🔍 RabbitMQ 상태 확인

### CLI로 큐 상태 확인

```bash
curl -u rabbitmq_user:rabbitmq_password http://localhost:15672/api/queues | jq
```

**정상 출력**:
```json
[
  { "name": "email-queue", "messages": 0, "consumers": 1 },
  { "name": "notification-queue", "messages": 0, "consumers": 1 },
  { "name": "image-queue", "messages": 0, "consumers": 1 }
]
```

### Management UI로 확인

1. http://localhost:15672 접속
2. **Queues** 탭 클릭
3. 3개 큐 확인:
   - `email-queue`
   - `notification-queue`
   - `image-queue`

## 🛠️ 문제 해결

### RabbitMQ 접속 실패

**증상**:
```
ACCESS_REFUSED - Login was refused
```

**해결**:
1. Management UI에서 사용자 비밀번호 재설정
2. 권한 설정 확인 (Virtual Host `/`)

### 큐가 생성되지 않음

**증상**:
- Management UI에서 큐가 보이지 않음

**해결**:
```bash
# 서버 재시작
cd backend
npm run start:dev
```

### Consumer가 메시지를 받지 못함

**확인 사항**:
1. 서버 로그에서 "RabbitMQ Consumers are running" 확인
2. Management UI → Queues에서 Consumer 수 확인 (각 큐마다 1개)
3. 환경변수 `RABBITMQ_URL` 확인

## 📂 주요 파일 위치

```
backend/
├── src/
│   ├── queue/
│   │   ├── constants/
│   │   │   └── queue.constants.ts      # 큐 이름, 메시지 패턴 정의
│   │   ├── consumers/
│   │   │   ├── email.consumer.ts       # 이메일 큐 Consumer
│   │   │   ├── notification.consumer.ts # 알림 큐 Consumer
│   │   │   └── image.consumer.ts       # 이미지 큐 Consumer
│   │   ├── services/
│   │   │   ├── email.service.ts        # 이메일 발송 로직
│   │   │   ├── notification.service.ts # 알림 전송 로직
│   │   │   └── image.service.ts        # 이미지 처리 로직 (Sharp)
│   │   ├── dto/
│   │   │   ├── email.dto.ts
│   │   │   ├── notification.dto.ts
│   │   │   └── image.dto.ts
│   │   └── queue.module.ts             # RabbitMQ 클라이언트 설정
│   └── main.ts                         # Consumer 등록
└── .env                                # RABBITMQ_URL 설정
```

## 🔗 더 알아보기

- [상세 구현 문서](./RABBITMQ_IMPLEMENTATION.md)
- [NestJS Microservices 공식 문서](https://docs.nestjs.com/microservices/basics)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)

## 💡 팁

### 로그 레벨 조정

개발 중 상세 로그 확인:
```typescript
// main.ts
app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
```

### RabbitMQ 재시작

```bash
docker-compose restart rabbitmq
```

### 모든 큐 비우기 (개발용)

Management UI → Queues → 각 큐 클릭 → **Purge Messages**

---

**구현 완료 일자**: 2025-10-21
