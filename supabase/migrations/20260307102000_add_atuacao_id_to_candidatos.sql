ALTER TABLE public.candidatos DROP COLUMN IF EXISTS atuacao_id;
ALTER TABLE public.candidatos ADD COLUMN atuacao_id UUID;
