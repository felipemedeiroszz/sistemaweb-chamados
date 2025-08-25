-- Criar tabela de chamados
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number SERIAL UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  service_type VARCHAR(50) NOT NULL CHECK (
    service_type IN (
      'Departamento Pessoal',
      'RH',
      'Comercial',
      'Manutenção Infraestrutura',
      'Manutenção de computadores',
      'Suporte TI'
    )
  ),
  priority VARCHAR(20) DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  status VARCHAR(20) DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'aguardando', 'resolvido', 'fechado')),
  store_id UUID NOT NULL REFERENCES users(id),
  assigned_technician_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_service_type ON tickets(service_type);
CREATE INDEX IF NOT EXISTS idx_tickets_store ON tickets(store_id);
CREATE INDEX IF NOT EXISTS idx_tickets_technician ON tickets(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at);
