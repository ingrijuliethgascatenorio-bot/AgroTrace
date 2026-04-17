// src/tenant/tenant.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asociacion } from './asociacion.entity';
import { TenantMiddleware } from './tenant.middleware';

/**
 * @Global() hace que TenantModule sea visible en toda la app
 * sin necesidad de importarlo en cada módulo.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Asociacion])],
  providers: [TenantMiddleware],
  exports: [TenantMiddleware, TypeOrmModule],
})
export class TenantModule {}
