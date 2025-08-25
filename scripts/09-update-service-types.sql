-- Remapear tipos antigos para os novos e atualizar constraints existentes
BEGIN;

-- 1) Remap em tickets.service_type
UPDATE tickets
SET service_type = 'Manutenção Infraestrutura'
WHERE service_type IN ('Manutenção', 'Eletricista');

UPDATE tickets
SET service_type = 'Suporte TI'
WHERE service_type IN ('Suporte ao usuario / Sistema', 'Suporte ao usuário / Sistema');

-- Nenhum remap necessário para 'Departamento Pessoal', 'RH', 'Comercial', 'Manutenção de computadores'

-- 2) Ajustar constraint CHECK de tickets.service_type
-- Observação: nomes das constraints podem variar. Tentativa de drop por nome conhecido ou via dynamic.
DO $$
DECLARE
  conname text;
BEGIN
  SELECT con.constraint_name INTO conname
  FROM information_schema.constraint_column_usage ccu
  JOIN information_schema.table_constraints con ON con.constraint_name = ccu.constraint_name
  WHERE ccu.table_name = 'tickets' AND ccu.column_name = 'service_type' AND con.constraint_type = 'CHECK'
  LIMIT 1;

  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE tickets DROP CONSTRAINT %I', conname);
  END IF;
END $$;

ALTER TABLE tickets
ADD CONSTRAINT tickets_service_type_check
CHECK (
  service_type IN (
    'Departamento Pessoal',
    'RH',
    'Comercial',
    'Manutenção Infraestrutura',
    'Manutenção de computadores',
    'Suporte TI'
  )
);

-- 3) Remap em users.speciality
UPDATE users
SET speciality = 'Manutenção Infraestrutura'
WHERE speciality IN ('Manutenção', 'Eletricista');

UPDATE users
SET speciality = 'Suporte TI'
WHERE speciality IN ('Suporte ao usuario / Sistema', 'Suporte ao usuário / Sistema');

-- 4) Ajustar constraint CHECK de users.speciality
DO $$
DECLARE
  conname text;
BEGIN
  SELECT con.constraint_name INTO conname
  FROM information_schema.constraint_column_usage ccu
  JOIN information_schema.table_constraints con ON con.constraint_name = ccu.constraint_name
  WHERE ccu.table_name = 'users' AND ccu.column_name = 'speciality' AND con.constraint_type = 'CHECK'
  LIMIT 1;

  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', conname);
  END IF;
END $$;

ALTER TABLE users
ADD CONSTRAINT users_speciality_check
CHECK (
  speciality IN (
    'Manutenção Infraestrutura',
    'Manutenção de computadores',
    'Suporte TI'
  )
);

COMMIT;
