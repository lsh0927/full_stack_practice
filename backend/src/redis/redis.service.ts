import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService} from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      socket: {
        host: this.configService.get('REDIS_HOST'),
        port: this.configService.get('REDIS_PORT'),
      },
      password: this.configService.get('REDIS_PASSWORD'),
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    await this.client.connect();
    console.log('✅ Redis connected successfully');
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Redis에 값 저장
   * @param key 키
   * @param value 값
   * @param ttl TTL (초 단위, 선택적)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await this.client.setEx(key, ttl, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  /**
   * Redis에서 값 조회
   * @param key 키
   * @returns 저장된 값 또는 null
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  /**
   * Redis에서 값 삭제
   * @param key 키
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * 패턴에 맞는 모든 키 삭제
   * @param pattern 패턴 (예: 'user:*')
   */
  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  /**
   * 패턴에 맞는 모든 키 조회
   * @param pattern 패턴 (예: 'user:*')
   * @returns 키 배열
   */
  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  /**
   * 숫자 값 증가 (INCR)
   * @param key 키
   * @param increment 증가량 (기본값: 1)
   * @returns 증가 후 값
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    return await this.client.incrBy(key, increment);
  }

  /**
   * Redis 연결 테스트
   * @returns 연결 성공 여부
   */
  async ping(): Promise<boolean> {
    try {
      await this.set('ping', 'pong', 10);
      const result = await this.get('ping');
      await this.del('ping');
      return result === 'pong';
    } catch (error) {
      console.error('Redis ping failed:', error);
      return false;
    }
  }
}
