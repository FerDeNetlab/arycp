-- Script SQL para crear la tabla system_users en Supabase
-- Ejecutar este script en el SQL Editor de Supabase Dashboard

-- 1. Crear la tabla system_users (si no existe)
CREATE TABLE IF NOT EXISTS public.system_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'contador', 'cliente')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_system_users_auth_user_id ON public.system_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_system_users_email ON public.system_users(email);
CREATE INDEX IF NOT EXISTS idx_system_users_role ON public.system_users(role);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS: Admins pueden ver todo
CREATE POLICY "Admins can view all users" ON public.system_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.auth_user_id = auth.uid()
      AND su.role = 'admin'
    )
  );

-- 5. Políticas RLS: Contadores pueden ver usuarios
CREATE POLICY "Contadores can view users" ON public.system_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.auth_user_id = auth.uid()
      AND su.role IN ('admin', 'contador')
    )
  );

-- 6. Políticas RLS: Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.system_users
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- 7. Políticas RLS: Solo admins pueden insertar usuarios
CREATE POLICY "Admins can insert users" ON public.system_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.auth_user_id = auth.uid()
      AND su.role = 'admin'
    )
  );

-- 8. Políticas RLS: Admins pueden actualizar usuarios
CREATE POLICY "Admins can update users" ON public.system_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.auth_user_id = auth.uid()
      AND su.role = 'admin'
    )
  );

-- 9. Políticas RLS: Solo admins pueden eliminar usuarios
CREATE POLICY "Admins can delete users" ON public.system_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.auth_user_id = auth.uid()
      AND su.role = 'admin'
    )
  );

-- 10. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger para actualizar updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.system_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 12. Comentarios para documentación
COMMENT ON TABLE public.system_users IS 'Usuarios del sistema con roles y permisos';
COMMENT ON COLUMN public.system_users.auth_user_id IS 'ID del usuario en auth.users de Supabase';
COMMENT ON COLUMN public.system_users.role IS 'Rol del usuario: admin, contador, o cliente';
COMMENT ON COLUMN public.system_users.is_active IS 'Si el usuario está activo o deshabilitado';
