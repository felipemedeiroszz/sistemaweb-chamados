-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS sistema_chamados CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_chamados;

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT UUID(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL,
  store_number INT CHECK (store_number BETWEEN 1 AND 12),
  speciality VARCHAR(50),
  phone VARCHAR(20),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (user_type IN ('loja', 'tecnico', 'admin')),
  CHECK (
    (user_type = 'tecnico' AND speciality IN (
      'Departamento Pessoal',
      'RH',
      'Comercial',
      'Manutenção Infraestrutura',
      'Manutenção de computadores',
      'Suporte TI'
    ))
    OR (user_type IN ('loja', 'admin') AND speciality IS NULL)
  )
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_store ON users(store_number);
CREATE INDEX IF NOT EXISTS idx_users_speciality ON users(speciality);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Criar tabela de chamados
CREATE TABLE IF NOT EXISTS tickets (
  id CHAR(36) PRIMARY KEY DEFAULT UUID(),
  ticket_number INT AUTO_INCREMENT UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'media',
  status VARCHAR(20) DEFAULT 'aberto',
  store_id CHAR(36) NOT NULL,
  assigned_technician_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  expected_resolution_at TIMESTAMP NULL,
  image_urls JSON DEFAULT NULL,
  CHECK (service_type IN (
    'Departamento Pessoal',
    'RH',
    'Comercial',
    'Manutenção Infraestrutura',
    'Manutenção de computadores',
    'Suporte TI'
  )),
  CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  CHECK (status IN ('aberto', 'em_andamento', 'aguardando', 'resolvido', 'fechado')),
  FOREIGN KEY (store_id) REFERENCES users(id),
  FOREIGN KEY (assigned_technician_id) REFERENCES users(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_service_type ON tickets(service_type);
CREATE INDEX IF NOT EXISTS idx_tickets_store ON tickets(store_id);
CREATE INDEX IF NOT EXISTS idx_tickets_technician ON tickets(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_expected_resolution_at ON tickets(expected_resolution_at);

-- Criar tabela de acompanhamento de chamados
CREATE TABLE IF NOT EXISTS ticket_updates (
  id CHAR(36) PRIMARY KEY DEFAULT UUID(),
  ticket_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  update_type VARCHAR(30) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (update_type IN ('status_change', 'assignment', 'comment', 'priority_change')),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ticket_updates_ticket ON ticket_updates(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_updates_user ON ticket_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_updates_created ON ticket_updates(created_at);

-- Tabela de checklists (um checklist por loja)
CREATE TABLE IF NOT EXISTS checklists (
  id CHAR(36) PRIMARY KEY DEFAULT UUID(),
  name VARCHAR(255) NOT NULL,
  store_id CHAR(36) NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurring_day_of_week INT DEFAULT NULL,
  recurring_time TIME DEFAULT NULL,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT true
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_checklists_store ON checklists(store_id);
CREATE INDEX IF NOT EXISTS idx_checklists_recurring ON checklists(is_recurring, recurring_day_of_week);

-- Tabela de itens de checklist
CREATE TABLE IF NOT EXISTS checklist_items (
  id CHAR(36) PRIMARY KEY DEFAULT UUID(),
  checklist_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requires_photo BOOLEAN DEFAULT false,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON checklist_items(checklist_id);

-- Tabela deexecuções de checklist (registro de quando um colaborador preenche)
CREATE TABLE IF NOT EXISTS checklist_executions (
  id CHAR(36) PRIMARY KEY DEFAULT UUID(),
  checklist_id CHAR(36) NOT NULL,
  store_id CHAR(36) NOT NULL,
  executed_by CHAR(36),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date DATE NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_checklist_executions_checklist ON checklist_executions(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_executions_store ON checklist_executions(store_id);
CREATE INDEX IF NOT EXISTS idx_checklist_executions_due_date ON checklist_executions(due_date);

-- Tabela de respostas dos itens do checklist
CREATE TABLE IF NOT EXISTS checklist_item_responses (
  id CHAR(36) PRIMARY KEY DEFAULT UUID(),
  execution_id CHAR(36) NOT NULL,
  item_id CHAR(36) NOT NULL,
  completed BOOLEAN DEFAULT false,
  photo_url TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_checklist_item_responses_execution ON checklist_item_responses(execution_id);
CREATE INDEX IF NOT EXISTS idx_checklist_item_responses_item ON checklist_item_responses(item_id);
