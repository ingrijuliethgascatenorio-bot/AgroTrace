// src/modules/ventas/ventas.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venta } from './ventas.entity';
import { EmailService, FacturaData } from '../email/email.service';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepo: Repository<Venta>,

    // Inyectado para enviar la factura cuando el operario lo decide
    private readonly emailService: EmailService,
  ) {}

  findAll(): Promise<Venta[]> {
    return this.ventaRepo.find({
      relations: ['detalles', 'detalles.producto', 'comerciante'],
      order: { id_venta: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Venta> {
    const v = await this.ventaRepo.findOne({
      where: { id_venta: id },
      relations: ['detalles', 'detalles.producto', 'comerciante'],
    });
    if (!v) throw new NotFoundException(`Venta #${id} no encontrada`);
    return v;
  }

  /**
   * PATCH /api/ventas/:id/estado
   *
   * Nueva lógica:
   * - Cambia el estado de la venta en la BD.
   * - Si el body incluye `email_factura`, envía la factura a ese correo
   *   (el operario lo decide desde el modal del frontend).
   * - Si no hay `email_factura` pero el comerciante tiene email en BD,
   *   también envía la factura (comportamiento anterior, por compatibilidad).
   * - Un fallo de correo NUNCA lanza excepción ni bloquea la respuesta.
   */
  async cambiarEstado(
    id: number,
    body: { estado: string; email_factura?: string },
  ): Promise<Venta> {
    // 1. Buscar la venta con relaciones para armar la factura
    const v = await this.ventaRepo.findOne({
      where: { id_venta: id },
      relations: ['detalles', 'detalles.producto', 'comerciante'],
    });
    if (!v) throw new NotFoundException(`Venta #${id} no encontrada`);

    // 2. Actualizar estado — normalizar a minúsculas para consistencia interna
    v.estado = (body.estado || '').toLowerCase();
    await this.ventaRepo.save(v);

    // 3. Determinar correo de destino
    //    Prioridad: email_factura enviado por el frontend (operario lo eligió)
    //              > email del comerciante en BD
    const emailDestino =
      (body.email_factura || '').trim() ||
      (v.comerciante?.email || '').trim() ||
      '';

    // 4. Enviar factura solo si hay correo válido (fire-and-forget)
    if (emailDestino) {
      this.enviarFacturaPorEstado(v, emailDestino);
    }

    return v;
  }

  /**
   * Construye el FacturaData a partir de la entidad Venta y delega el envío.
   * Private — un fallo de correo nunca rompe el flujo principal.
   */
  private enviarFacturaPorEstado(venta: Venta, emailDestino: string): void {
    const fmt = (n: number) =>
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(n);

    const detalles: FacturaData['detalles'] = (venta.detalles || []).map(
      (d) => ({
        producto: d.producto?.nombre ?? `Producto #${d.id_producto}`,
        cantidad_kg: Number(d.cantidad),
        precio_kg: Number(d.precio_unitario),
        subtotal: Number(d.subtotal),
      }),
    );

    const facturaData: FacturaData = {
      numero_factura:
        venta.numero_factura ??
        `VTA-${String(venta.id_venta).padStart(6, '0')}`,
      fecha: new Date().toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Bogota',
      }),
      nombre_cliente:
        venta.cliente || venta.comerciante?.nombre || 'Comerciante',
      email_cliente: emailDestino,
      detalles,
      total: Number(venta.total),
    };

    // Fire-and-forget: el error ya se loguea dentro de EmailService
    this.emailService.enviarFactura(facturaData).catch(() => {});
  }
}
