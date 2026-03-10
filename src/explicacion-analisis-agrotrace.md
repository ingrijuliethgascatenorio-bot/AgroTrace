# 📊 Módulo de Análisis AgroTrace - Explicación Completa

## 🏗️ Arquitectura del Módulo

```
analisis/
├── analisis.module.ts              # Módulo principal (registra todo)
├── controllers/
│   └── analisis.controller.ts      # Endpoints HTTP (rutas API)
├── services/
│   ├── estadisticas.service.ts     # Historial y tendencias
│   ├── proyecciones.service.ts     # Proyecciones y planificación
│   └── ranking.service.ts          # Rankings de productores
├── entities/
│   └── produccion.entity.ts        # Modelo de datos (tabla produccion)
└── dto/
    ├── filtro-fecha.dto.ts         # Validación de parámetros de fecha
    └── filtro-productor.dto.ts     # Validación de parámetros de productor
```

---

## 🗄️ Base de Datos

### Tabla: `produccion`

```sql
CREATE TABLE produccion (
    id_produccion INT PRIMARY KEY AUTO_INCREMENT,
    id_productor INT NOT NULL,
    fecha_produccion DATE NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    unidad VARCHAR(20) DEFAULT 'kg',
    lote VARCHAR(50),
    estado VARCHAR(20),
    FOREIGN KEY (id_productor) REFERENCES productores(id_productor)
);
```

**Datos de ejemplo:**

| id_produccion | id_productor | fecha_produccion | cantidad | unidad | lote    | estado    |
|---------------|--------------|------------------|----------|--------|---------|-----------|
| 1             | 1            | 2024-01-15       | 150.50   | kg     | L001    | ENTREGADO |
| 2             | 1            | 2024-02-10       | 180.00   | kg     | L002    | ENTREGADO |
| 3             | 1            | 2024-03-05       | 165.25   | kg     | L003    | ENTREGADO |
| 4             | 2            | 2024-01-20       | 220.00   | kg     | L004    | ENTREGADO |
| 5             | 2            | 2024-02-15       | 240.50   | kg     | L005    | ENTREGADO |

---

## 📡 Endpoints API Disponibles

### 1️⃣ GET /estadisticas/historial
**Descripción:** Obtiene el historial de producción de un productor en un rango de fechas

**Parámetros:**
```
id_productor: number (requerido)
inicio: string (opcional, formato YYYY-MM-DD)
fin: string (opcional, formato YYYY-MM-DD)
```

**Ejemplo de petición:**
```http
GET /estadisticas/historial?id_productor=1&inicio=2024-01-01&fin=2024-03-31
```

**Respuesta:**
```json
[
  {
    "fecha_produccion": "2024-01-15",
    "cantidad": 150.50,
    "unidad": "kg",
    "lote": "L001",
    "estado": "ENTREGADO"
  },
  {
    "fecha_produccion": "2024-02-10",
    "cantidad": 180.00,
    "unidad": "kg",
    "lote": "L002",
    "estado": "ENTREGADO"
  },
  {
    "fecha_produccion": "2024-03-05",
    "cantidad": 165.25,
    "unidad": "kg",
    "lote": "L003",
    "estado": "ENTREGADO"
  }
]
```

**¿Cómo funciona internamente?**

```typescript
// En estadisticas.service.ts

async obtenerHistorial(idProductor: number, inicio?: string, fin?: string) {
  // 1. Crear query base
  let query = this.produccionRepository
    .createQueryBuilder('p')
    .select([
      'p.fecha_produccion AS fecha_produccion',
      'p.cantidad AS cantidad',
      'p.unidad AS unidad',
      'p.lote AS lote',
      'p.estado AS estado',
    ])
    .where('p.id_productor = :idProductor', { idProductor });

  // 2. Agregar filtro de fecha inicio (si existe)
  if (inicio) {
    query = query.andWhere('p.fecha_produccion >= :inicio', { inicio });
  }

  // 3. Agregar filtro de fecha fin (si existe)
  if (fin) {
    query = query.andWhere('p.fecha_produccion <= :fin', { fin });
  }

  // 4. Ordenar por fecha ascendente
  const resultados = await query
    .orderBy('p.fecha_produccion', 'ASC')
    .getRawMany();

  return resultados;
}
```

**SQL generado (aproximado):**
```sql
SELECT 
    fecha_produccion, 
    cantidad, 
    unidad, 
    lote, 
    estado
FROM produccion p
WHERE p.id_productor = 1
  AND p.fecha_produccion >= '2024-01-01'
  AND p.fecha_produccion <= '2024-03-31'
ORDER BY p.fecha_produccion ASC;
```

---

### 2️⃣ GET /estadisticas/proyeccion
**Descripción:** Calcula la proyección de producción basándose en el promedio de las últimas 5 entregas

**Parámetros:**
```
id_productor: number (requerido)
```

**Ejemplo de petición:**
```http
GET /estadisticas/proyeccion?id_productor=1
```

**Respuesta (con datos suficientes):**
```json
{
  "proyeccion": "165.25",
  "unidad": "kg",
  "registros_analizados": 5
}
```

**Respuesta (datos insuficientes):**
```json
{
  "proyeccion": 0,
  "unidad": "kg",
  "advertencia": "Datos insuficientes para proyección (mínimo 3 registros)"
}
```

**¿Cómo se calcula la proyección?**

```typescript
// En proyecciones.service.ts

async obtenerProyeccion(idProductor: number) {
  // 1. Obtener las últimas 5 entregas ordenadas por fecha descendente
  const ultimas5 = await this.produccionRepository
    .createQueryBuilder('p')
    .select('p.cantidad', 'cantidad')
    .addSelect('p.unidad', 'unidad')
    .where('p.id_productor = :idProductor', { idProductor })
    .orderBy('p.fecha_produccion', 'DESC')
    .limit(5)
    .getRawMany();

  // 2. Validar que haya al menos 3 registros
  if (ultimas5.length < 3) {
    return {
      proyeccion: 0,
      unidad: 'kg',
      advertencia: 'Datos insuficientes para proyección (mínimo 3 registros)',
    };
  }

  // 3. Calcular promedio
  const totalCantidad = ultimas5.reduce(
    (sum, item) => sum + parseFloat(item.cantidad),
    0,
  );
  const promedio = totalCantidad / ultimas5.length;

  // 4. Retornar proyección
  return {
    proyeccion: promedio.toFixed(2),
    unidad: ultimas5[0].unidad,
    registros_analizados: ultimas5.length,
  };
}
```

**Ejemplo de cálculo manual:**

Últimas 5 entregas del productor ID=1:
- 2024-03-15: 170 kg
- 2024-03-01: 165 kg
- 2024-02-15: 180 kg
- 2024-02-01: 155 kg
- 2024-01-15: 160 kg

**Cálculo:**
```
Total = 170 + 165 + 180 + 155 + 160 = 830 kg
Promedio = 830 / 5 = 166 kg

Proyección = 166 kg (se espera que la próxima entrega sea aproximadamente 166 kg)
```

---

### 3️⃣ GET /estadisticas/tendencia
**Descripción:** Calcula la tendencia comparando los últimos 3 meses con los 3 meses anteriores

**Parámetros:**
```
id_productor: number (requerido)
```

**Ejemplo de petición:**
```http
GET /estadisticas/tendencia?id_productor=1
```

**Respuesta:**
```json
{
  "promedio_actual": 175.50,
  "promedio_anterior": 160.25,
  "diferencia_porcentual": "9.52",
  "tendencia": "Creciente"
}
```

**¿Cómo se calcula la tendencia?**

```typescript
// En estadisticas.service.ts

async obtenerTendencia(idProductor: number) {
  // 1. Calcular fechas de referencia
  const fechaActual = new Date();
  const fechaTresMeses = new Date();
  fechaTresMeses.setMonth(fechaTresMeses.getMonth() - 3);
  
  const fechaSeisMeses = new Date();
  fechaSeisMeses.setMonth(fechaSeisMeses.getMonth() - 6);

  // 2. Promedio ÚLTIMOS 3 meses (de hace 3 meses a hoy)
  const promedioActual = await this.produccionRepository
    .createQueryBuilder('p')
    .select('AVG(p.cantidad)', 'promedio')
    .where('p.id_productor = :idProductor', { idProductor })
    .andWhere('p.fecha_produccion >= :fechaTresMeses', {
      fechaTresMeses: fechaTresMeses.toISOString().split('T')[0],
    })
    .getRawOne();

  // 3. Promedio de hace 3 a 6 meses (período anterior)
  const promedioAnterior = await this.produccionRepository
    .createQueryBuilder('p')
    .select('AVG(p.cantidad)', 'promedio')
    .where('p.id_productor = :idProductor', { idProductor })
    .andWhere('p.fecha_produccion >= :fechaSeisMeses', {
      fechaSeisMeses: fechaSeisMeses.toISOString().split('T')[0],
    })
    .andWhere('p.fecha_produccion < :fechaTresMeses', {
      fechaTresMeses: fechaTresMeses.toISOString().split('T')[0],
    })
    .getRawOne();

  const actual = parseFloat(promedioActual?.promedio || '0');
  const anterior = parseFloat(promedioAnterior?.promedio || '0');

  // 4. Calcular diferencia porcentual
  let tendencia = 'Estable';
  let diferenciaPorcentual = 0;

  if (anterior > 0) {
    diferenciaPorcentual = ((actual - anterior) / anterior) * 100;

    // 5. Determinar tendencia
    if (diferenciaPorcentual > 5) {
      tendencia = 'Creciente';
    } else if (diferenciaPorcentual < -5) {
      tendencia = 'Decreciente';
    }
  }

  return {
    promedio_actual: actual,
    promedio_anterior: anterior,
    diferencia_porcentual: diferenciaPorcentual.toFixed(2),
    tendencia,
  };
}
```

**Ejemplo visual de cómo funciona:**

```
Línea de tiempo:
|---------------|---------------|---------------|
Hace 6 meses   Hace 3 meses      Hoy
   ↓                ↓              ↓
   │◄─ Período ────►│◄─ Período ─►│
   │   ANTERIOR     │   ACTUAL     │

Supongamos fecha actual: 2024-03-15

Período ANTERIOR (hace 6-3 meses): 2023-09-15 a 2023-12-15
  Entregas: [150, 155, 160, 165] kg
  Promedio anterior = (150+155+160+165)/4 = 157.5 kg

Período ACTUAL (últimos 3 meses): 2023-12-15 a 2024-03-15
  Entregas: [170, 175, 180, 185] kg
  Promedio actual = (170+175+180+185)/4 = 177.5 kg

CÁLCULO:
Diferencia porcentual = ((177.5 - 157.5) / 157.5) * 100
                      = (20 / 157.5) * 100
                      = 12.70%

Como 12.70% > 5% → Tendencia = "Creciente" ✅
```

---

### 4️⃣ GET /estadisticas/ranking
**Descripción:** Genera ranking de productores según diferentes criterios

**Parámetros:**
```
tipo: 'total' | 'promedio' | 'frecuencia' (opcional, default: 'total')
```

**Ejemplo de petición:**
```http
GET /estadisticas/ranking?tipo=total
```

**Respuesta:**
```json
[
  {
    "posicion": 1,
    "id_productor": 5,
    "valor": 1250.75
  },
  {
    "posicion": 2,
    "id_productor": 2,
    "valor": 980.50
  },
  {
    "posicion": 3,
    "id_productor": 1,
    "valor": 875.25
  }
]
```

**¿Cómo funciona cada tipo de ranking?**

```typescript
// En ranking.service.ts

async obtenerRanking(tipo: 'total' | 'promedio' | 'frecuencia' = 'total') {
  let selectField: string;

  switch (tipo) {
    case 'total':
      // SUMA total de producción por productor
      selectField = 'SUM(p.cantidad)';
      break;
    case 'promedio':
      // PROMEDIO de producción por productor
      selectField = 'AVG(p.cantidad)';
      break;
    case 'frecuencia':
      // NÚMERO de entregas por productor
      selectField = 'COUNT(p.id_produccion)';
      break;
    default:
      selectField = 'SUM(p.cantidad)';
  }

  const resultados = await this.produccionRepository
    .createQueryBuilder('p')
    .select('p.id_productor', 'id_productor')
    .addSelect(selectField, 'valor')
    .groupBy('p.id_productor')
    .orderBy('valor', 'DESC')
    .getRawMany();

  // Agregar posición (1, 2, 3...)
  return resultados.map((item, index) => ({
    posicion: index + 1,
    id_productor: item.id_productor,
    valor: parseFloat(item.valor),
  }));
}
```

**Ejemplos de cada tipo:**

#### A) Ranking por TOTAL (suma de producción)

```sql
SELECT 
    id_productor,
    SUM(cantidad) as valor
FROM produccion
GROUP BY id_productor
ORDER BY valor DESC;
```

Resultado:
| posicion | id_productor | valor (kg) |
|----------|--------------|------------|
| 1        | 5            | 1250.75    |
| 2        | 2            | 980.50     |
| 3        | 1            | 875.25     |

**Significado:** El productor 5 ha entregado MÁS kilos en total


#### B) Ranking por PROMEDIO (promedio por entrega)

```sql
SELECT 
    id_productor,
    AVG(cantidad) as valor
FROM produccion
GROUP BY id_productor
ORDER BY valor DESC;
```

Resultado:
| posicion | id_productor | valor (kg) |
|----------|--------------|------------|
| 1        | 3            | 220.50     |
| 2        | 5            | 180.25     |
| 3        | 1            | 165.00     |

**Significado:** El productor 3 tiene el PROMEDIO más alto por entrega


#### C) Ranking por FRECUENCIA (número de entregas)

```sql
SELECT 
    id_productor,
    COUNT(id_produccion) as valor
FROM produccion
GROUP BY id_productor
ORDER BY valor DESC;
```

Resultado:
| posicion | id_productor | valor (entregas) |
|----------|--------------|------------------|
| 1        | 1            | 15               |
| 2        | 5            | 12               |
| 3        | 2            | 10               |

**Significado:** El productor 1 es el que MÁS VECES ha entregado producción

---

### 5️⃣ GET /estadisticas/planificacion
**Descripción:** Planifica una ruta de recolección calculando el total proyectado y si cabe en la capacidad del vehículo

**Parámetros:**
```
precio: number (requerido) - Precio por kg
capacidad: number (requerido) - Capacidad del vehículo en kg
```

**Ejemplo de petición:**
```http
GET /estadisticas/planificacion?precio=2000&capacidad=1500
```

**Respuesta (dentro de capacidad):**
```json
{
  "total_proyectado": 1320.50,
  "total_estimado": 2641000.00,
  "capacidad": 1500,
  "supera_capacidad": false,
  "alerta": "✅ Capacidad suficiente"
}
```

**Respuesta (supera capacidad):**
```json
{
  "total_proyectado": 1850.75,
  "total_estimado": 3701500.00,
  "capacidad": 1500,
  "supera_capacidad": true,
  "alerta": "⚠️ Se supera la capacidad en 350.75 kg"
}
```

**¿Cómo funciona?**

```typescript
// En proyecciones.service.ts

async planificarRuta(precio: number, capacidad: number) {
  // 1. Validaciones
  if (!precio || precio <= 0) {
    throw new BadRequestException('El precio debe ser mayor a 0');
  }

  if (!capacidad || capacidad <= 0) {
    throw new BadRequestException('La capacidad debe ser mayor a 0');
  }

  // 2. Obtener todos los productores únicos
  const productores = await this.produccionRepository
    .createQueryBuilder('p')
    .select('DISTINCT p.id_productor', 'id_productor')
    .getRawMany();

  let totalProyectado = 0;

  // 3. Calcular proyección para CADA productor
  for (const prod of productores) {
    const proyeccion = await this.obtenerProyeccion(prod.id_productor);

    const valor = Number(proyeccion.proyeccion);

    // Solo sumar si tiene datos válidos
    if (valor > 0 && !proyeccion.advertencia) {
      totalProyectado += valor;
    }
  }

  // 4. Calcular total en dinero
  const totalEstimado = totalProyectado * precio;
  
  // 5. Verificar capacidad
  const superaCapacidad = totalProyectado > capacidad;

  return {
    total_proyectado: parseFloat(totalProyectado.toFixed(2)),
    total_estimado: parseFloat(totalEstimado.toFixed(2)),
    capacidad,
    supera_capacidad: superaCapacidad,
    alerta: superaCapacidad
      ? `⚠️ Se supera la capacidad en ${(totalProyectado - capacidad).toFixed(2)} kg`
      : '✅ Capacidad suficiente',
  };
}
```

**Ejemplo paso a paso:**

```
Supongamos que tienes 5 productores:

Productor 1:
  Últimas 5 entregas: [150, 160, 155, 165, 170] kg
  Proyección = (150+160+155+165+170)/5 = 160 kg

Productor 2:
  Últimas 5 entregas: [200, 210, 205, 215, 220] kg
  Proyección = (200+210+205+215+220)/5 = 210 kg

Productor 3:
  Últimas 5 entregas: [180, 190, 185, 195, 200] kg
  Proyección = (180+190+185+195+200)/5 = 190 kg

Productor 4:
  Solo 2 entregas → advertencia (datos insuficientes) → NO SE SUMA

Productor 5:
  Últimas 5 entregas: [220, 230, 225, 235, 240] kg
  Proyección = (220+230+225+235+240)/5 = 230 kg

CÁLCULOS:
Total proyectado = 160 + 210 + 190 + 0 + 230 = 790 kg

Precio por kg = $2000
Total estimado = 790 kg × $2000 = $1,580,000

Capacidad del vehículo = 1500 kg
¿Supera capacidad? 790 kg < 1500 kg → NO ✅

Espacio disponible = 1500 - 790 = 710 kg
```

---

## 🔧 Mejoras Sugeridas

### 1. Agregar Regresión Lineal Real

```typescript
// En proyecciones.service.ts

calculateLinearTrend(data: { x: number; y: number }[]) {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  data.forEach(point => {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

async obtenerProyeccionAvanzada(idProductor: number, mesesAdelante: number = 1) {
  const historico = await this.produccionRepository
    .createQueryBuilder('p')
    .select('p.fecha_produccion', 'fecha')
    .addSelect('p.cantidad', 'cantidad')
    .where('p.id_productor = :idProductor', { idProductor })
    .orderBy('p.fecha_produccion', 'ASC')
    .getRawMany();

  const dataPoints = historico.map((item, index) => ({
    x: index + 1,
    y: parseFloat(item.cantidad)
  }));

  const trend = this.calculateLinearTrend(dataPoints);

  const futureValue = trend.slope * (dataPoints.length + mesesAdelante) + trend.intercept;

  return {
    proyeccion: Math.max(0, futureValue.toFixed(2)),
    metodo: 'regresion_lineal',
    confianza: this.calculateR2(dataPoints, trend)
  };
}
```

### 2. Agregar Análisis de Estacionalidad

```typescript
async detectarEstacionalidad(idProductor: number) {
  const datos = await this.produccionRepository
    .createQueryBuilder('p')
    .select('MONTH(p.fecha_produccion)', 'mes')
    .addSelect('AVG(p.cantidad)', 'promedio')
    .where('p.id_productor = :idProductor', { idProductor })
    .groupBy('mes')
    .getRawMany();

  const promedioGlobal = datos.reduce((sum, d) => sum + parseFloat(d.promedio), 0) / datos.length;

  return datos.map(d => ({
    mes: d.mes,
    factor_estacional: (parseFloat(d.promedio) / promedioGlobal).toFixed(2)
  }));
}
```

### 3. Agregar Dashboard Completo

```typescript
async getDashboardData() {
  const totalProductores = await this.produccionRepository
    .createQueryBuilder('p')
    .select('COUNT(DISTINCT p.id_productor)', 'total')
    .getRawOne();

  const produccionMensual = await this.produccionRepository
    .createQueryBuilder('p')
    .select('SUM(p.cantidad)', 'total')
    .where('p.fecha_produccion >= DATE_SUB(NOW(), INTERVAL 1 MONTH)')
    .getRawOne();

  const topProductores = await this.obtenerRanking('total');

  return {
    total_productores: parseInt(totalProductores.total),
    produccion_mensual: parseFloat(produccionMensual.total || '0'),
    top_productores: topProductores.slice(0, 5)
  };
}
```

---

## 📈 Resumen de Fórmulas Utilizadas

### 1. **Proyección Simple (Promedio Móvil)**
```
Proyección = (Σ últimas N entregas) / N
```

### 2. **Diferencia Porcentual**
```
Diferencia% = ((Valor_Actual - Valor_Anterior) / Valor_Anterior) × 100
```

### 3. **Tendencia**
```
Si Diferencia% > 5%  → "Creciente"
Si Diferencia% < -5% → "Decreciente"
Si -5% ≤ Diferencia% ≤ 5% → "Estable"
```

### 4. **Capacidad Excedida**
```
Exceso = Total_Proyectado - Capacidad_Vehículo
Si Exceso > 0 → Alerta
```

---

## 🎯 Casos de Uso Prácticos

### Caso 1: Operario planifica ruta de recolección
```
1. Llama a GET /estadisticas/planificacion?precio=2500&capacidad=2000
2. El sistema calcula proyección de todos los productores
3. Retorna si cabe en el vehículo
4. Operario decide si necesita 2 viajes o ajusta ruta
```

### Caso 2: Admin analiza rendimiento de productor
```
1. Llama a GET /estadisticas/tendencia?id_productor=5
2. Ve si el productor está mejorando o empeorando
3. Toma decisiones (bonos, capacitación, etc.)
```

### Caso 3: Sistema genera ranking para dashboard
```
1. Llama a GET /estadisticas/ranking?tipo=total
2. Muestra top 5 productores en el frontend
3. Gamificación: productores compiten por posiciones
```

---

## 🚀 Próximos Pasos Recomendados

1. ✅ Implementar regresión lineal para proyecciones más precisas
2. ✅ Agregar análisis de estacionalidad (meses con más/menos producción)
3. ✅ Crear endpoint de dashboard unificado
4. ✅ Agregar alertas automáticas cuando tendencia sea "Decreciente"
5. ✅ Implementar caché para consultas frecuentes
6. ✅ Agregar filtros por producto específico
7. ✅ Crear reportes en PDF con gráficas
