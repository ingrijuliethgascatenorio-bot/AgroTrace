import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permisos.decorator';


@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permisosRequeridos = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler());
    if (!permisosRequeridos) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.permisos) return false;

    return permisosRequeridos.some(permiso => user.permisos.includes(permiso));
  }
}