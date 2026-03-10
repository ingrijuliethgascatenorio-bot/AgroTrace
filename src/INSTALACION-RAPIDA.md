# 🚀 Instalación Rápida - Módulo de Análisis AgroTrace

## Paso 1: Descargar y Extraer

1. Descarga el archivo `analisis-mejorado.zip`
2. Extrae el contenido en tu proyecto NestJS

## Paso 2: Ubicar los Archivos

Copia la carpeta `analisis-mejorado` a tu proyecto:

```bash
# Opción A: Reemplazar módulo existente
rm -rf src/modules/analisis
cp -r analisis-mejorado src/modules/analisis

# Opción B: Crear junto al existente (recomendado para probar)
cp -r analisis-mejorado src/modules/analisis-v2
```

## Paso 3: Actualizar app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalisisModule } from './modules/analisis/analisis.module';
// ... otros imports

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // tu configuración de DB
    }),
    AnalisisModule, // <-- Agregar aquí
    // ... otros módulos
  ],
})
export class AppModule {}
```

## Paso 4: Verificar Dependencias

Asegúrate de tener instaladas estas dependencias:

```bash
npm install class-validator class-transformer @nestjs/swagger
```

Si usas TypeORM:
```bash
npm install @nestjs/typeorm typeorm
```

## Paso 5: Configurar Base de Datos

Verifica que tu tabla `produccion` tenga esta estructura:

```sql
CREATE TABLE produccion (
    id_produccion INT PRIMARY KEY AUTO_INCREMENT,
    id_productor INT NOT NULL,
    id_producto INT,
    fecha_produccion DATE NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    unidad VARCHAR(20) DEFAULT 'kg',
    lote VARCHAR(50),
    estado VARCHAR(20),
    precio_compra DECIMAL(10,2),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_productor (id_productor),
    INDEX idx_fecha (fecha_produccion),
    INDEX idx_producto (id_producto)
);
```

Si ya tienes la tabla, solo asegúrate de tener al menos:
- `id_produccion`
- `id_productor`
- `fecha_produccion`
- `cantidad`

## Paso 6: Iniciar Servidor

```bash
npm run start:dev
```

## Paso 7: Probar Endpoints

Abre tu navegador en:
```
http://localhost:3000/api
```

Prueba algunos endpoints:

### Dashboard
```
GET http://localhost:3000/analisis/dashboard
```

### Proyección Simple
```
GET http://localhost:3000/analisis/proyeccion/simple?id_productor=1
```

### Ranking
```
GET http://localhost:3000/analisis/ranking?tipo=total&limit=5
```

### Planificación de Ruta
```
GET http://localhost:3000/analisis/planificacion?precio=2000&capacidad=1500
```

## Solución de Problemas

### Error: "Cannot find module '@nestjs/typeorm'"
```bash
npm install @nestjs/typeorm typeorm mysql2
```

### Error: "Table 'produccion' doesn't exist"
- Verifica que la tabla exista en tu base de datos
- Revisa la conexión en `app.module.ts`

### Error de validación en DTOs
```bash
npm install class-validator class-transformer
```

### Puerto ocupado
Cambia el puerto en `main.ts`:
```typescript
await app.listen(3001); // en lugar de 3000
```

## Verificar que Funciona

1. Ve a `http://localhost:3000/api` (Swagger)
2. Busca la sección "Análisis y Proyecciones"
3. Deberías ver 20+ endpoints disponibles
4. Prueba `/analisis/dashboard` - debería retornar datos

## Estructura de Carpetas Final

```
src/
├── modules/
│   ├── analisis/                    <-- NUEVO MÓDULO
│   │   ├── controllers/
│   │   │   └── analisis.controller.ts
│   │   ├── services/
│   │   │   ├── estadisticas.service.ts
│   │   │   ├── proyecciones.service.ts
│   │   │   ├── ranking.service.ts
│   │   │   └── math-utils.service.ts
│   │   ├── entities/
│   │   │   └── produccion.entity.ts
│   │   ├── dto/
│   │   │   └── analisis.dto.ts
│   │   ├── analisis.module.ts
│   │   └── README.md
│   └── ... otros módulos
└── app.module.ts
```

## Endpoints Disponibles (Resumen)

### 📊 Estadísticas
- `/analisis/dashboard` - KPIs principales
- `/analisis/historial` - Historial con estadísticas
- `/analisis/tendencia` - Análisis de tendencia
- `/analisis/estacionalidad` - Factores estacionales
- `/analisis/alertas` - Alertas automáticas

### 🔮 Proyecciones
- `/analisis/proyeccion/simple` - Promedio simple
- `/analisis/proyeccion/regresion` - Regresión lineal
- `/analisis/proyeccion/estacional` - Con estacionalidad
- `/analisis/proyeccion/inteligente` - Mejor método
- `/analisis/variabilidad` - Análisis de variabilidad

### 🏆 Rankings
- `/analisis/ranking` - Ranking general
- `/analisis/ranking/mes` - Top del mes
- `/analisis/ranking/crecimiento` - Con crecimiento
- `/analisis/ranking/consistencia` - Más consistentes
- `/analisis/ranking/valor` - Por valor económico

### 🚛 Planificación
- `/analisis/planificacion` - Planificación de ruta

## Siguiente Paso

Lee el archivo `README.md` dentro de la carpeta para documentación completa de cada endpoint con ejemplos de respuesta.

## ¿Necesitas Ayuda?

Si algo no funciona:
1. Verifica los logs de la consola
2. Revisa que la base de datos esté conectada
3. Asegúrate de tener datos en la tabla `produccion`
4. Verifica que todas las dependencias estén instaladas

---

**¡Listo! Tu módulo de análisis avanzado está instalado y funcionando** 🎉
