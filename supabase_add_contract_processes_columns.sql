-- Script para adicionar todas as colunas de informações de processos no Supabase

ALTER TABLE contract_processes
ADD COLUMN IF NOT EXISTS court text,
ADD COLUMN IF NOT EXISTS uf text,
ADD COLUMN IF NOT EXISTS client_name text,
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id),
ADD COLUMN IF NOT EXISTS vara text,
ADD COLUMN IF NOT EXISTS comarca text,
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS magistrates jsonb,
ADD COLUMN IF NOT EXISTS cause_value text,
ADD COLUMN IF NOT EXISTS value_of_cause numeric,
ADD COLUMN IF NOT EXISTS author_cnpj text,
ADD COLUMN IF NOT EXISTS opponent_cnpj text,
ADD COLUMN IF NOT EXISTS author text,
ADD COLUMN IF NOT EXISTS position text;
