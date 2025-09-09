-- Adicionar coluna phone na tabela users para SMS
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Criar índice para consultas por telefone
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Comentário sobre o formato esperado
-- Formato esperado: +5511999999999 (código do país + DDD + número)
-- Exemplo: +5511987654321

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'phone';