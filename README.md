# ARYCP ERP - Sistema de Gestión Empresarial

Sistema ERP completo para ARYCP Soluciones Corporativas, especializado en gestión de trámites, procesos y calendarios para despachos contables y de asesoría empresarial.

## Características

### 🏢 Landing Page Corporativa
- Presentación de servicios de asesoría integral
- Áreas: Jurídica, Contable, Fiscal, Gestoría
- Diseño profesional con colores corporativos

### 🔐 Sistema de Autenticación
- Login y registro con Supabase Auth
- Autenticación segura con email y contraseña
- Recuperación de contraseña

### 📊 Dashboard Ejecutivo
- Vista general de métricas clave
- Trámites activos y pendientes
- Alertas y notificaciones
- Acceso rápido a módulos principales

### 📅 Calendario Integrado con Google Calendar
- Conexión con cuenta personal de Google
- Creación y edición de eventos
- Vinculación de eventos con clientes y procesos
- Notificaciones y recordatorios automáticos
- Vista de equipo para coordinación

### 🗂️ Gestión de Clientes
- Base de datos de clientes y empresas
- Historial de trámites por cliente
- Información de contacto y notas

### 📋 Control de Procesos y Tramitología
- Seguimiento de trámites fiscales, jurídicos y contables
- Estados y prioridades
- Fechas de vencimiento
- Vinculación con calendario

## Stack Tecnológico

- **Framework**: Next.js 16 con App Router
- **UI**: React 19, Tailwind CSS v4, shadcn/ui
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Integración**: Google Calendar API
- **Despliegue**: Vercel

## Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd arycp-erp
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Google Calendar
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# Database (automático con Supabase)
POSTGRES_URL=tu_postgres_url
```

### 4. Ejecutar migraciones de base de datos

Las migraciones están en la carpeta `scripts/`. Ejecútalas en orden:

1. `01_create_calendar_tables.sql`

### 5. Configurar Google Calendar

Sigue la guía detallada en [CALENDAR_SETUP.md](./CALENDAR_SETUP.md)

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

```
arycp-erp/
├── app/                          # Rutas de Next.js App Router
│   ├── auth/                     # Páginas de autenticación
│   │   ├── login/
│   │   └── sign-up/
│   ├── dashboard/                # Dashboard y módulos del ERP
│   │   └── calendar/            # Módulo de calendario
│   ├── api/                     # API Routes
│   │   ├── auth/google/         # OAuth de Google
│   │   └── calendar/events/     # Endpoints de eventos
│   ├── layout.tsx
│   ├── page.tsx                 # Landing page
│   └── globals.css
├── components/                  # Componentes React
│   ├── landing/                # Componentes de la landing
│   ├── calendar/               # Componentes del calendario
│   └── ui/                     # Componentes de UI (shadcn)
├── lib/                        # Utilidades y configuración
│   ├── supabase/              # Clientes de Supabase
│   ├── google-calendar.ts     # Integración con Google
│   └── utils.ts
├── scripts/                   # Scripts SQL de base de datos
├── public/                    # Archivos estáticos
└── proxy.ts                   # Middleware de autenticación

## Módulos del ERP

### ✅ Calendario (Implementado)
- Integración completa con Google Calendar
- Gestión de eventos con clientes y procesos
- Notificaciones y recordatorios

### 🚧 Próximos Módulos

- **Tramitología**: Gestión completa de trámites
- **Control de Procesos**: Flujos de trabajo y seguimiento
- **Gestión de Clientes**: CRUD completo de clientes
- **Reportes**: Generación de reportes y estadísticas
- **Documentos**: Gestión documental
- **Facturación**: Integración con facturación electrónica

## Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Tokens de Google Calendar encriptados
- Autenticación segura con Supabase
- Variables de entorno protegidas

## Contribuir

Este es un proyecto privado de ARYCP Soluciones Corporativas.

## Licencia

Propietario - ARYCP Soluciones Corporativas

## Soporte

Para soporte técnico, contacta al equipo de desarrollo de ARYCP.
