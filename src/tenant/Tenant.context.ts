// src/tenant/tenant.context.ts
import { Injectable, Scope } from '@nestjs/common';

/**
 * Almacena el asociacion_id del tenant activo para el ciclo de vida
 * de cada request HTTP (Scope.REQUEST garantiza una instancia por request).
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  private _asociacionId: number;
  private _subdominio: string;

  setTenant(asociacionId: number, subdominio: string): void {
    this._asociacionId = asociacionId;
    this._subdominio = subdominio;
  }

  get asociacionId(): number {
    return this._asociacionId;
  }

  get subdominio(): string {
    return this._subdominio;
  }
}
