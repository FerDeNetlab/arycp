# 🔑 Instrucciones para Agregar Service Role Key

Para que el sistema de creación de usuarios funcione correctamente, necesitas agregar la **Service Role Key** de Supabase a tu archivo `.env.local`.

## ⚠️ ADVERTENCIA IMPORTANTE

La **Service Role Key** es una clave **EXTREMADAMENTE SENSIBLE** que:
- ✅ Permite bypass de RLS (Row Level Security)
- ✅ Tiene permisos administrativos completos
- ❌ **NUNCA** debe exponerse en el frontend
- ❌ **NUNCA** debe subirse a GitHub
- ✅ Solo se usa en el servidor (API routes)

---

## 📝 Cómo Obtener la Service Role Key

### Paso 1: Ir al Dashboard de Supabase
1. Abre tu navegador
2. Ve a: https://supabase.com/dashboard
3. Inicia sesión si es necesario

### Paso 2: Seleccionar el Proyecto
1. Haz clic en tu proyecto: `tomrdlpdghbmkqrtahau`

### Paso 3: Ir a Settings → API
1. En el menú lateral izquierdo, haz clic en **Settings** (⚙️)
2. En el submenú, haz clic en **API**

### Paso 4: Copiar la Service Role Key
1. Busca la sección **"Project API keys"**
2. Encontrarás dos claves:
   - **anon / public** (Ya la tienes, está en .env.local)
   - **service_role** ⬅️ **ESTA ES LA QUE NECESITAS**
3. La clave service_role dice **"secret"** al lado
4. Haz clic en el ícono de **copiar** (📋) para copiarla
5. Es un texto MUY LARGO que empieza con `eyJ...`

---

## 📄 Cómo Agregarla a tu Proyecto

### Abrir `.env.local`

El archivo ya existe en: `c:\Users\AlanP\Desktop\AR&CP\.env.local`

### Agregar la Línea

Abre el archivo y agrega esta línea al final:

```bash
SUPABASE_SERVICE_ROLE_KEY=PEGA_AQUI_TU_SERVICE_ROLE_KEY
```

Reemplaza `PEGA_AQUI_TU_SERVICE_ROLE_KEY` con la clave que copiaste.

### Ejemplo de cómo debe verse `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tomrdlpdghbmkqrtahau.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvbXJkbHBkZ2hibWtxcnRhaGF1Iiwicm9sZSI6ImFub24iLCJpYxQiOjE3NjgwOTYzNTcsImV4cCI6MjA4MzY3MjM1N30.jx250b4Q0q9M0dbDA_2mT7nTAkIQwpWLxgKbE_g11O8

# Service Role Key (PRIVATE)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi... (tu clave completa)

# Development
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
```

---

## ✅ Verificar que Funciona

1. **Guarda** el archivo `.env.local`
2. **Reinicia** el servidor de desarrollo:
   - En el CMD/Terminal, presiona `Ctrl + C`
   - Ejecuta de nuevo: `node node_modules\next\dist\bin\next dev`
3. **Prueba crear un usuario**:
   - Ve a `/dashboard/users`
   - Haz clic en "Añadir Usuario"
   - Llena el formulario (incluyendo contraseña)
   - Haz clic en "Crear Usuario"

Si todo funciona correctamente:
- ✅ El usuario se creará en Supabase Auth
- ✅ Se creará el registro en `system_users`
- ✅ El usuario podrá hacer login con sus credenciales

---

## 🔒 Seguridad

- ✅ El archivo `.env.local` ya está en `.gitignore` (no se subirá a GitHub)
- ✅ La Service Role Key solo se usa en el servidor (API routes)
- ✅ Nunca se expone al frontend
- ✅ Las variables de entorno del servidor solo funcionan en backend de Next.js

---

## ❓ Si Tienes Problemas

Si el sistema no funciona después de agregar la clave:

1. **Verifica que copiaste la clave completa** (es muy larga)
2. **Verifica que no haya espacios antes o después** de la clave
3. **Reinicia el servidor** (es necesario para cargar nuevas variables)
4. **Revisa la consola** por errores

Si sigue sin funcionar, avísame y te ayudo a diagnosticar el problema.

---

**Una vez agregada la Service Role Key, el sistema de creación de usuarios funcionará completamente** ✅
