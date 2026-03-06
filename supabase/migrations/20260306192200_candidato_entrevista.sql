-- Add novo campo para armazenar os dados da entrevista em formato JSONB na tabela de candidatos
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS entrevista_dados JSONB;
-- Add campo status para candidatos (Aprovado, Reprovado, Reaproveitamento)
-- Vamos utilizar uma coluna text que por default começará nula ou 'Aberto'
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS status_selecao TEXT;
-- Add campo motivo de reprovação
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS motivo_reprovacao TEXT;
-- Add campo indicado_por 
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS indicado_por TEXT;
-- Add campo indicado_por na tabela collaborators também
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS indicado_por TEXT;
