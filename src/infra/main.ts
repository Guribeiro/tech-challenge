import { NestFactory } from '@nestjs/core';
import { AppModule } from './nest/app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 API rodando na porta ${port}`);
}

bootstrap();