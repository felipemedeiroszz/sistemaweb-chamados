-- Script para verificar e corrigir senhas dos usuários
-- Primeiro, vamos ver as senhas atuais
SELECT id, email, name, user_type, password_hash FROM users;

-- Atualizar com senhas simples em texto plano para teste
UPDATE users SET password_hash = '123456' WHERE user_type = 'loja';
UPDATE users SET password_hash = 'tecnico123' WHERE user_type = 'tecnico';

-- Verificar se foi atualizado
SELECT id, email, name, user_type, password_hash FROM users;
