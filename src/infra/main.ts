import { NestFactory } from '@nestjs/core';
import { AppModule } from './nest/app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API Tech Challenge - NestJS')
    .setDescription('Documentação dos endpoints da API (Bounded Contexts: Faturamento, Liberação, Notificações, OS/Orçamento)')
    .setVersion('1.0')
    .addBearerAuth() // Adicione caso utilize autenticação via JWT
    .build()

  const document = SwaggerModule.createDocument(app, config)

  // Endpoint onde a documentação ficará acessível (ex: http://localhost:3000/docs)
  SwaggerModule.setup('docs', app, document)

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