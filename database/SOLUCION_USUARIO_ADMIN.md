# 🔧 Solución: Agregar Usuario Admin a system_users

## Problema

Tu usuario "Luis Fernando" (fer@netlab.mx) existe en Supabase Auth, pero **NO existe en la tabla `system_users`**. Por eso el sistema dice que no tienes permisos.

---

## ✅ Solución Rápida (2 pasos)

### Paso 1: Obtener tu Auth User ID

1. Ve a **SQL Editor** en Supabase
2. Ejecuta esta query:

```sql
SELECT id, email FROM auth.users WHERE email = 'fer@netlab.mx';
```

3. **Copia el ID** que aparece (es un UUID largo como: `12345678-1234-1234-1234-123456789012`)

---

### Paso 2: Insertar tu usuario en system_users

1. En el mismo SQL Editor, ejecuta esta query (reemplaza `TU_AUTH_USER_ID_AQUI` con el ID que copiaste):

```sql
INSERT INTO public.system_users (
  auth_user_id,
  full_name,
  email,
  phone,
  role,
  is_active
) VALUES (
  'TU_AUTH_USER_ID_AQUI'::uuid,
  'Luis Fernando',
  'fer@netlab.mx',
  NULL,
  'admin',
  true
);
```

2. Haz clic en **Run**

---

## ✅ Verificar que Funcionó

1. **Refresca la página** del dashboard 
2. **Intenta crear un usuario nuevamente**
3. Ahora debería funcionar sin problemas ✅

---

## 🎯 Resultado

Después de esto:
- ✅ Tu usuario estará en `system_users` con rol `admin`
- ✅ Podrás crear otros usuarios
- ✅ El sistema te reconocerá como administrador

---

**Ejecuta los 2 pasos en SQL Editor de Supabase y avísame cuando termines** 👍
