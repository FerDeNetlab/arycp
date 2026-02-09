# 📋 Instrucciones para Crear la Tabla system_users

El error "Database error creating new user" ocurre porque la tabla `system_users` no existe o no tiene la estructura correcta en Supabase.

---

## 🔧 Solución: Ejecutar Script SQL

### Paso 1: Ir a Supabase Dashboard

1. Abre tu navegador
2. Ve a: https://supabase.com/dashboard
3. Selecciona tu proyecto: **tomrdlpdghbmkqrtahau**

### Paso 2: Abrir SQL Editor

1. En el menú lateral izquierdo, haz clic en **"SQL Editor"** (ícono de base de datos con código)
2. Haz clic en **"New Query"** (botón verde)

### Paso 3: Copiar y Ejecutar el Script

1. Abre el archivo: `database/create_system_users_table.sql`
2. **Copia TODO el contenido** del archivo
3. **Pega** en el SQL Editor de Supabase
4. Haz clic en **"Run"** (botón verde) o presiona `Ctrl + Enter`

### Paso 4: Verificar que se Creó

1. Ve a **"Table Editor"** en el menú lateral
2. Deberías ver la tabla **"system_users"**
3. Las columnas deben ser:
   - `id` (UUID)
   - `auth_user_id` (UUID)
   - `full_name` (TEXT)
   - `email` (TEXT)
   - `phone` (TEXT, nullable)
   - `role` (TEXT)
   - `is_active` (BOOLEAN)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

---

## ✅ Después de Ejecutar el Script

1. **Cierra y abre el navegador** donde está el dashboard del proyecto
2. **Intenta crear un usuario nuevamente**:
   - Ve a `/dashboard/users`
   - Haz clic en "Añadir Usuario"
   - Llena el formulario
   - Haz clic en "Crear Usuario"

### Resultado Esperado:
- ✅ Usuario creado exitosamente
- ✅ Aparece en la lista de usuarios
- ✅ Se puede hacer login con esas credenciales

---

## 🔍 Si el Script Ya Fue Ejecutado

Si obtienes un error diciendo que la tabla ya existe:

1. Ve a **Table Editor** → **system_users**
2. Verifica que tenga TODAS las columnas listadas arriba
3. Si falta alguna, puedes agregarla manualmente:
   - Haz clic en **"Add column"**
   - Nombre: (el que falte)
   - Tipo: (según la lista de arriba)

---

## ⚠️ Importante

Las políticas RLS (Row Level Security) creadas por el script aseguran que:
- ✅ Solo **admins** pueden crear usuarios
- ✅ **Contadores** pueden ver usuarios
- ✅ **Clientes** solo ven su propio perfil
- ✅ Solo **admins** pueden eliminar usuarios

---

**Ejecuta el script SQL y avísame si funcionó o si hay algún error** ✅
