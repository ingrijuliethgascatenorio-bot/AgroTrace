import { Injectable, Logger } from '@nestjs/common';
const nodemailer = require('nodemailer');

export interface FacturaData {
  numero_factura: string;
  fecha: string;
  nombre_cliente: string;
  email_cliente: string;
  detalles: Array<{
    producto: string;
    cantidad_kg: number;
    precio_kg: number;
    subtotal: number;
  }>;
  total: number;
  nombre_operario?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // ── Generar HTML de la factura ────────────────────────────────────────
  private generarHtmlFactura(data: FacturaData): string {
    const fmt = (n: number) =>
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(n);

    const filas = data.detalles
      .map(
        (d) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6">${d.producto}</td>
        <td style="padding:10px 14px;text-align:right;border-bottom:1px solid #f3f4f6">${d.cantidad_kg.toFixed(2)} kg</td>
        <td style="padding:10px 14px;text-align:right;border-bottom:1px solid #f3f4f6">${fmt(d.precio_kg)}</td>
        <td style="padding:10px 14px;text-align:right;border-bottom:1px solid #f3f4f6;font-weight:700">${fmt(d.subtotal)}</td>
      </tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Factura ${data.numero_factura}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

        <!-- CABECERA -->
        <tr>
          <td style="background:#16a34a;padding:28px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="color:#fff;font-size:1.6rem;font-weight:800">🌿 AgroTrace</div>
                  <div style="color:#bbf7d0;font-size:.85rem;margin-top:4px">Factura Electrónica Simulada</div>
                </td>
                <td align="right">
                  <div style="color:#fff;font-size:.8rem;opacity:.8">N° Factura</div>
                  <div style="color:#fff;font-size:1.1rem;font-weight:700">${data.numero_factura}</div>
                  <div style="color:#bbf7d0;font-size:.78rem;margin-top:4px">${data.fecha}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- INFO CLIENTE -->
        <tr>
          <td style="padding:24px 32px 0">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:48%;background:#f0fdf4;border-radius:10px;padding:14px 16px;vertical-align:top">
                  <div style="font-size:.7rem;color:#9ca3af;text-transform:uppercase;font-weight:700;margin-bottom:6px">Facturado a</div>
                  <div style="font-weight:700;color:#111827;font-size:.95rem">${data.nombre_cliente}</div>
                  <div style="color:#6b7280;font-size:.82rem;margin-top:2px">${data.email_cliente}</div>
                </td>
                <td style="width:4%"></td>
                <td style="width:48%;background:#f0fdf4;border-radius:10px;padding:14px 16px;vertical-align:top">
                  <div style="font-size:.7rem;color:#9ca3af;text-transform:uppercase;font-weight:700;margin-bottom:6px">Emitido por</div>
                  <div style="font-weight:700;color:#111827;font-size:.95rem">AgroTrace S.A.S</div>
                  <div style="color:#6b7280;font-size:.82rem;margin-top:2px">Florencia, Caquetá</div>
                  ${data.nombre_operario ? `<div style="color:#6b7280;font-size:.78rem">Operario: ${data.nombre_operario}</div>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- TABLA PRODUCTOS -->
        <tr>
          <td style="padding:24px 32px 0">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb">
              <thead>
                <tr style="background:#f9fafb">
                  <th style="padding:10px 14px;text-align:left;font-size:.72rem;color:#6b7280;text-transform:uppercase;font-weight:700">Producto</th>
                  <th style="padding:10px 14px;text-align:right;font-size:.72rem;color:#6b7280;text-transform:uppercase;font-weight:700">Cantidad</th>
                  <th style="padding:10px 14px;text-align:right;font-size:.72rem;color:#6b7280;text-transform:uppercase;font-weight:700">P. Unitario</th>
                  <th style="padding:10px 14px;text-align:right;font-size:.72rem;color:#6b7280;text-transform:uppercase;font-weight:700">Subtotal</th>
                </tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>
          </td>
        </tr>

        <!-- TOTAL -->
        <tr>
          <td style="padding:16px 32px 0">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td></td>
                <td align="right" style="background:#f0fdf4;border-radius:10px;padding:14px 20px;width:240px">
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                    <span style="color:#6b7280;font-size:.85rem">Subtotal</span>
                    <span style="font-weight:600;font-size:.85rem">${fmt(data.total)}</span>
                  </div>
                  <div style="border-top:1px solid #d1fae5;padding-top:8px;display:flex;justify-content:space-between">
                    <span style="font-weight:800;color:#166534">TOTAL</span>
                    <span style="font-weight:800;color:#16a34a;font-size:1.15rem">${fmt(data.total)}</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- NOTA SIMULACIÓN -->
        <tr>
          <td style="padding:20px 32px">
            <div style="background:#fef3c7;border-radius:8px;padding:10px 14px;font-size:.78rem;color:#92400e">
              ⚠️ <strong>Documento simulado</strong> — Esta factura es una representación informativa y
              no tiene validez fiscal ante la DIAN. Para facturación oficial, comuníquese con AgroTrace.
            </div>
          </td>
        </tr>

        <!-- PIE -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb">
            <div style="font-size:.75rem;color:#9ca3af">
              AgroTrace &mdash; Sistema de trazabilidad agrícola &mdash; Florencia, Caquetá<br>
              Generado el ${data.fecha}
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  // ── Enviar factura por correo ─────────────────────────────────────────
  async enviarFactura(data: FacturaData): Promise<void> {
     // 👇 TEMPORAL — borra esto después de confirmar que funciona
  console.log('📧 [EMAIL DEBUG]', {
    email_cliente: data.email_cliente,
    numero_factura: data.numero_factura,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS ? '✅ cargada' : '❌ NO cargada',
  });
  // 👆 fin del bloque temporal
    if (!data.email_cliente) {
      this.logger.warn(
        `Venta ${data.numero_factura}: sin email, no se envía correo`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"AgroTrace" <${process.env.EMAIL_USER}>`,
        to: data.email_cliente,
        subject: `🧾 Factura ${data.numero_factura} — AgroTrace`,
        html: this.generarHtmlFactura(data),
      });
      this.logger.log(
        `Factura ${data.numero_factura} enviada a ${data.email_cliente}`,
      );
    } catch (err) {
      // No lanzar — el correo es opcional, no debe bloquear la venta
      this.logger.error(
        `Error enviando factura ${data.numero_factura}: ${err.message}`,
      );
    }
  }
}
