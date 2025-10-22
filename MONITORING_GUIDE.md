# 시스템 모니터링 개발 가이드

## 목차
1. [개요](#개요)
2. [아키텍처](#아키텍처)
3. [Prometheus & Grafana 설정](#1-prometheus--grafana-설정)
4. [Loki 로그 수집 설정](#2-loki-로그-수집-설정)
5. [Scouter APM 설정](#3-scouter-apm-설정)
6. [통합 Docker Compose 구성](#4-통합-docker-compose-구성)
7. [모니터링 대시보드 구성](#5-모니터링-대시보드-구성)
8. [알림 설정](#6-알림-설정)

## 개요

이 가이드는 Board Project의 전체 시스템을 모니터링하기 위한 설정 방법을 제공합니다.

### 모니터링 스택 구성
- **Prometheus**: 메트릭 수집 및 저장
- **Grafana**: 시각화 및 대시보드
- **Loki**: 로그 수집 및 저장
- **Promtail**: 로그 에이전트
- **Scouter**: APM (Application Performance Monitoring)
- **Node Exporter**: 시스템 메트릭
- **cAdvisor**: 컨테이너 메트릭

### 현재 시스템 구성
- Backend: NestJS (Node.js)
- Frontend: Next.js
- Database: PostgreSQL, MongoDB, Redis
- Message Queue: RabbitMQ

## 아키텍처

```
┌──────────────────────────────────────────────────────┐
│                   Grafana (3000)                      │
│                 (시각화 & 대시보드)                    │
└────────────────┬──────────────────┬──────────────────┘
                 │                  │
    ┌────────────┴──────────┐      │
    │  Prometheus (9090)     │      │
    │   (메트릭 저장)         │      │
    └────────────────────────┘      │
              ▲                      │
              │                      │
    ┌─────────┴──────────────┐      │
    │    메트릭 수집          │      │
    │                        │      │
    ├── Node Exporter        │      ▼
    ├── cAdvisor            │   ┌─────────────────┐
    ├── RabbitMQ Exporter   │   │   Loki (3100)   │
    ├── PostgreSQL Exporter │   │  (로그 저장)     │
    ├── MongoDB Exporter    │   └─────────────────┘
    └── Redis Exporter      │          ▲
                            │          │
                            │   ┌──────┴─────────┐
                            │   │  Promtail      │
                            │   │ (로그 수집)     │
                            │   └────────────────┘
                            │          ▲
                            │          │
    ┌───────────────────────┴──────────┴──────────┐
    │              애플리케이션 서비스               │
    │                                             │
    ├── Backend (NestJS) ─────┐                  │
    ├── Frontend (Next.js)    ├── Scouter Agent  │
    ├── PostgreSQL            │                  │
    ├── MongoDB               ▼                  │
    ├── Redis           Scouter Collector        │
    └── RabbitMQ              (6100)             │
                                                  │
    └─────────────────────────────────────────────┘
```

## 1. Prometheus & Grafana 설정

### 1.1 NestJS 메트릭 노출 설정

Backend에 Prometheus 메트릭을 노출하는 엔드포인트를 추가합니다.

**backend/package.json에 의존성 추가:**
```bash
cd backend
npm install prom-client @willsoto/nestjs-prometheus
```

**backend/src/metrics/metrics.module.ts 생성:**
```typescript
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [PrometheusModule.register()],
  controllers: [MetricsController],
})
export class MetricsModule {}
```

**backend/src/metrics/metrics.controller.ts 생성:**
```typescript
import { Controller, Get } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';

@Controller('metrics')
export class MetricsController extends PrometheusController {}
```

**backend/src/app.module.ts 수정:**
```typescript
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    // ... existing imports
    MetricsModule,
  ],
})
export class AppModule {}
```

### 1.2 커스텀 메트릭 추가

**backend/src/metrics/custom-metrics.service.ts:**
```typescript
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, register } from 'prom-client';

@Injectable()
export class CustomMetricsService {
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestTotal: Counter<string>;
  private readonly dbQueryDuration: Histogram<string>;
  private readonly cacheHitRate: Counter<string>;

  constructor() {
    // HTTP 요청 지속 시간
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    // HTTP 요청 수
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    });

    // DB 쿼리 지속 시간
    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'collection'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
    });

    // 캐시 히트율
    this.cacheHitRate = new Counter({
      name: 'cache_operations_total',
      help: 'Total number of cache operations',
      labelNames: ['operation', 'result'],
    });

    // 메트릭 등록
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.httpRequestTotal);
    register.registerMetric(this.dbQueryDuration);
    register.registerMetric(this.cacheHitRate);
  }

  recordHttpRequest(method: string, route: string, status: number, duration: number) {
    this.httpRequestDuration.observe({ method, route, status: status.toString() }, duration);
    this.httpRequestTotal.inc({ method, route, status: status.toString() });
  }

  recordDbQuery(operation: string, collection: string, duration: number) {
    this.dbQueryDuration.observe({ operation, collection }, duration);
  }

  recordCacheOperation(operation: 'hit' | 'miss' | 'set', result: 'success' | 'failure') {
    this.cacheHitRate.inc({ operation, result });
  }
}
```

### 1.3 Prometheus 설정

**monitoring/prometheus/prometheus.yml 생성:**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

rule_files:
  - "alerts.yml"

scrape_configs:
  # Backend 애플리케이션 메트릭
  - job_name: 'nestjs-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: /metrics

  # Node Exporter (시스템 메트릭)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  # PostgreSQL Exporter
  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # MongoDB Exporter
  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']

  # Redis Exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # RabbitMQ Exporter
  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['rabbitmq:15692']

  # cAdvisor (컨테이너 메트릭)
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
```

### 1.4 Alert Rules 설정

**monitoring/prometheus/alerts.yml:**
```yaml
groups:
  - name: application
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for 5 minutes"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is above 1s"

      - alert: DatabaseConnectionFailure
        expr: up{job="postgresql"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL is down"
          description: "PostgreSQL database is not accessible"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%"

      - alert: HighCPUUsage
        expr: rate(process_cpu_seconds_total[5m]) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is above 80%"
```

## 2. Loki 로그 수집 설정

### 2.1 NestJS 로그 설정

**backend/src/common/logger/winston.logger.ts:**
```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
    }),
  ],
});
```

### 2.2 Loki 설정

**monitoring/loki/loki-config.yml:**
```yaml
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

limits_config:
  retention_period: 720h
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
```

### 2.3 Promtail 설정

**monitoring/promtail/promtail-config.yml:**
```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Docker 컨테이너 로그
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
            time: time
      - json:
          expressions:
            tag: attrs.tag
          source: stream
      - regex:
          expression: ^(?P<container_name>\S+) (?P<image_name>\S+) (?P<container_id>\S+)$
          source: tag
      - labels:
          container_name:
          container_id:
          image_name:

  # NestJS 애플리케이션 로그
  - job_name: nestjs
    static_configs:
      - targets:
          - localhost
        labels:
          job: nestjs
          __path__: /app/backend/logs/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            timestamp: timestamp
            message: message
      - labels:
          level:
      - timestamp:
          source: timestamp
          format: RFC3339

  # Next.js 애플리케이션 로그
  - job_name: nextjs
    static_configs:
      - targets:
          - localhost
        labels:
          job: nextjs
          __path__: /app/frontend/.next/server/logs/*.log
```

## 3. Scouter APM 설정

### 3.1 Scouter Server 설정

**monitoring/scouter/scouter-server.conf:**
```properties
# Scouter Server Configuration
net_http_port=6180
net_tcp_port=6100
net_udp_port=6100

# 데이터 보관 기간
mgr_purge_profile_keep_days=30
mgr_purge_xlog_keep_days=30
mgr_purge_counter_keep_days=70

# 데이터베이스 설정
db_dir=/scouter/database

# Alert 설정
ext_plugin_enabled=true
```

### 3.2 NestJS Scouter Agent 설정

**backend/src/main.ts에 Scouter Agent 추가:**
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Scouter Agent 설정
if (process.env.NODE_ENV === 'production') {
  require('@scouter/agent-nodejs').start({
    host: 'scouter-server',
    port: 6100,
    name: 'nestjs-backend',
    trace_http_enabled: true,
    trace_sql_enabled: true,
    counter_enabled: true,
    profile_enabled: true,
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ... rest of the code
}
bootstrap();
```

**backend/package.json에 의존성 추가:**
```bash
npm install @scouter/agent-nodejs
```

### 3.3 Scouter 커스텀 플러그인

**monitoring/scouter/plugins/AlertPlugin.java:**
```java
package scouter.plugin;

import scouter.lang.pack.AlertPack;
import scouter.server.plugin.PluginHelper;
import scouter.server.plugin.annotation.ServerPlugin;

@ServerPlugin
public class AlertPlugin {

    @ServerPlugin.Alert
    public void alert(AlertPack pack) {
        // Slack, Email 등으로 알림 전송
        if (pack.level >= AlertPack.WARNING) {
            sendSlackNotification(pack.title, pack.message);
        }
    }

    private void sendSlackNotification(String title, String message) {
        // Slack webhook 호출
    }
}
```

## 4. 통합 Docker Compose 구성

**docker-compose.monitoring.yml:**
```yaml
version: '3.8'

services:
  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: board-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    networks:
      - board-network
    restart: unless-stopped

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: board-grafana
    ports:
      - "3001:3000"
    volumes:
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    networks:
      - board-network
    restart: unless-stopped

  # Loki
  loki:
    image: grafana/loki:latest
    container_name: board-loki
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki/loki-config.yml:/etc/loki/loki-config.yml
      - loki_data:/loki
    command: -config.file=/etc/loki/loki-config.yml
    networks:
      - board-network
    restart: unless-stopped

  # Promtail
  promtail:
    image: grafana/promtail:latest
    container_name: board-promtail
    volumes:
      - ./monitoring/promtail/promtail-config.yml:/etc/promtail/promtail-config.yml
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./backend/logs:/app/backend/logs:ro
      - ./frontend/.next/server/logs:/app/frontend/logs:ro
    command: -config.file=/etc/promtail/promtail-config.yml
    networks:
      - board-network
    restart: unless-stopped

  # Node Exporter
  node-exporter:
    image: prom/node-exporter:latest
    container_name: board-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - board-network
    restart: unless-stopped

  # cAdvisor
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: board-cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
    networks:
      - board-network
    restart: unless-stopped

  # PostgreSQL Exporter
  postgres-exporter:
    image: quay.io/prometheuscommunity/postgres-exporter:latest
    container_name: board-postgres-exporter
    environment:
      DATA_SOURCE_NAME: "postgresql://board_user:board_password@postgres:5432/board_db?sslmode=disable"
    ports:
      - "9187:9187"
    networks:
      - board-network
    restart: unless-stopped

  # MongoDB Exporter
  mongodb-exporter:
    image: percona/mongodb_exporter:latest
    container_name: board-mongodb-exporter
    environment:
      MONGODB_URI: "mongodb://mongo_user:mongo_password@mongodb:27017"
    ports:
      - "9216:9216"
    networks:
      - board-network
    restart: unless-stopped

  # Redis Exporter
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: board-redis-exporter
    environment:
      REDIS_ADDR: "redis:6379"
      REDIS_PASSWORD: "redis_password"
    ports:
      - "9121:9121"
    networks:
      - board-network
    restart: unless-stopped

  # Scouter Server
  scouter-server:
    image: scouterapm/scouter-server:latest
    container_name: board-scouter-server
    ports:
      - "6100:6100"
      - "6180:6180"
    volumes:
      - ./monitoring/scouter/scouter-server.conf:/scouter/conf/scouter-server.conf
      - scouter_data:/scouter/database
    networks:
      - board-network
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
  loki_data:
  scouter_data:

networks:
  board-network:
    external: true
```

## 5. 모니터링 대시보드 구성

### 5.1 Grafana 대시보드 프로비저닝

**monitoring/grafana/provisioning/datasources/datasources.yml:**
```yaml
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
```

### 5.2 커스텀 대시보드 JSON

**monitoring/grafana/provisioning/dashboards/nestjs-dashboard.json:**
```json
{
  "dashboard": {
    "title": "NestJS Application Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time (95th percentile)",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Database Query Performance",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8},
        "targets": [
          {
            "expr": "rate(db_query_duration_seconds_sum[5m]) / rate(db_query_duration_seconds_count[5m])"
          }
        ]
      },
      {
        "title": "Cache Hit Rate",
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 16},
        "targets": [
          {
            "expr": "rate(cache_operations_total{operation=\"hit\"}[5m]) / (rate(cache_operations_total{operation=\"hit\"}[5m]) + rate(cache_operations_total{operation=\"miss\"}[5m])) * 100"
          }
        ]
      }
    ]
  }
}
```

### 5.3 로그 대시보드 쿼리

Grafana에서 Loki 데이터소스를 사용한 로그 쿼리:

```logql
# 에러 로그 조회
{job="nestjs"} |= "error"

# 특정 API 엔드포인트 로그
{job="nestjs"} |~ "/api/posts/.*"

# Response time이 1초 이상인 요청
{job="nestjs"} | json | response_time_ms > 1000

# 최근 5분간 에러 발생률
rate({job="nestjs",level="error"}[5m])
```

## 6. 알림 설정

### 6.1 Alertmanager 설정

**monitoring/alertmanager/alertmanager.yml:**
```yaml
global:
  slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - channel: '#alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
        send_resolved: true
```

### 6.2 Grafana 알림 규칙

```json
{
  "alert": {
    "name": "High Error Rate",
    "conditions": [
      {
        "evaluator": {
          "params": [5],
          "type": "gt"
        },
        "query": {
          "model": {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) * 100"
          }
        }
      }
    ],
    "notifications": [
      {
        "uid": "slack-channel"
      }
    ]
  }
}
```

## 7. 실행 및 테스트

### 7.1 모니터링 스택 시작

```bash
# 기본 서비스 시작
docker-compose up -d

# 모니터링 서비스 시작
docker-compose -f docker-compose.monitoring.yml up -d

# 로그 확인
docker-compose -f docker-compose.monitoring.yml logs -f

# 상태 확인
docker-compose -f docker-compose.monitoring.yml ps
```

### 7.2 접속 URL

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Loki**: http://localhost:3100/metrics
- **Scouter**: http://localhost:6180

### 7.3 테스트 시나리오

1. **부하 테스트**
```bash
# Apache Bench로 부하 생성
ab -n 1000 -c 10 http://localhost:3000/api/posts

# 또는 k6 사용
k6 run load-test.js
```

2. **에러 시뮬레이션**
```bash
# 특정 엔드포인트에 잘못된 요청 전송
curl -X POST http://localhost:3000/api/posts -d '{"invalid": "data"}'
```

3. **메트릭 확인**
```bash
# Prometheus 메트릭 직접 확인
curl http://localhost:3000/metrics

# Grafana 대시보드에서 시각화 확인
```

## 8. 트러블슈팅

### 8.1 일반적인 문제 해결

**메트릭이 수집되지 않을 때:**
```bash
# Prometheus targets 확인
curl http://localhost:9090/api/v1/targets

# 네트워크 연결 확인
docker exec board-prometheus ping backend
```

**로그가 수집되지 않을 때:**
```bash
# Promtail 상태 확인
docker logs board-promtail

# 로그 파일 권한 확인
ls -la backend/logs/
```

**Grafana 대시보드가 표시되지 않을 때:**
```bash
# Datasource 연결 확인
docker exec board-grafana curl http://prometheus:9090/api/v1/query?query=up

# 대시보드 import 확인
docker exec board-grafana ls /etc/grafana/provisioning/dashboards/
```

### 8.2 성능 최적화

**Prometheus 저장소 최적화:**
```yaml
# prometheus.yml
global:
  scrape_interval: 30s  # 스크랩 간격 늘리기

storage:
  tsdb:
    retention.time: 15d  # 보관 기간 조정
    retention.size: 10GB  # 최대 크기 제한
```

**Loki 성능 개선:**
```yaml
# loki-config.yml
limits_config:
  ingestion_rate_mb: 10
  ingestion_burst_size_mb: 20
  max_streams_per_user: 10000
```

## 9. 보안 고려사항

### 9.1 인증 및 권한 설정

**Grafana 보안:**
```ini
# grafana.ini
[auth.anonymous]
enabled = false

[auth.basic]
enabled = true

[auth.ldap]
enabled = true
config_file = /etc/grafana/ldap.toml
```

**Prometheus 보안:**
```yaml
# nginx 리버스 프록시 설정
location /prometheus/ {
    auth_basic "Prometheus";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://prometheus:9090/;
}
```

### 9.2 네트워크 격리

```yaml
# docker-compose.monitoring.yml
networks:
  monitoring-network:
    internal: true
  board-network:
    external: true
```

## 10. 자동화 스크립트

### 10.1 모니터링 설정 스크립트

**scripts/setup-monitoring.sh:**
```bash
#!/bin/bash

echo "Setting up monitoring stack..."

# 디렉토리 생성
mkdir -p monitoring/{prometheus,grafana/provisioning,loki,promtail,alertmanager,scouter}

# 설정 파일 복사
cp monitoring-configs/* monitoring/

# 권한 설정
chmod -R 755 monitoring/

# Docker 네트워크 생성
docker network create board-network 2>/dev/null || true

# 모니터링 스택 시작
docker-compose -f docker-compose.monitoring.yml up -d

echo "Monitoring stack is ready!"
echo "Grafana: http://localhost:3001"
echo "Prometheus: http://localhost:9090"
```

### 10.2 백업 스크립트

**scripts/backup-monitoring.sh:**
```bash
#!/bin/bash

BACKUP_DIR="backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Prometheus 데이터 백업
docker exec board-prometheus tar czf - /prometheus | gzip > $BACKUP_DIR/prometheus.tar.gz

# Grafana 설정 백업
docker exec board-grafana tar czf - /var/lib/grafana | gzip > $BACKUP_DIR/grafana.tar.gz

# Loki 데이터 백업
docker exec board-loki tar czf - /loki | gzip > $BACKUP_DIR/loki.tar.gz

echo "Backup completed to $BACKUP_DIR"
```

## 결론

이 가이드를 통해 완전한 모니터링 시스템을 구축할 수 있습니다. 시스템은 다음을 제공합니다:

- **실시간 메트릭 수집**: Prometheus를 통한 애플리케이션 및 시스템 메트릭
- **로그 집계**: Loki/Promtail을 통한 중앙화된 로그 관리
- **APM**: Scouter를 통한 상세한 애플리케이션 성능 분석
- **시각화**: Grafana를 통한 종합 대시보드
- **알림**: 문제 발생 시 즉시 알림

정기적으로 대시보드를 검토하고, 알림 규칙을 조정하며, 시스템 요구사항에 따라 설정을 최적화하는 것이 중요합니다.