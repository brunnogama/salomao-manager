-- Migration to add atividades_academicas and idiomas to candidatos and colaboradores
ALTER TABLE public.candidatos
ADD COLUMN IF NOT EXISTS atividades_academicas TEXT,
ADD COLUMN IF NOT EXISTS idiomas TEXT;

ALTER TABLE public.collaborators
ADD COLUMN IF NOT EXISTS atividades_academicas TEXT,
ADD COLUMN IF NOT EXISTS idiomas TEXT;
