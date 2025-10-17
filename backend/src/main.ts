import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

/* main() */
/*app.module.ts = @Configuration + @ComponentScan. 모듈(Bean) 등록 및 의존성 관리 */
/*app.controller.ts = @RestController. HTTP 요청 처리
app.service.ts = @Service. 비즈니스 로직*/

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
