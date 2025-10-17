import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // ConfigService를 사용해서 환경 변수를 안전하게 가져옵니다
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error('MONGODB_URI 환경 변수가 설정되지 않았습니다.');
        }
        return { uri };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}