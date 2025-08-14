-- Inserir dados iniciais das lojas
INSERT INTO users (email, password_hash, name, user_type, store_number) VALUES
('loja1@empresa.com', '$2b$10$example_hash_1', 'Loja 1', 'loja', 1),
('loja2@empresa.com', '$2b$10$example_hash_2', 'Loja 2', 'loja', 2),
('loja3@empresa.com', '$2b$10$example_hash_3', 'Loja 3', 'loja', 3),
('loja4@empresa.com', '$2b$10$example_hash_4', 'Loja 4', 'loja', 4),
('loja5@empresa.com', '$2b$10$example_hash_5', 'Loja 5', 'loja', 5),
('loja6@empresa.com', '$2b$10$example_hash_6', 'Loja 6', 'loja', 6),
('loja7@empresa.com', '$2b$10$example_hash_7', 'Loja 7', 'loja', 7),
('loja8@empresa.com', '$2b$10$example_hash_8', 'Loja 8', 'loja', 8),
('loja9@empresa.com', '$2b$10$example_hash_9', 'Loja 9', 'loja', 9),
('loja10@empresa.com', '$2b$10$example_hash_10', 'Loja 10', 'loja', 10),
('loja11@empresa.com', '$2b$10$example_hash_11', 'Loja 11', 'loja', 11),
('loja12@empresa.com', '$2b$10$example_hash_12', 'Loja 12', 'loja', 12)
ON CONFLICT (email) DO NOTHING;

-- Inserir técnicos de exemplo
INSERT INTO users (email, password_hash, name, user_type, speciality) VALUES
('manutencao1@empresa.com', '$2b$10$example_hash_tech1', 'João Silva - Manutenção', 'tecnico', 'Manutenção'),
('eletricista1@empresa.com', '$2b$10$example_hash_tech2', 'Maria Santos - Eletricista', 'tecnico', 'Eletricista'),
('computador1@empresa.com', '$2b$10$example_hash_tech3', 'Pedro Costa - TI', 'tecnico', 'Manutenção de computadores'),
('suporte1@empresa.com', '$2b$10$example_hash_tech4', 'Ana Lima - Suporte', 'tecnico', 'Suporte ao usuario / Sistema')
ON CONFLICT (email) DO NOTHING;
