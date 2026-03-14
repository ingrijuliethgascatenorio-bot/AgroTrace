/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AnalisisModule } from './analisis/analisis.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductorModule } from './modules/productor/productor.module';
import { HistorialModule } from './modules/Historial/historial.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { ComprasModule } from './modules/compras/compras.module';
import { ProductosModule } from './modules/productos/producto.modulo';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '071121',
      database: process.env.DB_NAME || 'AgroTrace',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),

    AnalisisModule,
    AuthModule,
    ProductorModule,
    ComprasModule,
    VentasModule,
    HistorialModule,
    ProductosModule,
  ],
})
export class AppModule {}
