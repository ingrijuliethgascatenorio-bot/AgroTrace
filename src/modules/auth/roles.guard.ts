import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../../common/enums/permissions.enum';
import { PERMISSIONS_KEY } from '../../common/decorators/permisos.decorator';

// ── Mapa de permisos por rol ──────────────────────────────────────────────────
const rolePermissions: Record<string, Permission[]> = {
  ADMIN: Object.values(Permission),
  VENDEDOR: [
    Permission.DASHBOARD,
    Permission.VENTAS,
    Permission.COMPRAS,
    Permission.PRODUCTORES,
  ],
  OPERARIO: [Permission.DASHBOARD, Permission.COMPRAS, Permission.PRODUCTORES],
  PRODUCTOR: [Permission.DASHBOARD],
  // Legacy
  TODO_VENDEDOR: [Permission.DASHBOARD, Permission.VENTAS],
  AUXILIAR: [Permission.COMPRAS, Permission.PRODUCTORES],
};

// ── PermissionGuard — usa @Permisos() ────────────────────────────────────────
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<Permission[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.tipo_usuario) return false;

    const userPermissions = rolePermissions[user.tipo_usuario] || [];
    return requiredPermissions.some((p) => userPermissions.includes(p));
  }
}

// ── RolesGuard — usa @Roles('ADMIN') ─────────────────────────────────────────
export const ROLES_KEY = 'roles';

export function Roles(...roles: string[]): MethodDecorator & ClassDecorator {
  return (target: any, key?: string | symbol, descriptor?: any) => {
    if (descriptor) {
      Reflect.defineMetadata(ROLES_KEY, roles, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(ROLES_KEY, roles, target);
    return target;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 🔧 CORRECCIÓN AQUÍ
    const targets = [context.getHandler(), context.getClass()] as any;

const requiredRoles = (this.reflector.getAllAndOverride(ROLES_KEY, targets) || []) as string[];

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.tipo_usuario) return false;

    return requiredRoles.includes(user.tipo_usuario);
  }
}
