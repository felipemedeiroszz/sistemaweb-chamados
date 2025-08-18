-- Alterar a tabela users para incluir o tipo 'administrador'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
  CHECK (user_type IN ('loja', 'tecnico', 'administrador'));

-- Inserir usuário administrador
INSERT INTO users (
  email, 
  password_hash, 
  name, 
  user_type, 
  store_number, 
  speciality, 
  active
) VALUES (
  'admin@empresa.com',
  'admin123', -- Senha em texto plano que será detectada pelo sistema
  'Administrador do Sistema',
  'administrador',
  NULL, -- Admin não tem loja específica
  NULL, -- Admin não tem especialidade específica
  true
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  user_type = EXCLUDED.user_type,
  active = EXCLUDED.active;
