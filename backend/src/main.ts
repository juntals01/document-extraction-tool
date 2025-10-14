import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS using the origin from env (frontend URL)
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  const port = Number(process.env.API_PORT) || 4000;
  await app.listen(port);

  console.log(`🚀 API running on: http://localhost:${port}`);
}
bootstrap();
