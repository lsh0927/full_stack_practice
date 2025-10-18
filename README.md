# 📝 Board Project

풀스택 게시판 애플리케이션 - NestJS + Next.js + PostgreSQL + JWT 인증

## 📚 목차

- [프로젝트 소개](#-프로젝트-소개)
- [기술 스택](#-기술-스택)
- [아키텍처](#-아키텍처)
- [주요 기능](#-주요-기능)
- [시작하기](#-시작하기)
- [API 명세](#-api-명세)
- [프로젝트 구조](#-프로젝트-구조)
- [환경 변수](#-환경-변수)
- [개발 가이드](#-개발-가이드)

---

## 🎯 프로젝트 소개

현대적인 풀스택 웹 개발 기술을 활용한 게시판 애플리케이션입니다.
백엔드는 NestJS + PostgreSQL + TypeORM으로 구현하고, JWT 기반 인증 시스템을 적용했습니다.
프론트엔드는 Next.js 15 App Router를 사용하여 SSR/CSR 하이브리드 렌더링을 구현했습니다.

### 프로젝트 목표
- RESTful API 설계 및 구현
- JWT 기반 인증 시스템 (Spring Security 패턴)
- TypeORM을 활용한 N+1 쿼리 방지
- PostgreSQL을 활용한 관계형 데이터 모델링
- TypeScript를 활용한 타입 안전성 확보
- Docker를 활용한 개발 환경 표준화
- 페이지네이션 및 검색 기능 구현
- React Strict Mode 환경에서의 최적화

---

## 🛠 기술 스택

### Backend
- **NestJS** `11.0.1` - Progressive Node.js Framework
- **TypeScript** `5.7.3` - Type-safe JavaScript
- **PostgreSQL** `16` - Relational Database
- **TypeORM** `0.3.21` - ORM for TypeScript/JavaScript
- **Passport** `0.7.0` - Authentication middleware
- **JWT** `10.2.0` - JSON Web Token
- **bcrypt** `5.1.1` - Password hashing
- **class-validator** - DTO 유효성 검사
- **class-transformer** - 객체 변환

### Frontend
- **Next.js** `15.5.6` - React Framework with App Router
- **React** `19.1.0` - UI Library
- **TypeScript** `5` - Type-safe JavaScript
- **Tailwind CSS** `4` - Utility-first CSS Framework

### Infrastructure
- **Docker** - 컨테이너화
- **Docker Compose** - 멀티 컨테이너 오케스트레이션
- **PostgreSQL 16 Alpine** - 데이터베이스 컨테이너
- **Redis** `7` - 캐싱 (설정됨, 향후 확장 가능)

### Development Tools
- **ESLint** - 코드 품질 관리
- **Prettier** - 코드 포맷팅
- **Jest** - 테스팅 프레임워크

---

## 🏗 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│                    (Web Browser)                             │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│                   Port: 3001                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  App Router (SSR/CSR Hybrid)                        │   │
│  │  - / (홈페이지)                                      │   │
│  │  - /posts (게시글 목록)                              │   │
│  │  - /posts/[id] (게시글 상세)                         │   │
│  │  - /posts/new (게시글 작성) 🔐                       │   │
│  │  - /auth/login (로그인)                              │   │
│  │  - /auth/signup (회원가입)                           │   │
│  │                                                       │   │
│  │  AuthContext - JWT 토큰 관리, 사용자 상태 관리       │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API (Authorization: Bearer <token>)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (NestJS)                            │
│                   Port: 3001                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔐 Authentication (Passport + JWT)                 │   │
│  │  - LocalStrategy (email/password)                   │   │
│  │  - JwtStrategy (Bearer token)                       │   │
│  │  - JwtAuthGuard (Spring Security와 유사)           │   │
│  │  - @CurrentUser decorator                           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Controllers                                         │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  AuthController                             │   │   │
│  │  │  - POST /auth/signup                        │   │   │
│  │  │  - POST /auth/login                         │   │   │
│  │  │  - GET /auth/me 🔐                          │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  PostsController                            │   │   │
│  │  │  - CRUD Operations                          │   │   │
│  │  │  - Pagination & Search                      │   │   │
│  │  │  - View Count Management                    │   │   │
│  │  │  - 생성/수정/삭제: JWT 인증 필수 🔐         │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Services                                            │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  AuthService                                │   │   │
│  │  │  - bcrypt 비밀번호 해싱                     │   │   │
│  │  │  - JWT 토큰 생성/검증                       │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  PostsService                               │   │   │
│  │  │  - Business Logic                           │   │   │
│  │  │  - TypeORM QueryBuilder (N+1 방지)         │   │   │
│  │  │  - leftJoinAndSelect로 author 조회         │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ TypeORM
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Docker Compose Services                         │
│  ┌───────────────────────┐  ┌──────────────────────────┐   │
│  │  PostgreSQL 16         │  │  Redis                   │   │
│  │  Port: 5432            │  │  Port: 6379              │   │
│  │  - users 테이블        │  │  - Cache (Future Use)    │   │
│  │  - posts 테이블        │  │  - Session (Future Use)  │   │
│  │  - FK: authorId → id   │  │  - Volume: redis_data    │   │
│  │  - Volume: postgres_data│  │                          │   │
│  └───────────────────────┘  └──────────────────────────┘   │
│  ┌───────────────────────┐                                  │
│  │  MongoDB (migration)   │  ⚠️ --profile migration 시에만  │
│  │  Port: 27017           │     실행 (데이터 마이그레이션용) │
│  └───────────────────────┘                                  │
│                                                              │
│              Network: board-network                          │
└─────────────────────────────────────────────────────────────┘
```

### 데이터베이스 스키마

```sql
-- users 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,  -- bcrypt 해싱
  username VARCHAR NOT NULL,
  profile_image VARCHAR,
  provider VARCHAR,           -- 'local' | 'kakao'
  provider_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- posts 테이블
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

### 인증 흐름

```
[회원가입]
클라이언트 → POST /auth/signup { email, password, username }
           → AuthService: bcrypt로 비밀번호 해싱
           → UsersService: DB에 저장
           → JWT 토큰 생성 및 반환
           → 클라이언트: localStorage에 토큰 저장

[로그인]
클라이언트 → POST /auth/login { email, password }
           → LocalStrategy: 이메일/비밀번호 검증
           → bcrypt.compare()로 비밀번호 확인
           → JWT 토큰 생성 및 반환
           → 클라이언트: localStorage에 토큰 저장

[인증이 필요한 요청]
클라이언트 → Authorization: Bearer <token>
           → JwtAuthGuard: 토큰 추출
           → JwtStrategy: 토큰 검증 및 payload 추출
           → @CurrentUser: 사용자 정보를 컨트롤러에 전달
           → 비즈니스 로직 실행
```

---

## ✨ 주요 기능

### 1. 인증 시스템 🔐
- ✅ 회원가입 (이메일, 비밀번호, 사용자명)
- ✅ 로그인 (JWT 토큰 발급)
- ✅ 로그아웃 (클라이언트 토큰 제거)
- ✅ 비밀번호 bcrypt 해싱 (salt rounds: 10)
- ✅ JWT 기반 인증 (Bearer token)
- ✅ 토큰 자동 복원 (localStorage)
- ✅ 보호된 라우트 (로그인 필요)
- 🚧 카카오 OAuth2 (준비됨, 미구현)

### 2. 게시글 관리 (CRUD)
- ✅ 게시글 생성 (제목, 내용) 🔐 **인증 필수**
- ✅ 게시글 목록 조회 (페이지네이션)
- ✅ 게시글 상세 조회 (작성자 정보 포함)
- ✅ 게시글 수정 🔐 **작성자만 가능**
- ✅ 게시글 삭제 🔐 **작성자만 가능**
- ✅ N+1 쿼리 방지 (leftJoinAndSelect)

### 3. 검색 & 필터링
- ✅ 제목/내용 통합 검색 (ILIKE, 대소문자 구분 없음)
- ✅ 실시간 검색 결과 반영
- ✅ 검색 초기화 기능

### 4. 페이지네이션
- ✅ 페이지당 10개 게시글 표시
- ✅ 페이지 번호 네비게이션
- ✅ 전체 게시글 수 표시

### 5. 조회수 시스템
- ✅ 게시글 조회 시 조회수 자동 증가
- ✅ React Strict Mode 대응 (useRef 활용)
- ✅ Atomic operation으로 동시성 보장

### 6. UI/UX
- ✅ 인스타그램 스타일 모던 UI
- ✅ 반응형 디자인 (Tailwind CSS)
- ✅ 로딩 상태 표시
- ✅ 에러 핸들링 및 사용자 피드백
- ✅ 날짜 포맷팅 (상대 시간)
- ✅ 로그인 상태에 따른 헤더 변경

---

## 🚀 시작하기

### 사전 요구사항

다음 프로그램들이 설치되어 있어야 합니다:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** >= 20.10.0
- **Docker Compose** >= 2.0.0

### 설치 및 실행

#### 1. 저장소 클론

```bash
git clone https://github.com/lsh0927/full_stack_practice.git
cd full_stack_practice
```

#### 2. Docker 서비스 시작

PostgreSQL을 Docker Compose로 실행합니다.

```bash
docker-compose up -d postgres
```

서비스 확인:
```bash
docker-compose ps
```

예상 출력:
```
NAME                IMAGE                  STATUS                   PORTS
board-postgres      postgres:16-alpine     Up 2 minutes (healthy)   0.0.0.0:5432->5432/tcp
```

#### 3. 백엔드 환경 변수 설정

```bash
cd backend

# .env 파일 생성 (.env.example 참고)
cat > .env <<EOF
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=admin
DATABASE_PASSWORD=admin123
DATABASE_NAME=board

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d
EOF
```

#### 4. 백엔드 실행

```bash
cd backend

# 의존성 설치
npm install

# 개발 모드로 실행
npm run start:dev
```

백엔드가 `http://localhost:3001`에서 실행됩니다.

**중요**: TypeORM의 `synchronize: true` 옵션으로 인해 첫 실행 시 자동으로 테이블이 생성됩니다.

API 헬스 체크:
```bash
curl http://localhost:3001
# 출력: {"message":"Hello World!"}
```

#### 5. 프론트엔드 실행

새 터미널을 열어 프론트엔드를 실행합니다.

```bash
cd frontend

# 의존성 설치
npm install

# .env.local 파일 생성 (선택사항)
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# 개발 모드로 실행
npm run dev
```

프론트엔드가 `http://localhost:3000`에서 실행됩니다.

#### 6. 애플리케이션 접속

브라우저에서 http://localhost:3000 을 열면 게시판 애플리케이션을 사용할 수 있습니다.

**첫 사용 가이드:**
1. 회원가입 버튼 클릭
2. 이메일, 비밀번호, 사용자명 입력
3. 자동으로 로그인되고 JWT 토큰이 발급됩니다
4. "작성" 버튼으로 게시글을 작성할 수 있습니다

### 종료하기

```bash
# 백엔드 종료 (Ctrl + C)
# 프론트엔드 종료 (Ctrl + C)

# Docker 서비스 종료
docker-compose down

# 볼륨까지 삭제하려면 (데이터베이스 데이터 삭제됨)
docker-compose down -v
```

---

## 📡 API 명세

### Base URL
```
http://localhost:3001
```

### Authentication Endpoints

#### 1. 회원가입
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "홍길동"
}
```

**응답 (201 Created)**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "홍길동"
  }
}
```

#### 2. 로그인
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답 (200 OK)**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "홍길동"
  }
}
```

#### 3. 현재 사용자 정보 조회
```http
GET /auth/me
Authorization: Bearer <access_token>
```

**응답 (200 OK)**
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "username": "홍길동",
  "profileImage": null,
  "provider": "local"
}
```

### Posts Endpoints

#### 1. 게시글 생성 🔐
```http
POST /posts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "게시글 제목",
  "content": "게시글 내용"
}
```

**응답 (201 Created)**
```json
{
  "id": "uuid-here",
  "title": "게시글 제목",
  "content": "게시글 내용",
  "views": 0,
  "authorId": "user-uuid",
  "createdAt": "2025-01-18T10:30:00.000Z",
  "updatedAt": "2025-01-18T10:30:00.000Z",
  "author": {
    "id": "user-uuid",
    "username": "홍길동",
    "email": "user@example.com"
  }
}
```

#### 2. 게시글 목록 조회
```http
GET /posts?page=1&limit=10&search=검색어
```

**응답 (200 OK)**
```json
{
  "posts": [
    {
      "id": "uuid-here",
      "title": "게시글 제목",
      "content": "게시글 내용",
      "views": 5,
      "createdAt": "2025-01-18T10:30:00.000Z",
      "author": {
        "id": "user-uuid",
        "username": "홍길동",
        "email": "user@example.com"
      }
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 10
}
```

#### 3. 게시글 상세 조회
```http
GET /posts/:id
```

**응답 (200 OK)**
```json
{
  "id": "uuid-here",
  "title": "게시글 제목",
  "content": "게시글 내용",
  "views": 5,
  "createdAt": "2025-01-18T10:30:00.000Z",
  "author": {
    "id": "user-uuid",
    "username": "홍길동",
    "email": "user@example.com"
  }
}
```

#### 4. 조회수 증가
```http
POST /posts/:id/views
```

#### 5. 게시글 수정 🔐
```http
PATCH /posts/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "수정된 제목",
  "content": "수정된 내용"
}
```

**권한**: 작성자만 수정 가능

#### 6. 게시글 삭제 🔐
```http
DELETE /posts/:id
Authorization: Bearer <access_token>
```

**응답 (204 No Content)**

**권한**: 작성자만 삭제 가능

---

## 📁 프로젝트 구조

```
board-project/
├── backend/                      # NestJS 백엔드
│   ├── src/
│   │   ├── auth/                 # 인증 모듈
│   │   │   ├── decorators/       # 커스텀 데코레이터
│   │   │   │   └── current-user.decorator.ts
│   │   │   ├── dto/
│   │   │   │   └── login.dto.ts
│   │   │   ├── guards/           # 인증 가드
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── local-auth.guard.ts
│   │   │   ├── strategies/       # Passport 전략
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── users/                # 사용자 모듈
│   │   │   ├── dto/
│   │   │   │   └── create-user.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── posts/                # 게시글 모듈
│   │   │   ├── dto/
│   │   │   │   ├── create-post.dto.ts
│   │   │   │   └── update-post.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── post.entity.ts  # TypeORM Entity
│   │   │   ├── posts.controller.ts
│   │   │   ├── posts.service.ts    # N+1 방지 로직
│   │   │   └── posts.module.ts
│   │   ├── app.module.ts         # TypeORM 설정
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   └── main.ts               # CORS, Validation Pipe
│   ├── .env                      # 환경 변수
│   ├── .env.example              # 환경 변수 템플릿
│   └── package.json
│
├── frontend/                     # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/                  # App Router
│   │   │   ├── auth/             # 인증 페이지
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── signup/
│   │   │   │       └── page.tsx
│   │   │   ├── posts/            # 게시글 페이지
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx  # 상세 조회
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx  # 작성 (인증 필요)
│   │   │   │   └── page.tsx      # 목록
│   │   │   ├── layout.tsx        # AuthProvider 래핑
│   │   │   └── page.tsx          # 홈
│   │   ├── contexts/             # React Context
│   │   │   └── AuthContext.tsx   # 인증 상태 관리
│   │   └── types/
│   │       └── post.ts
│   └── package.json
│
├── docker-compose.yml            # PostgreSQL, Redis, MongoDB
├── .gitignore
└── README.md
```

---

## 🔐 환경 변수

### Backend (.env)

```env
# PostgreSQL Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=admin
DATABASE_PASSWORD=admin123
DATABASE_NAME=board

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d
```

### Frontend (.env.local)

```env
# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 💻 개발 가이드

### 백엔드 개발

#### TypeORM 마이그레이션 생성
```bash
cd backend
npm run typeorm migration:generate -- -n MigrationName
npm run typeorm migration:run
```

#### 테스트 실행
```bash
npm test
npm run test:e2e
npm run test:cov
```

#### 프로덕션 빌드
```bash
npm run build
npm run start:prod
```

**중요**: 프로덕션에서는 `synchronize: false`로 설정하고 마이그레이션을 사용하세요.

### 프론트엔드 개발

#### 새로운 페이지 추가
```bash
mkdir -p src/app/new-page
touch src/app/new-page/page.tsx
```

#### 프로덕션 빌드
```bash
npm run build
npm start
```

---

## 🐛 문제 해결

### PostgreSQL 연결 오류
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**해결 방법:**
```bash
docker-compose ps
docker-compose restart postgres
docker logs board-postgres
```

### JWT 토큰 만료
```
401 Unauthorized
```

**해결 방법:**
1. 로그아웃 후 다시 로그인
2. `.env`의 `JWT_EXPIRATION` 값 확인

### CORS 오류

`main.ts`에서 CORS 설정 확인:
```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

---

## 📈 향후 개선 사항

- [x] JWT 기반 인증 시스템
- [x] PostgreSQL + TypeORM 마이그레이션
- [x] N+1 쿼리 방지
- [ ] 카카오 OAuth2 로그인
- [ ] Redis를 활용한 캐싱
- [ ] 댓글 기능
- [ ] 파일 업로드 (이미지)
- [ ] 실시간 알림 (WebSocket)
- [ ] 좋아요 기능
- [ ] 게시글 카테고리
- [ ] 관리자 대시보드
- [ ] E2E 테스트
- [ ] CI/CD 파이프라인

---

## 📄 라이선스

이 프로젝트는 개인 학습 목적으로 제작되었습니다.

---

## 👨‍💻 개발자

**이승헌** - [GitHub](https://github.com/lsh0927)

---

## 🙏 감사의 글

이 프로젝트는 크래프톤 정글 10기 과정 중 학습 목적으로 개발되었습니다.

---

**마지막 업데이트:** 2025-01-18
