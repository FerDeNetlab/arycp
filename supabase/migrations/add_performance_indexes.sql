-- Performance & scalability migration
-- Fixes status constraint and adds missing indexes for high-traffic tables

-- 1. Fix service_requests status constraint to include 'cancelada'
ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_status_check;
ALTER TABLE service_requests ADD CONSTRAINT service_requests_status_check
    CHECK (status IN ('pendiente', 'en_proceso', 'completada', 'rechazada', 'cancelada'));

-- 2. Add missing indexes on tables that grow with data

-- email_history (grows with every email sent)
CREATE INDEX IF NOT EXISTS idx_email_history_client ON email_history(client_id);
CREATE INDEX IF NOT EXISTS idx_email_history_user ON email_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_created ON email_history(created_at DESC);

-- labor tables (payroll grows monthly, incidents grow over time)
CREATE INDEX IF NOT EXISTS idx_labor_payroll_client ON labor_payroll(client_id);
CREATE INDEX IF NOT EXISTS idx_labor_payroll_period ON labor_payroll(period);
CREATE INDEX IF NOT EXISTS idx_labor_incidents_client ON labor_incidents(client_id);
CREATE INDEX IF NOT EXISTS idx_labor_incidents_created ON labor_incidents(created_at DESC);

-- invoices (can grow to thousands per client)
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- invoice_cancellations
CREATE INDEX IF NOT EXISTS idx_invoice_cancellations_client ON invoice_cancellations(client_id);

-- declarations (monthly, grows with every period)
CREATE INDEX IF NOT EXISTS idx_monthly_declarations_client ON monthly_declarations(client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_declarations_period ON monthly_declarations(year, month);

-- DIOT records
CREATE INDEX IF NOT EXISTS idx_diot_records_client ON diot_records(client_id);
CREATE INDEX IF NOT EXISTS idx_diot_records_period ON diot_records(year, month);

-- notifications: add created_at index for time-based queries
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- activity_log: add module index for filtered views
CREATE INDEX IF NOT EXISTS idx_activity_log_module ON activity_log(module);
