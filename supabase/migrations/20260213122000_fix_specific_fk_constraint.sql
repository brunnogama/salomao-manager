-- Migração para remover a constraint persistente e corrigir a Foreign Key
-- O erro anterior indicava que a constraint 'fk_finance_faturas_cliente' ainda existia e violava integridade

-- 1. Remover a constraint específica citada no erro
ALTER TABLE finance_faturas
DROP CONSTRAINT IF EXISTS fk_finance_faturas_cliente;

-- 2. Garantir que a constraint antiga também não exista (por precaução)
ALTER TABLE finance_faturas
DROP CONSTRAINT IF EXISTS finance_faturas_cliente_id_fkey;

-- 3. Adicionar a nova constraint apontando para a tabela correta 'clients'
ALTER TABLE finance_faturas
ADD CONSTRAINT finance_faturas_cliente_id_fkey
FOREIGN KEY (cliente_id)
REFERENCES clients(id)
ON DELETE SET NULL;
