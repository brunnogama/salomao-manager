-- Adiciona coluna entrevistados na tabela vagas (array de UUIDs de candidatos)
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS entrevistados JSONB DEFAULT '[]'::jsonb;
