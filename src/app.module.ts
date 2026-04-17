// src/app.module.ts
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
// ── Módulo Tenant ──────────────────────────────────────────
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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/{*path}'],
    }),
    // ── Tenant PRIMERO ─────────────────────────────────────
    TenantModule,
    // ── Módulos de negocio ─────────────────────────────────
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
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '/*', method: RequestMethod.ALL });
  }
}
