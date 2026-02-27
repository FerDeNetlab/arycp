-- =====================================================
-- Registros y Cumplimiento Module
-- Control de firmas, sellos, registros patronales
-- =====================================================

CREATE TABLE IF NOT EXISTS company_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    type TEXT NOT NULL DEFAULT 'otro',
    label TEXT NOT NULL,
    registration_number TEXT,
    issued_date DATE,
    expiration_date DATE,
    status TEXT NOT NULL DEFAULT 'vigente',
    notes TEXT,
    file_url TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_registrations_client ON company_registrations(client_id);
CREATE INDEX IF NOT EXISTS idx_company_registrations_type ON company_registrations(type);
CREATE INDEX IF NOT EXISTS idx_company_registrations_expiration ON company_registrations(expiration_date);
CREATE INDEX IF NOT EXISTS idx_company_registrations_status ON company_registrations(status);

-- RLS
ALTER TABLE company_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on company_registrations" ON company_registrations FOR ALL USING (true);
