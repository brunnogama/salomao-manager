-- 1. Remove travas de restrições (Foreign Keys) nas outras tabelas
ALTER TABLE public.candidatos DROP CONSTRAINT IF EXISTS candidatos_atuacao_id_fkey;
ALTER TABLE public.vagas DROP CONSTRAINT IF EXISTS vagas_atuacao_id_fkey;

-- Na tabela collaborators, verificando pelo DDL não há FK no campo 'atuacao', mas é bom garantir
ALTER TABLE public.collaborators DROP CONSTRAINT IF EXISTS collaborators_atuacao_fkey;
ALTER TABLE public.collaborators DROP CONSTRAINT IF EXISTS collaborators_atuacao_id_fkey;

-- 2. Altera o tipo da coluna para TEXT
ALTER TABLE public.candidatos ALTER COLUMN atuacao_id TYPE text USING atuacao_id::text;
ALTER TABLE public.vagas ALTER COLUMN atuacao_id TYPE text USING atuacao_id::text;
ALTER TABLE public.collaborators ALTER COLUMN atuacao TYPE text USING atuacao::text;
