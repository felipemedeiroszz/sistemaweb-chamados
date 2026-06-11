-- Migration 13: Create checklist tables
-- 13-create-checklist-tables.sql

-- Tabela de checklists (um checklist por loja)
CREATE TABLE IF NOT EXISTS checklists (
  id CHAR(36) PRIMARY KEY DEFAULT UUID(),
  name VARCHAR(255) NOT NULL,
  store_id CHAR(36) NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurring_day_of_week INT DEFAULT NULL, -- 0=Domingo, 1=Segunda, ..., 6=Sábado
  recurring_time TIME DEFAULT NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT true,
  FOREIGN KEY (store_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON checklist_items(checklist_id);

-- Tabela deexecuções de checklist (registro de quando um colaborador preencheu)
CREATE TABLE IF NOT EXISTS checklist_executions (
  id CHAR(36) PRIMARY KEY DEFAULT UUID(),
  checklist_id CHAR(36) NOT NULL,
  store_id CHAR(36) NOT NULL,
  executed_by CHAR(36) NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date DATE NOT NULL, -- Data para qual a execução foi registrada
  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES users(id),
  FOREIGN KEY (executed_by) REFERENCES users(id)
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES checklist_executions(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES checklist_items(id) ON DELETE CASCADE,
  UNIQUE KEY unique_execution_item (execution_id, item_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_checklist_item_responses_execution ON checklist_item_responses(execution_id);
CREATE INDEX IF NOT EXISTS idx_checklist_item_responses_item ON checklist_item_responses(item_id);
