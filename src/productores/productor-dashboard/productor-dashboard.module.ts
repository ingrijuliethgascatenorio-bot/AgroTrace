import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductorDashboardController } from './controllers/productor-dashboard.controller';
import { ProductorDashboardService } from './services/productor-dashboard.service';

/**
 * ProductorDashboardModule
 *
 * Módulo independiente para el dashboard del productor autenticado.
 * NO modifica ni importa lógica de otros módulos existentes.
 *
 * Para activarlo, importar en app.module.ts:
 *   imports: [ ..., ProductorDashboardModule ]
 *
 * Endpoints disponibles:
 *   GET  /productor-dashboard/perfil     → perfil del productor
 *   PUT  /productor-dashboard/perfil     → actualizar telefono/ubicacion/finca
 *   GET  /productor-dashboard/historial  → historial de entregas (con filtros fecha)
 *   GET  /productor-dashboard/resumen    → total_kg, total_dinero, total_entregas, ultima_entrega
 *   GET  /productor-dashboard/qr         → código QR del productor
 *
 * Seguridad: todas las rutas requieren JWT (JwtAuthGuard).
 * El id_usuario se extrae automáticamente del token en cada endpoint.
 *
 * No requiere registrar entidades propias — usa DataSource directamente
 * para consultas SQL optimizadas sin duplicar entidades de otros módulos.
 */
@Module({
  imports: [
    // No necesita TypeOrmModule.forFeature() porque usa DataSource.query()
    // directamente con las queries SQL de productor-dashboard.queries.ts
  ],
  controllers: [ProductorDashboardController],
  providers: [ProductorDashboardService],
  exports: [ProductorDashboardService],
})
export class ProductorDashboardModule {}
