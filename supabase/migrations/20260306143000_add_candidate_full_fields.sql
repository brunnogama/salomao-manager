-- Add address, banking, emergency, and education fields to candidatos table
ALTER TABLE public.candidatos
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS address_complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
ADD COLUMN IF NOT EXISTS banco_nome TEXT,
ADD COLUMN IF NOT EXISTS banco_tipo_conta TEXT,
ADD COLUMN IF NOT EXISTS banco_agencia TEXT,
ADD COLUMN IF NOT EXISTS banco_conta TEXT,
ADD COLUMN IF NOT EXISTS pix_tipo TEXT,
ADD COLUMN IF NOT EXISTS pix_chave TEXT,
ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS education_history JSONB DEFAULT '[]'::jsonb;
