-- Add EZAudita import fields to monthly_declarations
ALTER TABLE monthly_declarations 
ADD COLUMN IF NOT EXISTS iva_emitidos DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS iva_recibidos DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS num_facturas_emitidas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS num_facturas_recibidas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gross_profit DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS iva_balance DECIMAL(12,2) DEFAULT 0;
