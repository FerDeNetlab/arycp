-- Service Requests: allows clients to request services from contadoras
-- Includes service_requests table and request_comments table

-- Service Requests table
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    client_name TEXT,
    requested_by UUID NOT NULL,
    requested_by_name TEXT,
    module TEXT NOT NULL CHECK (module IN ('invoicing', 'procedures', 'fiscal', 'accounting', 'legal', 'labor', 'general')),
    request_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgente')),
    status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'completada', 'rechazada')),
    assigned_to UUID,
    assigned_to_name TEXT,
    admin_notes TEXT,
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Request Comments table
CREATE TABLE IF NOT EXISTS request_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT,
    user_role TEXT,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at trigger for service_requests
CREATE OR REPLACE FUNCTION update_service_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_requests_updated_at
    BEFORE UPDATE ON service_requests
    FOR EACH ROW EXECUTE FUNCTION update_service_requests_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_module ON service_requests(module);
CREATE INDEX IF NOT EXISTS idx_service_requests_requested_by ON service_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_to ON service_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_requests_created ON service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_comments_request ON request_comments(request_id);

-- Enable RLS
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API routes use admin client)
CREATE POLICY "Service role full access on service_requests" ON service_requests FOR ALL USING (true);
CREATE POLICY "Service role full access on request_comments" ON request_comments FOR ALL USING (true);
