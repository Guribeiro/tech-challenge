import { NestFactory } from '@nestjs/core';
import { AppModule } from './nest/app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não declaradas no DTO
      forbidNonWhitelisted: true, // Lança erro se enviarem campos extras
      transform: true, // Transforma payloads em instâncias do DTO
    }),
  )

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 API rodando na porta ${port}`);
}

bootstrap();