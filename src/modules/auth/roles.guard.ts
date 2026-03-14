import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../../common/enums/permissions.enum';
import { PERMISSIONS_KEY } from '../../common/decorators/permisos.decorator';

const rolePermissions: Record<string, Permission[]> = {
  ADMIN: Object.values(Permission),
  TODO_VENDEDOR: [Permission.DASHBOARD, Permission.VENTAS],
  AUXILIAR: [Permission.COMPRAS, Permission.PRODUCTORES],
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<Permission[]>(PERMISSIONS_KEY, context.getHandler());
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tipo_usuario) return false;

    const userPermissions = rolePermissions[user.tipo_usuario] || [];
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }
}