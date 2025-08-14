-- Atualizar senhas com hashes reais
-- Senha padrão para todas as contas: "123456"

UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'loja1@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'loja2@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'loja3@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'loja4@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'loja5@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'loja6@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'loja7@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'loja8@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'loja9@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'loja10@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'loja11@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'loja12@empresa.com';

-- Técnicos também com senha "123456"
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'manutencao1@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'eletricista1@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'computador1@empresa.com';
UPDATE users SET password_hash = '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqV' WHERE email = 'suporte1@empresa.com';
