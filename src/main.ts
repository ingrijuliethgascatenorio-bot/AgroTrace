import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORREGIDO: agregar ValidationPipe global para que los DTOs
  //    con class-validator funcionen (RegistrarEntregaDto, etc.)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ignora campos no declarados en el DTO
      forbidNonWhitelisted: false,
      transform: true, // convierte tipos automáticamente (string→number)
    }),
  );

  app.enableCors({
    origin: '*', // ajustar en producción
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `AgroTrace API corriendo en: http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}
bootstrap();
