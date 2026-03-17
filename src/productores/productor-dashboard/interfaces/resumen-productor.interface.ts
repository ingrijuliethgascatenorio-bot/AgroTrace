export interface PerfilProductor {
  id_productor: number;
  id_usuario: number;
  nombre: string;
  apellido: string;
  cedula: string;
  finca: string | null;
  ubicacion: string | null;
  telefono: string | null;
  codigo_qr: string | null;
  estado: string;
}

export interface EntregaHistorial {
  id_compra: number;
  fecha: string;
  numero_factura: string | null;
  producto: string;
  peso: number;
  precio_unitario: number;
  total: number;
  estado: string;
}

export interface ResumenProductor {
  total_kg: number;
  total_dinero: number;
  total_entregas: number;
  ultima_entrega: string | null;
}

export interface QrProductor {
  id_productor: number;
  cedula: string;
  codigo_qr: string | null;
}
