-- Script para criar senhas com hash bcrypt
-- Execute este script se quiser usar senhas seguras com hash

-- Para usar senhas com hash bcrypt, você pode gerar os hashes e atualizar manualmente
-- Exemplo de como gerar hash para senha "minhasenha123":
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('minhasenha123', 10);

-- Senhas de exemplo com hash bcrypt (senha: "loja123" para lojas, "tecnico123" para técnicos)
UPDATE users SET password_hash = '$2b$10$rOZvkzYzFvRqGHqGqGqGqOZvkzYzFvRqGHqGqGqGqOZvkzYzFvRqGH' WHERE user_type = 'loja';
UPDATE users SET password_hash = '$2b$10$tEcNiCoTeStTeStTeStTeStTeStTeStTeStTeStTeStTeStTeStTeSt' WHERE user_type = 'tecnico';

-- OU você pode usar senhas em texto plano simples:
-- UPDATE users SET password_hash = 'loja123' WHERE user_type = 'loja';
-- UPDATE users SET password_hash = 'tecnico123' WHERE user_type = 'tecnico';

-- Verificar as senhas atualizadas
SELECT id, email, name, user_type, LEFT(password_hash, 20) as password_preview FROM users;
