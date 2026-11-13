import { NestFactory } from '@nestjs/core'
import { AppModule } from './nest/app.module.js'
import { ValidationPipe } from '@nestjs/common'
import { Logger } from 'nestjs-pino'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet';

const app = await NestFactory.create(AppModule, { bufferLogs: true })

const logger = app.get(Logger)
app.useLogger(logger)
app.flushLogs()

app.getHttpAdapter().getInstance().disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
        upgradeInsecureRequests: null,
      },
    },
  }),
);

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

app.enableCors({
  origin: true,
  credentials: true,
})

const port = process.env.PORT || 3000
await app.listen(port, '0.0.0.0')

logger.log(`API rodando na porta ${port}`, 'Bootstrap')