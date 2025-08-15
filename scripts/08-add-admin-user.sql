-- Adicionar tipo 'admin' à tabela users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
  CHECK (user_type IN ('loja', 'tecnico', 'admin'));

-- Criar usuário administrador
INSERT INTO users (email, password_hash, name, user_type, active) 
VALUES ('admin@empresa.com', 'admin123', 'Administrador', 'admin', true)
ON CONFLICT (email) DO NOTHING;
