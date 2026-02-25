-- =====================================================
-- Supervisión, Productividad y Rentabilidad Module
-- =====================================================

-- 1. Tasks: tareas asignables con seguimiento de tiempo
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    client_id UUID,
    assigned_to UUID,
    assigned_to_name TEXT,
    module TEXT,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'pendiente',
    priority TEXT DEFAULT 'normal',
    estimated_hours NUMERIC(6,2),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    due_date DATE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Task Events: historial de cambios de estado
CREATE TABLE IF NOT EXISTS task_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT,
    from_status TEXT,
    to_status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Client Financials: datos financieros por cliente
CREATE TABLE IF NOT EXISTS client_financials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL UNIQUE,
    ingreso_mensual NUMERIC(12,2) DEFAULT 0,
    costo_operativo_estimado NUMERIC(12,2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Work Sessions: registro de sesiones de trabajo
CREATE TABLE IF NOT EXISTS work_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    logout_at TIMESTAMPTZ
);

-- 5. Capacity Settings: configuración de capacidad por empleado
CREATE TABLE IF NOT EXISTS capacity_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    horas_laborales_diarias NUMERIC(4,2) DEFAULT 8,
    dias_laborales_semana INTEGER DEFAULT 5,
    salario_mensual NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Supervision Alerts: alertas inteligentes generadas
CREATE TABLE IF NOT EXISTS supervision_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'warning',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_id UUID,
    entity_type TEXT,
    entity_name TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_events_task ON task_events(task_id);
CREATE INDEX IF NOT EXISTS idx_task_events_user ON task_events(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_user ON work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_login ON work_sessions(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_financials_client ON client_financials(client_id);
CREATE INDEX IF NOT EXISTS idx_supervision_alerts_resolved ON supervision_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_supervision_alerts_created ON supervision_alerts(created_at DESC);

-- RLS Policies (service role full access)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervision_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Service role full access on task_events" ON task_events FOR ALL USING (true);
CREATE POLICY "Service role full access on client_financials" ON client_financials FOR ALL USING (true);
CREATE POLICY "Service role full access on work_sessions" ON work_sessions FOR ALL USING (true);
CREATE POLICY "Service role full access on capacity_settings" ON capacity_settings FOR ALL USING (true);
CREATE POLICY "Service role full access on supervision_alerts" ON supervision_alerts FOR ALL USING (true);
