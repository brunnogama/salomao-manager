-- 1. Remover dependências (Foreign Keys) para podermos alterar os tipos

-- Tabela Candidatos
ALTER TABLE public.candidatos DROP CONSTRAINT IF EXISTS candidatos_atuacao_id_fkey;

-- Tabela Vagas
ALTER TABLE public.vagas DROP CONSTRAINT IF EXISTS vagas_atuacao_id_fkey;

-- Tabela Colaboradores
ALTER TABLE public.colaboradores DROP CONSTRAINT IF EXISTS colaboradores_atuacao_fkey;
ALTER TABLE public.colaboradores DROP CONSTRAINT IF EXISTS colaboradores_atuacao_id_fkey;

-- 2. Alterar o tipo da coluna para TEXT

-- Tabela Candidatos
ALTER TABLE public.candidatos ALTER COLUMN atuacao_id TYPE text USING atuacao_id::text;

-- Tabela Vagas
ALTER TABLE public.vagas ALTER COLUMN atuacao_id TYPE text USING atuacao_id::text;

-- Tabela Colaboradores (aqui o nome é apenas atuacao, mas por garantia checo atuacao_id se existir)
ALTER TABLE public.colaboradores ALTER COLUMN atuacao TYPE text USING atuacao::text;
-- (Caso tenha atuacao_id também na colaboradores:)
-- ALTER TABLE public.colaboradores ALTER COLUMN atuacao_id TYPE text USING atuacao_id::text;

