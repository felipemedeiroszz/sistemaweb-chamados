-- Criar usuários para departamentos (sem store_number)
-- user_type precisa ser 'loja' ou 'tecnico' (conforme CHECK). Usaremos 'loja'.
-- Ajuste os password_hash conforme seu ambiente (pode usar 06-debug-passwords.sql depois para senhas simples).

INSERT INTO users (email, password_hash, name, user_type, speciality)
VALUES
  ('departamentopessoal@empresa.com', '$2b$10$example_hash_dp', 'Departamento Pessoal', 'tecnico', 'Departamento Pessoal'),
  ('rh@empresa.com', '$2b$10$example_hash_rh', 'Recursos Humanos', 'tecnico', 'RH'),
  ('comercial@empresa.com', '$2b$10$example_hash_com', 'Comercial', 'tecnico', 'Comercial')
ON CONFLICT (email) DO NOTHING;

-- Verificação
SELECT id, email, name, user_type, store_number FROM users
WHERE email IN (
  'departamentopessoal@empresa.com',
  'rh@empresa.com',
  'comercial@empresa.com'
);
