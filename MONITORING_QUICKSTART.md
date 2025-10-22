# 모니터링 빠른 시작 가이드

## Docker Compose 파일 구성 설명

현재 프로젝트에 3개의 Docker Compose 파일이 준비되어 있습니다:

### 1. `docker-compose.yml` (기존 파일)
- 기본 인프라 서비스만 포함 (PostgreSQL, Redis, MongoDB, RabbitMQ)
- Backend/Frontend 애플리케이션은 포함하지 않음
- 개발 시 로컬에서 앱을 실행할 때 사용

### 2. `docker-compose.override.yml` (자동 적용)
- RabbitMQ Prometheus 메트릭 포트(15692) 추가
- `docker-compose up` 실행 시 자동으로 기본 파일과 병합됨

### 3. `docker-compose.full.yml` (전체 스택)
- Backend/Frontend 애플리케이션 포함
- 프로덕션 환경 또는 전체 컨테이너 실행 시 사용

### 4. `docker-compose.monitoring.yml` (모니터링 스택)
- Prometheus, Grafana, Loki 등 모니터링 도구
- 각종 Exporter 포함

## 빠른 시작

### 방법 1: 개발 환경 (앱은 로컬 실행)

```bash
# 1. 기본 인프라 서비스 시작 (override 자동 적용)
docker-compose up -d

# 2. 모니터링 스택 시작
docker-compose -f docker-compose.monitoring.yml up -d

# 3. Backend 로컬 실행
cd backend
npm run start:dev

# 4. Frontend 로컬 실행 (새 터미널)
cd frontend
npm run dev
```

### 방법 2: 전체 컨테이너 환경

```bash
# 1. 전체 애플리케이션 스택 시작
docker-compose -f docker-compose.full.yml up -d

# 2. 모니터링 스택 시작
docker-compose -f docker-compose.monitoring.yml up -d
```

## 모니터링 대시보드 접속

시작 후 다음 URL로 접속:

- **Grafana**: http://localhost:3003 (admin/admin)
- **Prometheus**: http://localhost:9090
- **RabbitMQ Management**: http://localhost:15672 (rabbitmq_user/rabbitmq_password)

## 필수 설정 파일 생성

모니터링이 제대로 작동하려면 다음 설정 파일들이 필요합니다:

```bash
# 디렉토리 생성
mkdir -p monitoring/{prometheus,grafana/provisioning/{dashboards,datasources},loki,promtail}

# Prometheus 설정 생성
cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['rabbitmq:15692']
    metrics_path: /metrics

  # Backend 앱 메트릭 (앱에서 /metrics 엔드포인트 제공 시)
  - job_name: 'backend'
    static_configs:
      - targets: ['host.docker.internal:3000']  # 로컬 실행 시
      # - targets: ['backend:3000']  # 컨테이너 실행 시
EOF

# Loki 설정 생성
cat > monitoring/loki/loki-config.yml << 'EOF'
auth_enabled: false

server:
  http_listen_port: 3100

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://alertmanager:9093
EOF

# Promtail 설정 생성
cat > monitoring/promtail/promtail-config.yml << 'EOF'
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    static_configs:
      - targets:
          - localhost
        labels:
          job: docker
          __path__: /var/lib/docker/containers/*/*log
    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
            attrs: attrs
      - json:
          expressions:
            tag: attrs.tag
          source: stream
      - regex:
          expression: '(?P<container_name>\S+) (?P<image>\S+)'
          source: tag
      - labels:
          container_name:
EOF

# Grafana 데이터소스 설정
cat > monitoring/grafana/provisioning/datasources/datasources.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: true
EOF
```

## 상태 확인 명령어

```bash
# 실행 중인 컨테이너 확인
docker-compose ps
docker-compose -f docker-compose.monitoring.yml ps

# 로그 확인
docker-compose logs -f rabbitmq
docker-compose -f docker-compose.monitoring.yml logs -f prometheus

# 메트릭 수집 상태 확인
curl http://localhost:9090/targets  # Prometheus targets
curl http://localhost:15692/metrics  # RabbitMQ metrics
```

## 트러블슈팅

### RabbitMQ Prometheus 플러그인이 작동하지 않을 때

```bash
# RabbitMQ 컨테이너 접속
docker exec -it board-rabbitmq sh

# 플러그인 수동 활성화
rabbitmq-plugins enable rabbitmq_prometheus

# 확인
curl http://localhost:15692/metrics
```

### Prometheus가 메트릭을 수집하지 못할 때

```bash
# Prometheus 타겟 상태 확인
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .job, state: .health}'

# 네트워크 연결 테스트
docker exec board-prometheus ping rabbitmq
docker exec board-prometheus wget -O- http://rabbitmq:15692/metrics
```

### Grafana 대시보드가 표시되지 않을 때

1. Grafana 접속 (http://localhost:3003)
2. Configuration → Data Sources 확인
3. Prometheus 연결 테스트
4. Explore에서 쿼리 테스트: `up{job="rabbitmq"}`

## 유용한 Prometheus 쿼리

```promql
# 서비스 가동 상태
up

# 컨테이너 CPU 사용률
rate(container_cpu_usage_seconds_total[5m]) * 100

# 컨테이너 메모리 사용량
container_memory_usage_bytes

# RabbitMQ 큐 메시지 수
rabbitmq_queue_messages

# PostgreSQL 연결 수
pg_stat_database_numbackends

# Redis 연결된 클라이언트 수
redis_connected_clients

# MongoDB 연결 수
mongodb_connections{state="current"}
```

## 다음 단계

1. **커스텀 메트릭 추가**: Backend 애플리케이션에 Prometheus 메트릭 노출
2. **알림 규칙 설정**: Alertmanager 구성
3. **대시보드 커스터마이징**: Grafana 대시보드 생성
4. **로그 집계 강화**: Loki 로그 파싱 규칙 추가

상세한 설정은 `MONITORING_GUIDE.md` 파일을 참조하세요.