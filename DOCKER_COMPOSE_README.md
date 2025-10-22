# Docker Compose 구성 가이드

## 📋 목차
- [개요](#개요)
- [현재 구성](#현재-구성)
- [서비스별 역할](#서비스별-역할)
- [RabbitMQ 현재 사용 사례](#rabbitmq-현재-사용-사례)
- [빠른 시작](#빠른-시작)
- [개발 워크플로우](#개발-워크플로우)
- [향후 확장 계획](#향후-확장-계획)
- [트러블슈팅](#트러블슈팅)

---

## 개요

이 프로젝트는 **로컬 개발 환경**에서 다음과 같은 구조로 운영됩니다:

```
┌─────────────────────────────────────────┐
│  로컬 머신                              │
│                                         │
│  ┌───────────┐      ┌──────────────┐   │
│  │  Backend  │      │  Frontend    │   │
│  │  (NestJS) │      │  (Next.js)   │   │
│  │  :3000    │      │  :3001       │   │
│  └─────┬─────┘      └──────────────┘   │
│        │                                │
│        │ 연결                           │
│        ▼                                │
│  ┌─────────────────────────────────┐   │
│  │  Docker Compose (컨테이너)      │   │
│  │                                 │   │
│  │  ┌──────────┐  ┌──────────┐    │   │
│  │  │PostgreSQL│  │  Redis   │    │   │
│  │  │  :5432   │  │  :6379   │    │   │
│  │  └──────────┘  └──────────┘    │   │
│  │                                 │   │
│  │  ┌──────────┐  ┌──────────┐    │   │
│  │  │ MongoDB  │  │ RabbitMQ │    │   │
│  │  │  :27017  │  │  :5672   │    │   │
│  │  └──────────┘  │  :15672  │    │   │
│  │                └──────────┘    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**왜 이런 구조인가?**
- **백엔드/프론트엔드**: 로컬에서 실행 (빠른 핫 리로드, 디버깅 편의성)
- **데이터베이스/메시지 큐**: Docker 컨테이너 (환경 격리, 일관성)

---

## 현재 구성

### 서비스 목록

| 서비스 | 이미지 | 포트 | 용도 |
|--------|--------|------|------|
| **PostgreSQL** | `postgres:16-alpine` | 5432 | 메인 관계형 DB (사용자, 게시글, 댓글 등) |
| **Redis** | `redis:7-alpine` | 6379 | 캐싱 + 조회수 임시 저장 |
| **MongoDB** | `mongo:7-jammy` | 27017 | 채팅 메시지 저장소 |
| **RabbitMQ** | `rabbitmq:3-management-alpine` | 5672 (AMQP)<br/>15672 (UI) | 비동기 작업 메시지 큐 |

### 볼륨

```yaml
volumes:
  postgres_data:   # PostgreSQL 데이터 영구 저장
  redis_data:      # Redis 데이터 영구 저장
  mongodb_data:    # MongoDB 데이터 영구 저장
  rabbitmq_data:   # RabbitMQ 메시지 영구 저장
```

### 네트워크

- **bridge 네트워크**: `board-network`
- 모든 컨테이너가 같은 네트워크에서 통신

---

## 서비스별 역할

### 1. PostgreSQL (관계형 데이터베이스)

**역할**: 메인 데이터 저장소

**저장 데이터**:
- 사용자 정보 (users)
- 게시글 (posts)
- 댓글 (comments)
- 좋아요 (likes)
- 팔로우 관계 (follows)
- 차단 정보 (blocks)
- 스토리 (stories)

**특징**:
- ACID 트랜잭션 보장
- 관계형 데이터 모델링
- 복잡한 JOIN 쿼리 가능

**접속 정보**:
```bash
Host: localhost
Port: 5432
Database: board_db
User: board_user
Password: board_password
```

---

### 2. Redis (인메모리 캐시)

**역할**: 고속 캐싱 + 조회수 임시 저장

**사용 사례**:
1. **게시글 목록 캐싱**
   - 키: `posts:list:page:1:limit:10:search:none:user:guest`
   - TTL: 300초 (5분)
   - 목적: DB 부하 감소

2. **조회수 임시 저장**
   - 키: `post:views:{게시글ID}`
   - 배치 작업으로 5분마다 DB 동기화
   - 목적: Write Heavy 작업 최적화

**특징**:
- 메모리 기반 (초고속)
- 원자적 연산 (INCR, DECR)
- 데이터 만료 (TTL) 지원

**접속 정보**:
```bash
Host: localhost
Port: 6379
Password: redis_password
```

**Redis CLI 접속**:
```bash
docker exec -it board-redis redis-cli -a redis_password
```

---

### 3. MongoDB (문서형 데이터베이스)

**역할**: 채팅 메시지 저장소

**저장 데이터**:
- 1:1 채팅 메시지
- 채팅방 정보

**특징**:
- Schema-less (유연한 구조)
- JSON 형태 저장
- 빠른 읽기/쓰기

**접속 정보**:
```bash
Host: localhost
Port: 27017
Database: board_chat
User: mongo_user
Password: mongo_password
```

**MongoDB Shell 접속**:
```bash
docker exec -it board-mongodb mongosh \
  -u mongo_user -p mongo_password \
  --authenticationDatabase admin
```

---

### 4. RabbitMQ (메시지 큐) ⭐

**역할**: 비동기 작업 처리를 위한 메시지 브로커

**현재 구성된 큐**:

#### 📧 Email Queue (`email-queue`)
**처리 작업**:
- 회원가입 환영 이메일
- 비밀번호 재설정 이메일
- 일반 알림 이메일

**메시지 패턴**:
- `email.welcome` - 회원가입 시
- `email.password.reset` - 비밀번호 찾기
- `email.notification` - 일반 알림

#### 🔔 Notification Queue (`notification-queue`)
**처리 작업**:
- 댓글 알림
- 답글 알림
- 좋아요 알림
- 팔로우 알림
- 채팅 알림

**메시지 패턴**:
- `notification.comment` - 내 게시글에 댓글
- `notification.reply` - 내 댓글에 답글
- `notification.like` - 좋아요 받음
- `notification.follow` - 누군가 나를 팔로우
- `notification.chat` - 새 채팅 메시지

#### 🖼️ Image Queue (`image-queue`)
**처리 작업**:
- 이미지 리사이징
- 이미지 최적화
- 썸네일 생성

**메시지 패턴**:
- `image.resize` - 이미지 크기 조정
- `image.optimize` - 용량 최적화
- `image.thumbnail` - 썸네일 생성

**Management UI 접속**:
```
URL: http://localhost:15672
Username: rabbitmq_user
Password: rabbitmq_password
```

**특징**:
- **비동기 처리**: 사용자 응답 속도 향상
- **재시도 메커니즘**: 실패 시 자동 재시도
- **메시지 영속성**: 서버 재시작에도 안전
- **확장성**: 추후 마이크로서비스 전환 가능

---

## RabbitMQ 현재 사용 사례

### 예시 1: 회원가입 시 환영 이메일

```typescript
// 1. 사용자가 회원가입 요청
POST /auth/register
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123"
}

// 2. 백엔드: 사용자 생성 (즉시 응답)
✅ 201 Created { "id": "...", "username": "john" }

// 3. 백엔드: RabbitMQ에 이메일 전송 메시지 발행 (비동기)
→ email-queue에 메시지 추가
{
  "pattern": "email.welcome",
  "data": {
    "to": "john@example.com",
    "username": "john"
  }
}

// 4. EmailConsumer: 백그라운드에서 이메일 발송
📨 이메일 발송 중...
✅ 이메일 발송 완료
```

**장점**:
- 사용자는 이메일 발송 완료를 기다리지 않음
- 이메일 발송 실패해도 메인 플로우는 성공
- 재시도 가능 (네트워크 오류 시)

### 예시 2: 댓글 알림

```typescript
// 1. 사용자 A가 사용자 B의 게시글에 댓글 작성
POST /posts/{postId}/comments
{
  "content": "Great post!"
}

// 2. 백엔드: 댓글 저장 (즉시 응답)
✅ 201 Created { "id": "...", "content": "Great post!" }

// 3. 백엔드: RabbitMQ에 알림 메시지 발행
→ notification-queue에 메시지 추가
{
  "pattern": "notification.comment",
  "data": {
    "postAuthorId": "user-B-id",
    "commenterUsername": "user-A",
    "postTitle": "게시글 제목",
    "commentContent": "Great post!"
  }
}

// 4. NotificationConsumer: 백그라운드에서 알림 전송
🔔 Socket.IO로 실시간 알림 전송
✅ 사용자 B에게 알림 도착
```

### 예시 3: 이미지 업로드 최적화

```typescript
// 1. 사용자가 프로필 이미지 업로드
POST /users/profile/image
{
  "file": <5MB 이미지>
}

// 2. 백엔드: 원본 이미지 저장 (즉시 응답)
✅ 200 OK { "imageUrl": "/uploads/original.jpg" }

// 3. 백엔드: RabbitMQ에 이미지 처리 메시지 발행
→ image-queue에 메시지 추가
{
  "pattern": "image.resize",
  "data": {
    "filePath": "/uploads/original.jpg",
    "sizes": [
      { "width": 200, "height": 200, "name": "thumbnail" },
      { "width": 800, "height": 800, "name": "medium" }
    ]
  }
}

// 4. ImageConsumer: 백그라운드에서 이미지 처리
🖼️ 썸네일 생성 중...
🖼️ 중간 크기 생성 중...
✅ 처리 완료
```

**장점**:
- 이미지 처리를 기다리지 않고 즉시 응답
- 여러 크기의 이미지를 동시 생성 가능
- CPU 집약적 작업을 백그라운드로 이동

---

## 빠른 시작

### 1. Docker Compose 실행

```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스만 시작
docker-compose up -d postgres redis
```

### 2. 서비스 상태 확인

```bash
# 컨테이너 상태 확인
docker-compose ps

# 헬스체크 확인
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

**예상 출력**:
```
NAME              STATUS                    PORTS
board-postgres    Up (healthy)              0.0.0.0:5432->5432/tcp
board-redis       Up (healthy)              0.0.0.0:6379->6379/tcp
board-mongodb     Up (healthy)              0.0.0.0:27017->27017/tcp
board-rabbitmq    Up (healthy)              0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp
```

### 3. 백엔드 실행

```bash
cd backend
npm install
npm run start:dev
```

### 4. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

### 5. RabbitMQ Management UI 접속

브라우저에서 http://localhost:15672 접속
- Username: `rabbitmq_user`
- Password: `rabbitmq_password`

**확인 사항**:
- Queues 탭에서 3개 큐 확인 (email-queue, notification-queue, image-queue)
- Connections 탭에서 백엔드 연결 확인

---

## 개발 워크플로우

### 일반적인 개발 흐름

```bash
# 1. 아침에 출근해서 Docker Compose 시작
docker-compose up -d

# 2. 백엔드 개발 서버 실행 (터미널 1)
cd backend && npm run start:dev

# 3. 프론트엔드 개발 서버 실행 (터미널 2)
cd frontend && npm run dev

# 4. 개발...

# 5. 퇴근 전 Docker Compose 중지
docker-compose down
```

### 데이터베이스 초기화

```bash
# 모든 데이터 삭제 후 재시작
docker-compose down -v
docker-compose up -d

# 시드 데이터 삽입
cd backend && npm run seed
```

### RabbitMQ 메시지 확인

```bash
# RabbitMQ 로그 실시간 확인
docker-compose logs -f rabbitmq

# 큐에 쌓인 메시지 개수 확인
# Management UI (http://localhost:15672) 에서 확인
```

---

## 향후 확장 계획

### Phase 1: 현재 상태 (로컬 개발)

```
[Backend (로컬)] → [Docker Containers]
                   - PostgreSQL
                   - Redis
                   - MongoDB
                   - RabbitMQ
```

### Phase 2: 백엔드 컨테이너화

```yaml
# docker-compose.yml에 백엔드 추가
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      - mongodb
      - rabbitmq
    environment:
      DATABASE_URL: postgresql://board_user:board_password@postgres:5432/board_db
```

**장점**:
- 팀원 간 환경 일치
- CI/CD 파이프라인 구축 가능
- 프로덕션 환경과 유사

### Phase 3: 마이크로서비스 분리

```
┌─────────────────────────────────────────┐
│  Docker Compose                         │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │  API     │  │  Auth    │            │
│  │  Gateway │  │  Service │            │
│  └────┬─────┘  └────┬─────┘            │
│       │             │                   │
│       ├─────────────┼────────┐          │
│       │             │        │          │
│  ┌────▼─────┐  ┌───▼────┐ ┌─▼──────┐  │
│  │  Post    │  │ User   │ │ Chat   │  │
│  │  Service │  │ Service│ │ Service│  │
│  └────┬─────┘  └───┬────┘ └─┬──────┘  │
│       │            │         │          │
│       └────────────┼─────────┘          │
│                    │                    │
│         ┌──────────▼──────────┐         │
│         │     RabbitMQ        │         │
│         │  (서비스 간 통신)    │         │
│         └─────────────────────┘         │
└─────────────────────────────────────────┘
```

**RabbitMQ 역할 확장**:
- 서비스 간 비동기 통신
- 이벤트 기반 아키텍처
- 서비스 디커플링

### Phase 4: 스케일 아웃

```yaml
# docker-compose.yml - 복제본 생성
services:
  backend:
    deploy:
      replicas: 3  # 백엔드 3개 복제

  nginx:
    # 로드 밸런서 활성화
```

**RabbitMQ 역할**:
- 작업 분산 (Work Queue)
- 여러 Consumer가 메시지 처리
- 부하 분산

### Phase 5: 프로덕션 배포

```
┌─────────────────────────────────────────┐
│  AWS / Azure / GCP                      │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │  ECS /   │  │  RDS     │            │
│  │  EKS     │  │(Postgres)│            │
│  └──────────┘  └──────────┘            │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ ElastiC- │  │  Amazon  │            │
│  │ ache     │  │  MQ      │            │
│  │ (Redis)  │  │(RabbitMQ)│            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
```

**관리형 서비스 전환**:
- Amazon MQ (RabbitMQ 관리형)
- Amazon ElastiCache (Redis 관리형)
- Amazon RDS (PostgreSQL 관리형)

---

## 트러블슈팅

### 문제 1: PostgreSQL 연결 실패

**증상**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**해결**:
```bash
# 1. PostgreSQL 컨테이너 상태 확인
docker-compose ps postgres

# 2. 로그 확인
docker-compose logs postgres

# 3. 재시작
docker-compose restart postgres

# 4. 헬스체크 확인
docker exec board-postgres pg_isready -U board_user -d board_db
```

### 문제 2: RabbitMQ 연결 실패

**증상**:
```
Error: Failed to connect to amqp://localhost:5672
```

**해결**:
```bash
# 1. RabbitMQ 컨테이너 상태 확인
docker-compose ps rabbitmq

# 2. 로그 확인
docker-compose logs rabbitmq

# 3. 연결 테스트
docker exec board-rabbitmq rabbitmq-diagnostics ping

# 4. Management UI 접속 확인
curl http://localhost:15672
```

### 문제 3: Redis 인증 실패

**증상**:
```
Error: NOAUTH Authentication required
```

**해결**:
```bash
# .env 파일에 비밀번호 설정 확인
REDIS_PASSWORD=redis_password

# Redis CLI로 연결 테스트
docker exec -it board-redis redis-cli -a redis_password ping
# 응답: PONG
```

### 문제 4: 포트 충돌

**증상**:
```
Error: Bind for 0.0.0.0:5432 failed: port is already allocated
```

**해결**:
```bash
# 1. 포트 사용 중인 프로세스 확인 (macOS)
lsof -i :5432

# 2. 포트 사용 중인 프로세스 확인 (Linux)
sudo netstat -tulpn | grep 5432

# 3-1. 기존 프로세스 종료 또는
# 3-2. docker-compose.yml에서 포트 변경
ports:
  - "15432:5432"  # 호스트 포트 변경
```

### 문제 5: 볼륨 데이터 초기화

**증상**:
```
데이터가 꼬여서 처음부터 다시 시작하고 싶어요
```

**해결**:
```bash
# 모든 컨테이너와 볼륨 삭제
docker-compose down -v

# 다시 시작
docker-compose up -d

# 시드 데이터 삽입
cd backend && npm run seed
```

---

## 모니터링

### PostgreSQL 쿼리 모니터링

```bash
# 실행 중인 쿼리 확인
docker exec -it board-postgres psql -U board_user -d board_db \
  -c "SELECT pid, usename, state, query FROM pg_stat_activity WHERE state != 'idle';"
```

### Redis 메모리 사용량 확인

```bash
docker exec -it board-redis redis-cli -a redis_password INFO memory
```

### RabbitMQ 큐 상태 확인

```bash
# 큐 목록 및 메시지 개수
docker exec board-rabbitmq rabbitmqctl list_queues name messages

# 연결된 클라이언트 확인
docker exec board-rabbitmq rabbitmqctl list_connections
```

### 전체 컨테이너 리소스 사용량

```bash
docker stats
```

---

## 백업 및 복구

### PostgreSQL 백업

```bash
# 백업 생성
docker exec board-postgres pg_dump -U board_user board_db > backup.sql

# 복구
docker exec -i board-postgres psql -U board_user board_db < backup.sql
```

### MongoDB 백업

```bash
# 백업 생성
docker exec board-mongodb mongodump \
  -u mongo_user -p mongo_password \
  --authenticationDatabase admin \
  --out /backup

# 복구
docker exec board-mongodb mongorestore \
  -u mongo_user -p mongo_password \
  --authenticationDatabase admin \
  /backup
```

---

## 추가 리소스

### 공식 문서
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [Redis 문서](https://redis.io/docs/)
- [MongoDB 문서](https://www.mongodb.com/docs/)
- [RabbitMQ 문서](https://www.rabbitmq.com/documentation.html)

### 관련 프로젝트 문서
- [Backend API 문서](./backend/README.md)
- [Frontend 문서](./frontend/README.md)
- [데이터베이스 최적화 가이드](./DATABASE_OPTIMIZATION_GUIDE.md)

---

**마지막 업데이트**: 2025-01-22
**작성자**: Board Project Team
