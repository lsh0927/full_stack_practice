# Redis 캐싱 시스템

## 개요

본 프로젝트는 Redis를 활용하여 데이터베이스 부하를 줄이고 응답 속도를 개선합니다.

## Redis 사용 위치

### 1. 게시글 목록 캐싱

**목적**: 반복적인 DB 쿼리 감소를 통한 성능 향상

**구현 위치**: `backend/src/posts/posts.service.ts`

**동작 방식**:
- 게시글 목록 조회 시 먼저 Redis 캐시 확인
- 캐시 히트: Redis에서 바로 반환 (DB 쿼리 생략)
- 캐시 미스: DB 조회 후 Redis에 저장 (TTL: 5분)
- 캐시 키 형식: `posts:list:page:{page}:limit:{limit}:search:{search}:user:{userId}`

**캐시 무효화**:
- 게시글 생성 시
- 게시글 수정 시
- 게시글 삭제 시

```typescript
// 캐시 확인
const cachedData = await this.redisService.get(cacheKey);
if (cachedData) {
  return cachedData; // 캐시된 데이터 반환
}

// DB 조회 후 캐시 저장
const result = await this.postRepository.findAndCount(...);
await this.redisService.set(cacheKey, result, 300); // TTL: 5분
```

### 2. 조회수 임시 저장 (Write-Behind 패턴)

**목적**: DB Write 부하 감소 및 동시성 처리

**구현 위치**:
- `backend/src/posts/posts.service.ts` (조회수 증가)
- `backend/src/posts/posts-views.scheduler.ts` (배치 동기화)

**동작 방식**:
1. 게시글 조회 시 Redis INCR로 조회수 증가 (atomic 연산)
2. Redis 키 형식: `post:views:{postId}`
3. 5분마다 스케줄러가 Redis 데이터를 DB에 배치 업데이트
4. 동기화 완료 후 Redis 키 삭제

```typescript
// 조회수 증가 (매우 빠름)
await this.redisService.incr(`post:views:${id}`, 1);

// 5분마다 배치 동기화 (Cron Job)
@Cron(CronExpression.EVERY_5_MINUTES)
async syncViewsToDatabase() {
  const keys = await this.redisService.keys('post:views:*');
  // Redis 데이터를 DB에 일괄 업데이트
}
```

**장점**:
- 게시글 조회마다 DB UPDATE하지 않아 Write 부하 대폭 감소
- Redis INCR은 atomic 연산으로 동시성 문제 없음
- 배치 처리로 효율적인 DB 업데이트

### 3. 캐시 무효화 전략

**패턴 기반 삭제**:
```typescript
// 게시글 관련 모든 캐시 삭제
await this.redisService.delByPattern('posts:list:*');
```

**실행 시점**:
- 게시글 CRUD 작업 시 즉시 캐시 무효화
- 데이터 일관성 보장

## Redis 서비스 구조

### RedisService (backend/src/redis/redis.service.ts)

주요 메서드:
- `get(key)`: 값 조회
- `set(key, value, ttl)`: 값 저장 (TTL 설정 가능)
- `del(key)`: 키 삭제
- `delByPattern(pattern)`: 패턴 매칭 키 일괄 삭제
- `incr(key, increment)`: 숫자 증가 (atomic)
- `keys(pattern)`: 패턴 매칭 키 목록 조회

## 환경 설정

### .env 파일

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Docker Compose (선택 사항)

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
```

## 성능 향상 효과

### 게시글 목록 조회
- 캐시 히트 시 DB 쿼리 생략으로 응답 속도 개선
- 동일 조건 재조회 시 캐시 활용

### 조회수 증가
- 매 조회마다 DB UPDATE 대신 Redis INCR 사용
- 5분마다 배치로 DB 동기화하여 Write 부하 감소
- 동시 조회 시 정확한 카운팅 보장

### DB 부하 감소
- 반복적인 읽기 쿼리 감소
- Write 연산 배치 처리
- 데이터베이스 리소스 효율적 사용

## 향후 확장 가능성

1. **인기 게시글 순위**: ZSET을 활용한 실시간 순위
2. **세션 관리**: JWT 대신 Redis 세션 스토어
3. **Rate Limiting**: API 요청 제한
4. **실시간 알림**: Pub/Sub을 활용한 실시간 알림
5. **차단 사용자 캐싱**: 자주 조회하는 차단 목록 캐싱

## 모니터링

Redis 상태 확인:
```bash
# Redis CLI 접속
redis-cli

# 모든 키 확인
KEYS *

# 특정 패턴 키 확인
KEYS posts:list:*
KEYS post:views:*

# 메모리 사용량 확인
INFO memory
```

## 주의사항

1. **TTL 설정**: 데이터 특성에 맞는 적절한 TTL 설정 필요
2. **캐시 무효화**: 데이터 변경 시 관련 캐시 즉시 삭제
3. **메모리 관리**: Redis 메모리 사용량 모니터링
4. **동시성**: INCR 등 atomic 연산 활용

## 참고 자료

- [Redis Documentation](https://redis.io/documentation)
- [NestJS Redis Integration](https://docs.nestjs.com/techniques/caching)
- [Cache-Aside Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- [Write-Behind Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
