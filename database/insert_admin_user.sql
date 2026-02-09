-- Script para agregar tu usuario actual como admin en system_users
-- Ejecutar este script SOLO UNA VEZ en SQL Editor de Supabase

-- IMPORTANTE: Primero necesitas obtener tu auth_user_id
-- Para obtenerlo, ejecuta primero esta query:
-- SELECT id, email FROM auth.users WHERE email = 'fer@netlab.mx';
-- Copia el ID que te devuelve y reemplaza 'TU_AUTH_USER_ID_AQUI' abajo

-- Insertar usuario admin en system_users
INSERT INTO public.system_users (
  auth_user_id,
  full_name,
  email,
  phone,
  role,
  is_active
) VALUES (
  -- Reemplaza 'TU_AUTH_USER_ID_AQUI' con el ID obtenido en la query de arriba
  'TU_AUTH_USER_ID_AQUI'::uuid,
  'Luis Fernando',
  'fer@netlab.mx',
  NULL,  -- Si tienes teléfono, ponlo aquí entre comillas
  'admin',
  true
)
ON CONFLICT (auth_user_id) DO NOTHING;  -- No insertar si ya existe

-- Verificar que se insertó correctamente
SELECT * FROM public.system_users WHERE email = 'fer@netlab.mx';
