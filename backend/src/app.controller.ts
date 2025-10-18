import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisService } from './redis/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('redis/test')
  async testRedis() {
    const isConnected = await this.redisService.ping();
    return {
      status: isConnected ? 'success' : 'failed',
      message: isConnected
        ? 'Redis connection successful'
        : 'Redis connection failed',
    };
  }
}
