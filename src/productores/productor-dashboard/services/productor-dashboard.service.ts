import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ActualizarPerfilDto } from '../dto/actualizar-perfil.dto';
import { FiltroFechasDto } from '../dto/filtro-fechas.dto';
import {
  PerfilProductor,
  EntregaHistorial,
  ResumenProductor,
  QrProductor,
} from '../interfaces/resumen-productor.interface';
import {
  QUERY_PERFIL,
  QUERY_ACTUALIZAR_PERFIL,
  QUERY_HISTORIAL,
  QUERY_RESUMEN,
  QUERY_QR,
} from '../queries/productor-dashboard.queries';

@Injectable()
export class ProductorDashboardService {
  constructor(private readonly dataSource: DataSource) {}

  // ── PERFIL ────────────────────────────────────────────────────────────────

  /**
   * Obtiene el perfil del productor autenticado.
   * @param idUsuario  ID del usuario extraído del JWT
   */
  async obtenerPerfil(idUsuario: number): Promise<PerfilProductor> {
    const rows = await this.dataSource.query(QUERY_PERFIL, [idUsuario]);

    if (!rows || rows.length === 0) {
      throw new NotFoundException(
        `No se encontró un productor activo asociado al usuario ${idUsuario}.`,
      );
    }

    return rows[0] as PerfilProductor;
  }

  // ── ACTUALIZAR PERFIL ─────────────────────────────────────────────────────

  /**
   * Actualiza telefono, ubicacion y/o finca del productor.
   * Nombre, apellido y cédula NO se pueden modificar aquí.
   * @param idUsuario  ID del usuario extraído del JWT
   * @param dto        Campos a actualizar
   */
  async actualizarPerfil(
    idUsuario: number,
    dto: ActualizarPerfilDto,
  ): Promise<PerfilProductor> {
    // Primero verificar que el productor existe y está activo
    const perfil = await this.obtenerPerfil(idUsuario);

    const rows = await this.dataSource.query(QUERY_ACTUALIZAR_PERFIL, [
      dto.telefono  ?? null,
      dto.ubicacion ?? null,
      dto.finca     ?? null,
      perfil.id_productor,
    ]);

    if (!rows || rows.length === 0) {
      throw new NotFoundException('No se pudo actualizar el perfil del productor.');
    }

    // Devolver perfil completo (con nombre/apellido del usuario)
    return this.obtenerPerfil(idUsuario);
  }

  // ── HISTORIAL DE ENTREGAS ─────────────────────────────────────────────────

  /**
   * Devuelve el historial de entregas (compras) del productor,
   * con detalle de producto, peso, precio y total.
   * @param idUsuario  ID del usuario extraído del JWT
   * @param filtros    Rango de fechas opcional
   */
  async obtenerHistorial(
    idUsuario: number,
    filtros: FiltroFechasDto,
  ): Promise<EntregaHistorial[]> {
    const perfil = await this.obtenerPerfil(idUsuario);

    const inicio = filtros.inicio ?? null;
    const fin    = filtros.fin    ?? null;

    const rows = await this.dataSource.query(QUERY_HISTORIAL, [
      perfil.id_productor,
      inicio,
      fin,
    ]);

    return (rows ?? []).map((r: any) => ({
      id_compra:          Number(r.id_compra),
      fecha:              r.fecha,
      numero_factura:     r.numero_factura ?? null,
      producto:           r.producto,
      peso:               Number(r.peso),
      // IMPORTANTE: preservar null — Number(null)=0 haría que el frontend
      // no pueda distinguir "sin precio aún" de "precio = $0"
      precio_unitario:    r.precio_unitario != null ? Number(r.precio_unitario) : null,
      total:              r.total           != null ? Number(r.total)           : null,
      // Estados del ciclo de vida de la entrega
      estado_liquidacion: r.estado_liquidacion ?? 'PENDIENTE_LIQUIDACION',
      estado_pago:        r.estado_pago        ?? 'PENDIENTE',
      comprobante_pago:   r.comprobante_pago   ?? null,
      ruta_id:            r.ruta_id            ?? null,
      ruta_precio_final:  r.ruta_precio_final  != null ? Number(r.ruta_precio_final) : null,
      // estado genérico (compatibilidad)
      estado:             r.estado_liquidacion ?? 'PENDIENTE_LIQUIDACION',
    })) as EntregaHistorial[];
  }

  // ── RESUMEN ───────────────────────────────────────────────────────────────

  /**
   * Devuelve el resumen estadístico del productor:
   * total_kg, total_dinero, total_entregas, ultima_entrega.
   * @param idUsuario  ID del usuario extraído del JWT
   */
  async obtenerResumen(idUsuario: number): Promise<ResumenProductor> {
    const perfil = await this.obtenerPerfil(idUsuario);

    const rows = await this.dataSource.query(QUERY_RESUMEN, [
      perfil.id_productor,
    ]);

    const r = rows?.[0];

    return {
      total_kg:       Number(r?.total_kg       ?? 0),
      total_dinero:   Number(r?.total_dinero   ?? 0),
      total_entregas: Number(r?.total_entregas ?? 0),
      ultima_entrega: r?.ultima_entrega ?? null,
    } as ResumenProductor;
  }

  // ── QR ────────────────────────────────────────────────────────────────────

  /**
   * Devuelve el código QR almacenado del productor.
   * @param idUsuario  ID del usuario extraído del JWT
   */
  async obtenerQr(idUsuario: number): Promise<QrProductor> {
    const perfil = await this.obtenerPerfil(idUsuario);

    const rows = await this.dataSource.query(QUERY_QR, [perfil.id_productor]);

    if (!rows || rows.length === 0) {
      throw new NotFoundException('No se encontró el QR del productor.');
    }

    const r = rows[0];

    return {
      id_productor: Number(r.id_productor),
      cedula:       r.cedula,
      codigo_qr:    r.codigo_qr ?? null,
    } as QrProductor;
  }
}