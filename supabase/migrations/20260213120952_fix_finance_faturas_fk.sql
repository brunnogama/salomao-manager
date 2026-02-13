-- Migração para corrigir a Foreign Key da tabela finance_faturas
-- Alterando a referência de finance_clientes para clients

-- 1. Remover a constraint antiga (que aponta para a tabela errada ou inexistente finance_clientes)
ALTER TABLE finance_faturas
DROP CONSTRAINT IF EXISTS finance_faturas_cliente_id_fkey;

-- 2. Adicionar a nova constraint apontando para a tabela correta 'clients'
-- Importante: Isso pode falhar se já existirem faturas com IDs de clientes que não existem na tabela 'clients'.
-- Se for o caso, pode ser necessário limpar esses registros inválidos antes.
ALTER TABLE finance_faturas
ADD CONSTRAINT finance_faturas_cliente_id_fkey
FOREIGN KEY (cliente_id)
REFERENCES clients(id)
ON DELETE SET NULL;
