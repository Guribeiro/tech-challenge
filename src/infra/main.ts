import { NestFactory } from '@nestjs/core'
import { AppModule } from './nest/app.module.js'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

const app = await NestFactory.create(AppModule)

app.setGlobalPrefix('api')

const config = new DocumentBuilder()
  .setTitle('API Tech Challenge - NestJS')
  .setDescription('Documentação dos endpoints da API (Bounded Contexts: Faturamento, Liberação, Notificações, OS/Orçamento)')
  .setVersion('1.0')
  .addBearerAuth()
  .build()

const document = SwaggerModule.createDocument(app, config)

SwaggerModule.setup('docs', app, document)

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)

const port = process.env.PORT || 3000
await app.listen(port)

console.log(`🚀 API rodando na porta ${port}`)