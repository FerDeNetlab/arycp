# Configuración de Google Calendar para ARYCP ERP

Este documento explica cómo configurar la integración de Google Calendar en el ERP de ARYCP.

## Paso 1: Crear Credenciales de Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
4. Busca "Google Calendar API" y habilítala

## Paso 2: Configurar OAuth 2.0

1. En "APIs y servicios", ve a "Credenciales"
2. Haz clic en "Crear credenciales" > "ID de cliente de OAuth"
3. Si es la primera vez, configura la pantalla de consentimiento:
   - Tipo de usuario: Externo (o Interno si es para tu organización)
   - Nombre de la aplicación: "ARYCP ERP"
   - Correo de asistencia: tu correo
   - Ámbitos: Agrega `https://www.googleapis.com/auth/calendar`
4. Selecciona "Aplicación web" como tipo de aplicación
5. En "Orígenes de JavaScript autorizados", agrega:
   - `http://localhost:3000` (para desarrollo)
   - Tu dominio de producción (ej: `https://arycp.vercel.app`)
6. En "URIs de redirección autorizados", agrega:
   - `http://localhost:3000/api/auth/google/callback` (para desarrollo)
   - `https://tu-dominio.com/api/auth/google/callback` (para producción)

## Paso 3: Configurar Variables de Entorno

Después de crear las credenciales, obtendrás un **Client ID** y un **Client Secret**.

### En Desarrollo Local

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
```

### En Vercel (Producción)

1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega las siguientes variables:
   - `GOOGLE_CLIENT_ID`: tu Client ID
   - `GOOGLE_CLIENT_SECRET`: tu Client Secret

## Paso 4: Ejecutar las Migraciones de Base de Datos

Las tablas necesarias ya están definidas en el script `scripts/01_create_calendar_tables.sql`.

Para ejecutar el script:

1. Ve a la interfaz de v0
2. El script se ejecutará automáticamente
3. O puedes ejecutarlo manualmente desde el dashboard de Supabase en SQL Editor

## Paso 5: Probar la Integración

1. Inicia sesión en el ERP
2. Ve a la sección "Calendario"
3. Haz clic en "Conectar Google Calendar"
4. Autoriza el acceso a tu cuenta de Google
5. Ahora podrás crear eventos, vincularlos con clientes/procesos y recibir notificaciones

## Funcionalidades Disponibles

- ✅ Conectar cuenta individual de Google Calendar
- ✅ Crear eventos con recordatorios
- ✅ Vincular eventos con clientes del ERP
- ✅ Vincular eventos con procesos/trámites
- ✅ Notificaciones por email y popup
- ✅ Vista de eventos próximos
- ✅ Sincronización bidireccional con Google Calendar

## Solución de Problemas

### Error: "Google Calendar not connected"
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de haber autorizado el acceso a tu cuenta de Google

### Error: "Failed to create event"
- Verifica que la API de Google Calendar esté habilitada en tu proyecto de Google Cloud
- Revisa que las URIs de redirección estén configuradas correctamente

### Error: "Invalid credentials"
- Verifica que el Client ID y Client Secret sean correctos
- Regenera las credenciales si es necesario desde Google Cloud Console

## Seguridad

Los tokens de acceso se almacenan de forma segura en Supabase con Row Level Security (RLS) habilitado. Cada usuario solo puede acceder a sus propios tokens y eventos.

## Próximas Mejoras

- Vista de calendario mensual/semanal
- Eventos recurrentes
- Compartir calendarios entre miembros del equipo
- Integración con otras plataformas de calendario (Outlook, Apple Calendar)
