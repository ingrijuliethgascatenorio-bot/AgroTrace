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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return (request as any).asociacionId as number;
  },
);
