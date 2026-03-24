-- Performance & scalability migration (executed 2026-03-24)
-- Fixed status constraint and added missing indexes

-- 1. Fix service_requests status constraint to include 'cancelada'
ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_status_check;
ALTER TABLE service_requests ADD CONSTRAINT service_requests_status_check
    CHECK (status IN ('pendiente', 'en_proceso', 'completada', 'rechazada', 'cancelada'));

-- 2. Indexes seguros
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_cancellations_client ON invoice_cancellations(client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_declarations_client ON monthly_declarations(client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_declarations_period ON monthly_declarations(year, month);
CREATE INDEX IF NOT EXISTS idx_diot_records_client ON diot_records(client_id);
CREATE INDEX IF NOT EXISTS idx_diot_records_period ON diot_records(year, month);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_module ON activity_log(module);
