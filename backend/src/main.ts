import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

/* main() */
/*app.module.ts = @Configuration + @ComponentScan. 모듈(Bean) 등록 및 의존성 관리 */
/*app.controller.ts = @RestController. HTTP 요청 처리
app.service.ts = @Service. 비즈니스 로직*/

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // 정적 파일 제공 설정 - 업로드된 이미지 파일 제공
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // CORS 설정 - 프론트엔드에서 백엔드 API를 호출할 수 있도록 허용
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ], // 프론트엔드 주소 (개발 환경)
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();