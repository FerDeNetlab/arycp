-- Add assigned_to fields to labor_incidents table
ALTER TABLE public.labor_incidents ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE public.labor_incidents ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
