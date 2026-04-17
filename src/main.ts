// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // ✅ Render asigna el puerto en process.env.PORT
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`AgroTrace API corriendo en el puerto: ${port}`);
}
bootstrap();
