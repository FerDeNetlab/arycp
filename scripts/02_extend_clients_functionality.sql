-- Ampliar tabla de clientes con servicios contratados
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS has_accounting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_fiscal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_legal BOOLEAN DEFAULT false;

-- Tabla para documentos del cliente (constancia situación fiscal, etc.)
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL, -- 'situacion_fiscal', 'acta_constitutiva', etc.
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para declaraciones mensuales (contabilidad)
CREATE TABLE IF NOT EXISTS monthly_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  declaration_pdf_url TEXT,
  declaration_pdf_name VARCHAR(255),
  tax_payment DECIMAL(15, 2),
  invoiced_amount DECIMAL(15, 2),
  expenses_amount DECIMAL(15, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, year, month)
);

-- Tabla para anexos/modificaciones de declaraciones
CREATE TABLE IF NOT EXISTS declaration_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  declaration_id UUID NOT NULL REFERENCES monthly_declarations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para observaciones fiscales
CREATE TABLE IF NOT EXISTS fiscal_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  observation_type VARCHAR(100), -- 'reducir_gastos', 'aumentar_gastos', 'facturar_ppd', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para procesos jurídicos
CREATE TABLE IF NOT EXISTS legal_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para pasos de procesos jurídicos
CREATE TABLE IF NOT EXISTS legal_process_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_process_id UUID NOT NULL REFERENCES legal_processes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_name VARCHAR(255) NOT NULL,
  step_order INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_user_id ON client_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_declarations_client_id ON monthly_declarations(client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_declarations_year_month ON monthly_declarations(year, month);
CREATE INDEX IF NOT EXISTS idx_declaration_attachments_declaration_id ON declaration_attachments(declaration_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_observations_client_id ON fiscal_observations(client_id);
CREATE INDEX IF NOT EXISTS idx_legal_processes_client_id ON legal_processes(client_id);
CREATE INDEX IF NOT EXISTS idx_legal_process_steps_process_id ON legal_process_steps(legal_process_id);

-- Habilitar RLS
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE declaration_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_process_steps ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para client_documents
CREATE POLICY "Users can view their own client documents" ON client_documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own client documents" ON client_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own client documents" ON client_documents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own client documents" ON client_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para monthly_declarations
CREATE POLICY "Users can view their own declarations" ON monthly_declarations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own declarations" ON monthly_declarations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own declarations" ON monthly_declarations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own declarations" ON monthly_declarations
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para declaration_attachments
CREATE POLICY "Users can view their own attachments" ON declaration_attachments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own attachments" ON declaration_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attachments" ON declaration_attachments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own attachments" ON declaration_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para fiscal_observations
CREATE POLICY "Users can view their own observations" ON fiscal_observations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own observations" ON fiscal_observations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own observations" ON fiscal_observations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own observations" ON fiscal_observations
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para legal_processes
CREATE POLICY "Users can view their own legal processes" ON legal_processes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own legal processes" ON legal_processes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own legal processes" ON legal_processes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own legal processes" ON legal_processes
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para legal_process_steps
CREATE POLICY "Users can view their own process steps" ON legal_process_steps
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own process steps" ON legal_process_steps
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own process steps" ON legal_process_steps
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own process steps" ON legal_process_steps
  FOR DELETE USING (auth.uid() = user_id);
