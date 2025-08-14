-- Criar tabela de acompanhamento de chamados
CREATE TABLE IF NOT EXISTS ticket_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  update_type VARCHAR(30) NOT NULL CHECK (update_type IN ('status_change', 'assignment', 'comment', 'priority_change')),
  old_value TEXT,
  new_value TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ticket_updates_ticket ON ticket_updates(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_updates_user ON ticket_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_updates_created ON ticket_updates(created_at);
