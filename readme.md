# AgroTrace

**AgroTrace** es una aplicación backend basada en NestJS diseñada para la gestión, control y trazabilidad de procesos agropecuarios y de comercialización, con soporte para múltiples asociaciones (multi-tenant).

## 🚀 Tecnologías y Herramientas

Según la configuración del proyecto, se utilizan las siguientes tecnologías principales:

- **Framework:** NestJS (Node.js)
- **Base de Datos:** PostgreSQL
- **ORM:** TypeORM
- **Autenticación y Seguridad:** JWT (JSON Web Tokens), Passport, Bcrypt
- **Documentación de API:** Swagger (`@nestjs/swagger`)
- **Manejo de Archivos y Datos:** Multer (archivos), `csv-parse`, `xlsx`
- **Utilidades Adicionales:** Generación de códigos QR (`qrcode`), Envío de correos electrónicos (`nodemailer`)

## 📦 Módulos Principales

El sistema está organizado en diversos módulos de negocio (`src/modules` y otros):

- **Tenant:** Gestión de Multi-tenancy para manejar diferentes asociaciones (`TenantModule`).
- **Autenticación y Usuarios:** Gestión de acceso y usuarios (`AuthModule`, `UsersModule`).
- **Actores del Sistema:** Productores, Operarios, Comerciantes y Administradores (`ProductorModule`, `OperarioModule`, `ComerciantesModule`, `AdminModule`).
- **Comercio y Transacciones:** Manejo de compras, ventas y su historial (`ComprasModule`, `VentasModule`, `HistorialModule`).
- **Inventario y Logística:** Gestión de productos, precios, stock, entregas y rutas (`ProductosModule`, `PreciosModule`, `StockModule`, `EntregasModule`, `RutasModule`).
- **Análisis y Reportes:** Dashboards y análisis de datos (`AnalisisModule`, `ProductorDashboardModule`).

## ⚙️ Configuración y Variables de Entorno

El proyecto hace uso de `@nestjs/config` para cargar variables de entorno desde un archivo `.env`. Las variables principales para la base de datos (y sus valores por defecto si no se proveen) son:

- `DB_HOST` (localhost)
- `DB_PORT` (5432)
- `DB_USERNAME` (postgres)
- `DB_PASSWORD` (071121)
- `DB_NAME` (AgroTrace)
- `NODE_ENV` (Determina si está en 'development' para habilitar logs)

*Nota: El sistema está configurado para ajustar la zona horaria a 'America/Bogota' directamente en el driver de PostgreSQL para evitar desfasajes de fechas.*

## 📜 Scripts Disponibles

En el directorio del proyecto, puedes ejecutar los siguientes comandos (definidos en `package.json`):

### Ejecución
- `npm run start` - Inicia la aplicación.
- `npm run start:dev` - Inicia la aplicación en modo desarrollo (watch mode).
- `npm run start:debug` - Inicia la aplicación en modo debug.
- `npm run start:prod` - Inicia la aplicación compilada (producción).

### Construcción
- `npm run build` - Compila el proyecto NestJS en el directorio `dist`.

### Formato y Linting
- `npm run format` - Formatea el código usando Prettier.
- `npm run lint` - Analiza y corrige problemas de código usando ESLint.

### Pruebas
- `npm run test` - Ejecuta las pruebas de Jest.
- `npm run test:watch` - Ejecuta pruebas en modo observador.
- `npm run test:cov` - Genera el reporte de cobertura de pruebas.
- `npm run test:e2e` - Ejecuta pruebas end-to-end (E2E).
