-- Atualizar CHECK constraint de users.speciality para permitir especialidades de departamentos
-- em usuários 'loja' e manter especialidades técnicas para 'tecnico'.

BEGIN;

-- Descobrir e dropar a constraint CHECK atual de speciality (nome pode variar)
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

-- Recriar constraint condicional por user_type
ALTER TABLE users
ADD CONSTRAINT users_speciality_check
CHECK (
  (
    user_type = 'tecnico' AND speciality IN (
      'Manutenção Infraestrutura',
      'Manutenção de computadores',
      'Suporte TI',
      'Departamento Pessoal',
      'RH',
      'Comercial'
    )
  )
  OR (
    user_type = 'loja' AND speciality IS NULL
  )
);

COMMIT;
