-- Add new columns to labor_imss for IMSS movements tracking
ALTER TABLE labor_imss ADD COLUMN IF NOT EXISTS performed_by text;
ALTER TABLE labor_imss ADD COLUMN IF NOT EXISTS confirmed boolean DEFAULT false;
ALTER TABLE labor_imss ADD COLUMN IF NOT EXISTS request_date date;
ALTER TABLE labor_imss ADD COLUMN IF NOT EXISTS patron_registration text;
ALTER TABLE labor_imss ADD COLUMN IF NOT EXISTS incapacity_type text;
ALTER TABLE labor_imss ADD COLUMN IF NOT EXISTS folios text;
ALTER TABLE labor_imss ADD COLUMN IF NOT EXISTS confirmation_date date;
ALTER TABLE labor_imss ADD COLUMN IF NOT EXISTS integrated_salary numeric;
ALTER TABLE labor_imss ADD COLUMN IF NOT EXISTS requested_by text;
ALTER TABLE labor_imss ADD COLUMN IF NOT EXISTS request_medium text;

-- Add new columns to labor_payroll for nóminas tracking
ALTER TABLE labor_payroll ADD COLUMN IF NOT EXISTS stamping_day text;
ALTER TABLE labor_payroll ADD COLUMN IF NOT EXISTS has_subsidy boolean DEFAULT false;
ALTER TABLE labor_payroll ADD COLUMN IF NOT EXISTS has_aguinaldo boolean DEFAULT false;
ALTER TABLE labor_payroll ADD COLUMN IF NOT EXISTS aguinaldo_sent boolean DEFAULT false;
