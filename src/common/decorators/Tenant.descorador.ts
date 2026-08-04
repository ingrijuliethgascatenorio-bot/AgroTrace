/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/common/decorators/tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @Tenant() — extrae el asociacion_id inyectado por TenantMiddleware.
 *
 * Uso en controladores:
 *   @Get()
 *   findAll(@Tenant() asociacionId: number) { ... }
 */
export const Tenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    // Retorna el asociacionId inyectado por el middleware, o cae en el asociacion_id del usuario autenticado si existe
    return ((request as any).asociacionId || (request.user && (request.user as any).asociacion_id)) as number;
  },
);
