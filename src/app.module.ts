// src/app.module.ts  — REEMPLAZA el existente
import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// ── Módulo Tenant (nuevo) ──────────────────────────────────
import { TenantModule } from './tenant/tenant.module';
import { TenantMiddleware } from './tenant/tenant.middleware';

// ── Módulos de negocio ─────────────────────────────────────
import { AnalisisModule } from './analisis/analisis.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductorModule } from './modules/productor/productor.module';
import { HistorialModule } from './modules/Historial/historial.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { ComprasModule } from './modules/compras/compras.module';
import { ProductosModule } from './modules/productos/producto.modulo';
import { ProductorDashboardModule } from './productores/productor-dashboard/productor-dashboard.module';
import { ComerciantesModule } from './modules/comerciante/comerciante.module';
import { OperarioModule } from './modules/operario/operario.module';
import { UsersModule } from './modules/users/users.module';
import { EntregasModule } from './modules/entregas/entregas.module';
import { PreciosModule } from './modules/Precios/precio.module';
import { RutasModule } from './modules/Ruta/rutas.module';
import { StockModule } from './modules/stock/stock.module';
import { AdminModule } from './modules/admin/Admin.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/{*path}'],
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
      // FIX FECHAS: fuerza al driver pg a devolver campos 'date' como string
      // 'YYYY-MM-DD' en lugar de new Date() en UTC, eliminando el desfase de -1 día
      extra: { options: '-c TimeZone=America/Bogota' },
    }),

    // ── Registrar TenantModule PRIMERO ──────────────────────
    TenantModule, // ← NUEVO: registra Asociacion entity y TenantMiddleware

    // ── Módulos de negocio (sin cambios) ───────────────────
    AuthModule,
    UsersModule,
    ProductorModule,
    OperarioModule,
    ComprasModule,
    VentasModule,
    HistorialModule,
    ProductosModule,
    ProductorDashboardModule,
    ComerciantesModule,
    AnalisisModule,
    EntregasModule,
    PreciosModule,
    RutasModule,
    StockModule,
    AdminModule,
  ],
})
export class AppModule implements NestModule {
  /**
   * Aplica TenantMiddleware a TODAS las rutas bajo /api/*
   * Se ejecuta ANTES que cualquier guard o handler.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '/*', method: RequestMethod.ALL });
  }
}
