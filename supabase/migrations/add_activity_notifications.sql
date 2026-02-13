-- Activity Log table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name TEXT,
    client_id UUID,
    client_name TEXT,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    from_user_id UUID,
    from_user_name TEXT,
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    module TEXT,
    entity_type TEXT,
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add assigned_to to procedures
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;

-- Add assigned_to to fiscal_obligations
ALTER TABLE fiscal_obligations ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE fiscal_obligations ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;

-- Add assigned_to to legal_processes
ALTER TABLE legal_processes ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE legal_processes ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_client ON activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Disable RLS so admin client works (tables are accessed via API routes only)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on activity_log" ON activity_log FOR ALL USING (true);
CREATE POLICY "Service role full access on notifications" ON notifications FOR ALL USING (true);
