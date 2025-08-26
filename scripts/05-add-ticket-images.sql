-- Adiciona coluna para URLs de imagens dos chamados (Uploadcare)
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Índice opcional para consultas que filtram por existência de anexos
-- CREATE INDEX IF NOT EXISTS idx_tickets_has_images ON tickets ((array_length(image_urls, 1)));
