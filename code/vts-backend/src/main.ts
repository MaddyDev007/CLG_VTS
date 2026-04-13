import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const corsOriginsRaw = configService.get<string>('CORS_ORIGINS')
  const apiPrefix = configService.get<string>('API_PREFIX')?.trim().replace(/^\/+|\/+$/g, '')
  const corsOrigins = corsOriginsRaw
    ? corsOriginsRaw.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3011',
        'http://127.0.0.1:3011',
      ]

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix)
  }

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('VTS API')
    .setDescription('Vehicle Tracking System Backend API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup(apiPrefix ? `${apiPrefix}/docs` : 'api/docs', app, document)

  const port = configService.get<number>('PORT', 3000)
  await app.listen(port, '0.0.0.0')
}

bootstrap()
