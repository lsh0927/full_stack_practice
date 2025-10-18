# 📝 Board Project

풀스택 게시판 애플리케이션 - NestJS + Next.js + MongoDB

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

이 프로젝트는 현대적인 풀스택 웹 개발 기술을 활용한 게시판 애플리케이션입니다.
백엔드는 NestJS로 RESTful API를 구현하고, 프론트엔드는 Next.js 15의 App Router를 사용하여
서버 사이드 렌더링과 클라이언트 사이드 렌더링을 혼합한 하이브리드 렌더링을 구현했습니다.

### 프로젝트 목표
- RESTful API 설계 및 구현
- TypeScript를 활용한 타입 안전성 확보
- Docker를 활용한 개발 환경 표준화
- 페이지네이션 및 검색 기능 구현
- React Strict Mode 환경에서의 최적화

---

## 🛠 기술 스택

### Backend
- **NestJS** `11.0.1` - Progressive Node.js Framework
- **TypeScript** `5.7.3` - Type-safe JavaScript
- **MongoDB** `7.0` - NoSQL Database
- **Mongoose** `8.19.1` - MongoDB ODM
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
│  │  - /posts (게시글 목록)                              │   │
│  │  - /posts/[id] (게시글 상세)                         │   │
│  │  - /posts/new (게시글 작성)                          │   │
│  │  - /posts/[id]/edit (게시글 수정)                    │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (NestJS)                            │
│                   Port: 3000                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Controllers                                         │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  PostsController                            │   │   │
│  │  │  - CRUD Operations                          │   │   │
│  │  │  - Pagination & Search                      │   │   │
│  │  │  - View Count Management                    │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Services                                            │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  PostsService                               │   │   │
│  │  │  - Business Logic                           │   │   │
│  │  │  - Database Operations                      │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ Mongoose ODM
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Docker Compose Services                         │
│  ┌───────────────────────┐  ┌──────────────────────────┐   │
│  │  MongoDB               │  │  Redis                   │   │
│  │  Port: 27017           │  │  Port: 6379              │   │
│  │  - Posts Collection    │  │  - Cache (Future Use)    │   │
│  │  - Auth: admin/***     │  │  - Session (Future Use)  │   │
│  │  - Volume: mongodb_data│  │  - Volume: redis_data    │   │
│  └───────────────────────┘  └──────────────────────────┘   │
│                                                              │
│              Network: board-network                          │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 흐름

```
[사용자 요청]
    ↓
[Next.js Frontend] - 사용자 인터랙션 처리
    ↓
[fetch API] - REST API 호출
    ↓
[NestJS Controller] - 요청 검증 및 라우팅
    ↓
[Service Layer] - 비즈니스 로직 처리
    ↓
[Mongoose ODM] - 데이터 모델링 및 쿼리
    ↓
[MongoDB] - 데이터 저장소
    ↓
[응답 반환] - JSON 형식
    ↓
[Frontend 렌더링] - UI 업데이트
```

---

## ✨ 주요 기능

### 1. 게시글 관리 (CRUD)
- ✅ 게시글 생성 (제목, 내용, 작성자)
- ✅ 게시글 목록 조회 (페이지네이션)
- ✅ 게시글 상세 조회
- ✅ 게시글 수정
- ✅ 게시글 삭제

### 2. 검색 & 필터링
- ✅ 제목/내용 통합 검색 (대소문자 구분 없음)
- ✅ 실시간 검색 결과 반영
- ✅ 검색 초기화 기능

### 3. 페이지네이션
- ✅ 페이지당 10개 게시글 표시
- ✅ 페이지 번호 네비게이션
- ✅ 전체 게시글 수 표시

### 4. 조회수 시스템
- ✅ 게시글 조회 시 조회수 자동 증가
- ✅ React Strict Mode 대응 (useRef 활용)
- ✅ Atomic operation으로 동시성 보장

### 5. UI/UX
- ✅ 반응형 디자인 (Tailwind CSS)
- ✅ 로딩 상태 표시
- ✅ 에러 핸들링 및 사용자 피드백
- ✅ 삭제 확인 다이얼로그
- ✅ 날짜 포맷팅 (한국어)

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

MongoDB와 Redis를 Docker Compose로 실행합니다.

```bash
docker-compose up -d
```

서비스 확인:
```bash
docker-compose ps
```

예상 출력:
```
NAME                IMAGE               STATUS              PORTS
board-mongodb       mongo:7.0           Up 2 minutes        0.0.0.0:27017->27017/tcp
board-redis         redis:7-alpine      Up 2 minutes        0.0.0.0:6379->6379/tcp
```

#### 3. 백엔드 설정 및 실행

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일이 이미 있는지 확인)
# 없다면 .env 파일 생성:
echo "MONGODB_URI=mongodb://admin:admin123@localhost:27017/board?authSource=admin" > .env

# 개발 모드로 실행
npm run start:dev
```

백엔드가 `http://localhost:3000`에서 실행됩니다.

API 헬스 체크:
```bash
curl http://localhost:3000
# 출력: {"message":"Hello World!"}
```

#### 4. 프론트엔드 설정 및 실행

새 터미널을 열어 프론트엔드를 실행합니다.

```bash
cd frontend

# 의존성 설치
npm install

# 개발 모드로 실행
npm run dev
```

프론트엔드가 `http://localhost:3001`에서 실행됩니다.

#### 5. 애플리케이션 접속

브라우저에서 http://localhost:3001 을 열면 게시판 애플리케이션을 사용할 수 있습니다.

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
http://localhost:3000
```

### Endpoints

#### 1. 게시글 생성
```http
POST /posts
Content-Type: application/json

{
  "title": "게시글 제목",
  "content": "게시글 내용",
  "author": "작성자"
}
```

**응답 (201 Created)**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "title": "게시글 제목",
  "content": "게시글 내용",
  "author": "작성자",
  "views": 0,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### 2. 게시글 목록 조회
```http
GET /posts?page=1&limit=10&search=검색어
```

**Query Parameters**
- `page` (optional): 페이지 번호 (default: 1)
- `limit` (optional): 페이지당 게시글 수 (default: 10)
- `search` (optional): 검색어 (제목/내용 검색)

**응답 (200 OK)**
```json
{
  "posts": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "게시글 제목",
      "content": "게시글 내용",
      "author": "작성자",
      "views": 5,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
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
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "title": "게시글 제목",
  "content": "게시글 내용",
  "author": "작성자",
  "views": 5,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### 4. 조회수 증가
```http
POST /posts/:id/views
```

**응답 (200 OK)**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "title": "게시글 제목",
  "content": "게시글 내용",
  "author": "작성자",
  "views": 6,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### 5. 게시글 수정
```http
PATCH /posts/:id
Content-Type: application/json

{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "author": "수정된 작성자"
}
```

**응답 (200 OK)**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "title": "수정된 제목",
  "content": "수정된 내용",
  "author": "수정된 작성자",
  "views": 5,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

#### 6. 게시글 삭제
```http
DELETE /posts/:id
```

**응답 (204 No Content)**

---

## 📁 프로젝트 구조

```
board-project/
├── backend/                      # NestJS 백엔드
│   ├── src/
│   │   ├── posts/                # Posts 모듈
│   │   │   ├── dto/              # Data Transfer Objects
│   │   │   │   ├── create-post.dto.ts
│   │   │   │   └── update-post.dto.ts
│   │   │   ├── entities/         # 엔티티 정의
│   │   │   │   └── post.entity.ts
│   │   │   ├── posts.controller.ts  # REST API 컨트롤러
│   │   │   ├── posts.service.ts     # 비즈니스 로직
│   │   │   └── posts.module.ts      # 모듈 정의
│   │   ├── app.module.ts         # 루트 모듈
│   │   ├── app.controller.ts     # 앱 컨트롤러
│   │   ├── app.service.ts        # 앱 서비스
│   │   └── main.ts               # 진입점
│   ├── test/                     # E2E 테스트
│   ├── .env                      # 환경 변수
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
├── frontend/                     # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/                  # App Router
│   │   │   ├── posts/            # 게시글 페이지
│   │   │   │   ├── [id]/         # 동적 라우팅
│   │   │   │   │   ├── page.tsx  # 게시글 상세
│   │   │   │   │   └── edit/
│   │   │   │   │       └── page.tsx  # 게시글 수정
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx  # 게시글 작성
│   │   │   │   └── page.tsx      # 게시글 목록
│   │   │   ├── layout.tsx        # 루트 레이아웃
│   │   │   └── page.tsx          # 홈 페이지
│   │   └── types/                # TypeScript 타입 정의
│   │       └── post.ts
│   ├── public/                   # 정적 파일
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── postcss.config.mjs
│
├── docker-compose.yml            # Docker Compose 설정
├── .gitignore                    # Git 제외 파일
└── README.md                     # 프로젝트 문서
```

---

## 🔐 환경 변수

### Backend (.env)

```env
# MongoDB 연결 URI
MONGODB_URI=mongodb://admin:admin123@localhost:27017/board?authSource=admin
```

### Frontend

프론트엔드는 현재 하드코딩된 API URL을 사용합니다:
```typescript
const API_URL = 'http://localhost:3000';
```

프로덕션 환경에서는 환경 변수로 변경하는 것을 권장합니다:

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 💻 개발 가이드

### 백엔드 개발

#### 새로운 모듈 추가
```bash
cd backend
nest generate module <module-name>
nest generate controller <module-name>
nest generate service <module-name>
```

#### 테스트 실행
```bash
# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e

# 커버리지
npm run test:cov
```

#### 프로덕션 빌드
```bash
npm run build
npm run start:prod
```

### 프론트엔드 개발

#### 새로운 페이지 추가
```bash
# src/app 내에 새 디렉토리 생성
mkdir -p src/app/new-page
touch src/app/new-page/page.tsx
```

#### 타입 정의 추가
```typescript
// src/types/example.ts
export interface Example {
  id: string;
  name: string;
}
```

#### 프로덕션 빌드
```bash
npm run build
npm start
```

### 코드 품질

#### Linting
```bash
# 백엔드
cd backend
npm run lint

# 프론트엔드
cd frontend
npm run lint
```

#### 포맷팅
```bash
cd backend
npm run format
```

---

## 🐛 문제 해결

### MongoDB 연결 오류
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**해결 방법:**
1. Docker Compose가 실행 중인지 확인
   ```bash
   docker-compose ps
   ```
2. MongoDB 컨테이너 재시작
   ```bash
   docker-compose restart mongodb
   ```

### 포트 충돌
```
Error: listen EADDRINUSE: address already in use :::3000
```

**해결 방법:**
1. 사용 중인 프로세스 종료
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9

   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```
2. 또는 다른 포트 사용
   ```bash
   # main.ts 또는 next.config.ts에서 포트 변경
   ```

### CORS 오류
```
Access to fetch at 'http://localhost:3000/posts' from origin 'http://localhost:3001' has been blocked by CORS policy
```

**해결 방법:**
백엔드 `main.ts`에 CORS 설정이 올바른지 확인:
```typescript
app.enableCors({
  origin: 'http://localhost:3001',
  credentials: true,
});
```

---

## 📈 향후 개선 사항

- [ ] 사용자 인증 및 권한 관리 (JWT)
- [ ] Redis를 활용한 캐싱 구현
- [ ] 댓글 기능 추가
- [ ] 파일 업로드 (이미지, 첨부파일)
- [ ] 실시간 알림 (WebSocket)
- [ ] 좋아요/싫어요 기능
- [ ] 게시글 카테고리 분류
- [ ] 관리자 대시보드
- [ ] E2E 테스트 작성
- [ ] CI/CD 파이프라인 구축

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
