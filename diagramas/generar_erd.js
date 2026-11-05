// Genera los diagramas entidad-relación (Mermaid erDiagram) de las figuras 12 a 15
// a partir del SQL de la base real (11_entidades_base_datos_drawdb.sql de AgroTrace-V2).
// Uso: node generar_erd.js <ruta del .sql> <carpeta de salida>
const fs = require('fs');
const path = require('path');

const [sqlPath, salida] = process.argv.slice(2);
const sql = fs.readFileSync(sqlPath, 'utf8');

// Tablas y columnas
const tablas = {};
for (const m of sql.matchAll(/CREATE TABLE (\w+) \(([\s\S]*?)\n\);/g)) {
  const cuerpo = m[2].split('\n').map(l => l.trim().replace(/,$/, '')).filter(Boolean);
  const cols = [];
  let pk = [], uk = [];
  for (const l of cuerpo) {
    const p = /^PRIMARY KEY \(([^)]+)\)/.exec(l);
    const u = /^UNIQUE \(([^)]+)\)/.exec(l);
    if (p) { pk = p[1].split(',').map(s => s.trim()); continue; }
    if (u) { const c = u[1].split(',').map(s => s.trim()); if (c.length === 1) uk.push(c[0]); continue; }
    const c = /^(\w+) ([a-z]+)/.exec(l);
    if (c) cols.push({ nombre: c[1], tipo: c[2] === 'character' ? 'char' : c[2], nulo: !/NOT NULL/.test(l) });
  }
  tablas[m[1]] = { cols, pk, uk };
}

// Llaves foráneas
const fks = [];
for (const m of sql.matchAll(/ALTER TABLE (\w+) ADD CONSTRAINT \w+ FOREIGN KEY \(([^)]+)\) REFERENCES (\w+)/g)) {
  fks.push({ tabla: m[1], col: m[2].trim(), ref: m[3] });
}

// Las columnas *_por (quién registró, anuló, aprobó...) apuntan a usuario. Se marcan como FK,
// pero no se dibuja la línea para que el diagrama se pueda leer; el texto de la sección 3.5 lo explica.
const esTrazaUsuario = f => f.ref === 'usuario' && (/_por$/.test(f.col) || /^usuario_(aplicado|descartado)_id$/.test(f.col));

const grupos = {
  '12_erd_jornadas_compras': {
    titulo: 'Pakopi - Modelo entidad-relación: jornadas y compras (Módulos B, E y F)',
    tablas: ['ruta', 'ruta_operario', 'jornada', 'jornada_dispositivo', 'compra', 'pesada', 'correccion_pesada', 'producto', 'precio', 'productor'],
  },
  '13_erd_liquidacion_pagos': {
    titulo: 'Pakopi - Modelo entidad-relación: liquidación y pagos (Módulo C)',
    tablas: ['liquidacion', 'liquidacion_detalle', 'pago', 'pago_detalle'],
  },
  '14_erd_usuarios_familias': {
    titulo: 'Pakopi - Modelo entidad-relación: usuarios, roles y grupos familiares (Módulos A y D)',
    tablas: ['usuario', 'rol', 'usuario_rol', 'grupo_familiar', 'grupo_integrante', 'grupo_representante', 'grupo_modalidad_jornada'],
  },
  '15_erd_ventas_sync_auditoria': {
    titulo: 'Pakopi - Modelo entidad-relación: ventas, sincronización y auditoría (Módulos F, H, I y J)',
    tablas: ['comerciante', 'venta', 'venta_linea', 'venta_linea_jornada', 'abono', 'precio_venta', 'dispositivo',
      'operacion_sincronizacion', 'conflicto_sincronizacion', 'operacion_retenida', 'autorizacion_restauracion', 'auditoria', 'configuracion'],
  },
};

const todas = Object.values(grupos).flatMap(g => g.tablas);
const faltan = Object.keys(tablas).filter(t => !todas.includes(t));
if (faltan.length) throw new Error('Tablas sin grupo: ' + faltan.join(', '));

const MAY = n => n.toUpperCase();
for (const [archivo, g] of Object.entries(grupos)) {
  const propias = new Set(g.tablas);
  const rels = fks.filter(f => (propias.has(f.tabla) || propias.has(f.ref)) && !esTrazaUsuario(f))
    .filter(f => propias.has(f.tabla));   // solo relaciones que salen de las tablas del grupo
  const externas = [...new Set(rels.map(f => f.ref).filter(r => !propias.has(r)))].sort();

  const lineas = ['---', `title: "${g.titulo}"`, '---', 'erDiagram'];
  for (const t of g.tablas) {
    const { cols, pk, uk } = tablas[t];
    const fkCols = new Set(fks.filter(f => f.tabla === t).map(f => f.col));
    lineas.push(`    ${MAY(t)} {`);
    for (const c of cols) {
      const k = [pk.includes(c.nombre) && 'PK', fkCols.has(c.nombre) && 'FK', uk.includes(c.nombre) && 'UK'].filter(Boolean).join(', ');
      lineas.push(`        ${c.tipo} ${c.nombre}${k ? ' ' + k : ''}`);
    }
    lineas.push('    }');
  }
  for (const t of externas) {
    lineas.push(`    ${MAY(t)} {`, `        ${tablas[t].cols.find(c => c.nombre === tablas[t].pk[0]).tipo} ${tablas[t].pk[0]} PK`, '    }');
  }
  for (const f of rels) {
    const col = tablas[f.tabla].cols.find(c => c.nombre === f.col);
    const unico = tablas[f.tabla].uk.includes(f.col) || (tablas[f.tabla].pk.length === 1 && tablas[f.tabla].pk[0] === f.col);
    const padre = col && col.nulo ? '|o' : '||';
    const hijo = unico ? 'o|' : 'o{';
    lineas.push(`    ${MAY(f.ref)} ${padre}--${hijo} ${MAY(f.tabla)} : "${f.col}"`);
  }
  fs.writeFileSync(path.join(salida, archivo + '.mmd'), lineas.join('\n') + '\n');
  console.log(`${archivo}: ${g.tablas.length} tablas, ${externas.length} de referencia, ${rels.length} relaciones`);
}
