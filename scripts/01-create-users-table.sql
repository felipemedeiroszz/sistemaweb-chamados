-- Criar tabela de usuários para lojas e técnicos
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('loja', 'tecnico')),
  store_number INTEGER CHECK (store_number BETWEEN 1 AND 12),
  speciality VARCHAR(50) CHECK (
    speciality IN (
      'Manutenção Infraestrutura',
      'Manutenção de computadores',
      'Suporte TI'
    )
  ),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_store ON users(store_number);
CREATE INDEX IF NOT EXISTS idx_users_speciality ON users(speciality);
