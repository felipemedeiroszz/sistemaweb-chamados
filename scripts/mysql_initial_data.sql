USE sistema_chamados;

-- Inserir usuário admin (senha: 123456)
INSERT IGNORE INTO users (id, email, password_hash, name, user_type, active) VALUES
(UUID(), 'admin@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Administrador', 'admin', true);

-- Inserir dados iniciais das lojas
INSERT IGNORE INTO users (email, password_hash, name, user_type, store_number) VALUES
('loja1@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Loja 1', 'loja', 1),
('loja2@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Loja 2', 'loja', 2),
('loja3@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Loja 3', 'loja', 3),
('loja4@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Loja 4', 'loja', 4),
('loja5@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Loja 5', 'loja', 5),
('loja6@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Loja 6', 'loja', 6),
('loja7@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Loja 7', 'loja', 7),
('loja8@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Loja 8', 'loja', 8),
('loja9@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Loja 9', 'loja', 9),
('loja10@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Loja 10', 'loja', 10),
('loja11@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Loja 11', 'loja', 11),
('loja12@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Loja 12', 'loja', 12);

-- Inserir técnicos de exemplo
INSERT IGNORE INTO users (email, password_hash, name, user_type, speciality) VALUES
('manutencao1@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'João Silva - Manutenção Infra', 'tecnico', 'Manutenção Infraestrutura'),
('eletricista1@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Maria Santos - Manutenção Infra', 'tecnico', 'Manutenção Infraestrutura'),
('computador1@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Pedro Costa - TI', 'tecnico', 'Manutenção de computadores'),
('suporte1@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Ana Lima - Suporte TI', 'tecnico', 'Suporte TI'),
('departamentopessoal@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Departamento Pessoal', 'tecnico', 'Departamento Pessoal'),
('rh@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Recursos Humanos', 'tecnico', 'RH'),
('comercial@empresa.com', '$2b$10$VqThDPDlpdTASSLVW8z4UOwx5CHzaXZ4EIdwzQRGMVTc/Euf.ZR.O', 'Comercial', 'tecnico', 'Comercial');

-- Observação: Todos os usuários tem a senha "123456" (bcrypt hash)
