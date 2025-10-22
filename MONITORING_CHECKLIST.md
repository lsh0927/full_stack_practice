# 모니터링 확인 체크리스트

## ✅ 실행 완료 항목

### 1. 모니터링 스택 실행 상태
- ✅ Prometheus (메트릭 수집)
- ✅ Grafana (시각화)
- ✅ Loki (로그 수집)
- ✅ Promtail (로그 에이전트)
- ✅ Alertmanager (알림)
- ✅ 6개 Exporter (PostgreSQL, MongoDB, Redis, RabbitMQ, Node, cAdvisor)

### 2. 현재 수집 중인 메트릭
- ✅ Redis: 3개 클라이언트 연결
- ✅ PostgreSQL: board_db에 8개 연결
- ✅ RabbitMQ: 메트릭 정상 수집
- ✅ MongoDB, Node, 컨테이너 메트릭 수집 중

## 📊 지금 바로 확인하는 방법

### 1. Grafana 대시보드 (가장 쉬운 방법)

**접속:**
```
http://localhost:3003
```

**로그인:**
- Username: `admin`
- Password: `admin`
- (첫 로그인 시 비밀번호 변경 요구 - Skip 가능)

**확인 순서:**

#### A. 데이터소스 확인
1. 왼쪽 메뉴 → ⚙️ Configuration → Data Sources
2. Prometheus와 Loki가 자동 설정되어 있어야 함
3. 각각 클릭해서 "Save & Test" → "Data source is working" 확인

#### B. Explore로 메트릭 조회 (실시간 데이터 확인)
1. 왼쪽 메뉴 → 🔍 Explore
2. 상단에서 **Prometheus** 선택
3. 아래 쿼리 입력해서 테스트:

**기본 상태 확인:**
```promql
up
```
→ 모든 타겟이 value=1이면 정상

**Redis 연결 수:**
```promql
redis_connected_clients
```

**PostgreSQL 연결 수:**
```promql
pg_stat_database_numbackends{datname="board_db"}
```

**RabbitMQ 큐 메시지 수:**
```promql
rabbitmq_queue_messages
```

**컨테이너 메모리 사용량:**
```promql
container_memory_usage_bytes / 1024 / 1024
```

**컨테이너 CPU 사용률:**
```promql
rate(container_cpu_usage_seconds_total[1m]) * 100
```

#### C. 로그 확인 (Loki)
1. Explore 화면에서 상단 데이터소스를 **Loki**로 변경
2. 아래 쿼리 입력:

**모든 Docker 로그:**
```logql
{job="docker"}
```

**특정 컨테이너 로그:**
```logql
{container_name="board-postgres"}
```

**에러 로그만:**
```logql
{job="docker"} |= "error"
```

### 2. Prometheus 직접 접속

**접속:**
```
http://localhost:9090
```

**확인:**
1. 상단 메뉴 → Status → Targets
   - 모든 엔드포인트가 **UP**(초록색)이어야 함

2. Graph 탭에서 쿼리 입력:
```promql
up
```

### 3. 개별 Exporter 메트릭 확인

**RabbitMQ 메트릭:**
```bash
curl http://localhost:15692/metrics | head -50
```

**Redis 메트릭:**
```bash
curl http://localhost:9121/metrics | grep redis_connected_clients
```

**PostgreSQL 메트릭:**
```bash
curl http://localhost:9187/metrics | grep pg_up
```

**Node (시스템) 메트릭:**
```bash
curl http://localhost:9100/metrics | grep node_cpu
```

### 4. Grafana 대시보드 Import (추천)

Grafana에서 미리 만들어진 대시보드를 import하면 바로 시각화 가능:

1. Grafana 접속 → 왼쪽 메뉴 → Dashboards → Import
2. 아래 대시보드 ID 입력:

**추천 대시보드:**
- `1860` - Node Exporter Full (시스템 리소스)
- `11074` - cAdvisor (컨테이너 메트릭)
- `9628` - PostgreSQL Database
- `763` - Redis
- `10991` - RabbitMQ Overview
- `14282` - MongoDB

3. Prometheus 데이터소스 선택 → Import

## 🎯 실습: 부하 생성 후 확인

### 1. 간단한 부하 생성
```bash
# 여러 번 실행
for i in {1..100}; do
  curl http://localhost:3000/api/posts > /dev/null 2>&1
done
```

### 2. Grafana Explore에서 확인
```promql
# HTTP 요청 수 증가 확인 (Backend에 메트릭 추가 후)
rate(http_requests_total[1m])

# PostgreSQL 연결 수 변화
pg_stat_database_numbackends{datname="board_db"}

# Redis 작업 수 증가
rate(redis_commands_processed_total[1m])
```

### 3. 로그 확인
Grafana Explore → Loki:
```logql
{container_name="board-postgres"} |= "connection"
```

## 📈 다음 단계

### 1. 커스텀 대시보드 생성
1. Grafana → Dashboards → New Dashboard
2. Add Visualization 클릭
3. 데이터소스: Prometheus
4. 쿼리 입력 (위의 쿼리 참조)
5. Visualization 타입 선택 (Graph, Gauge, Table 등)
6. Save

### 2. Backend 앱에 커스텀 메트릭 추가
`MONITORING_GUIDE.md`의 1.1절 참조:
- HTTP 요청 수
- 응답 시간
- 에러율
- DB 쿼리 시간
- 캐시 히트율

### 3. Alert 규칙 추가
Grafana에서:
1. Alert Rules 메뉴
2. New Alert Rule
3. 조건 설정 (예: CPU > 80%)
4. Notification 설정

## 🔍 트러블슈팅

### 메트릭이 보이지 않을 때
```bash
# Prometheus 타겟 확인
curl http://localhost:9090/api/v1/targets

# 특정 exporter 로그 확인
docker logs board-postgres-exporter
docker logs board-redis-exporter
```

### Grafana에서 "No data" 표시될 때
1. 데이터소스 연결 확인
2. 쿼리 문법 확인
3. Time range 확인 (최근 5분으로 설정)

### 로그가 수집되지 않을 때
```bash
# Promtail 로그 확인
docker logs board-promtail

# Loki 상태 확인
curl http://localhost:3100/ready
```

## 📝 요약

**지금 바로 할 수 있는 것:**
1. ✅ http://localhost:3003 접속 (Grafana)
2. ✅ Explore에서 Prometheus 쿼리 실행
3. ✅ 미리 만들어진 대시보드 Import
4. ✅ 실시간 로그 확인 (Loki)

**현재 수집 중인 데이터:**
- PostgreSQL: 8개 연결
- Redis: 3개 클라이언트
- RabbitMQ: 큐 상태
- 컨테이너: CPU, 메모리, 네트워크
- 시스템: CPU, 메모리, 디스크, 네트워크

모든 준비가 완료되었습니다! 🎉