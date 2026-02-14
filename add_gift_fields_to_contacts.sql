-- Migration: Create client_contacts table with Gift Distribution Fields
-- Date: 2026-02-14
-- Description: Creates client_contacts table for CRM gift distribution module

-- Create client_contacts table
CREATE TABLE IF NOT EXISTS public.client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Contact Information
  name text NOT NULL,
  role text,
  email text,
  phone text,
  is_main_contact boolean DEFAULT false,
  
  -- Gift Distribution Fields
  gift_type text,
  gift_other text,
  gift_quantity integer DEFAULT 1,
  gift_history jsonb DEFAULT '[]'::jsonb,
  gift_notes text,
  
  -- Delivery Address (can be different from company address)
  address text,
  address_number text,
  address_complement text,
  neighborhood text,
  city text,
  uf text,
  zip_code text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON public.client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_gift_type ON public.client_contacts(gift_type) WHERE gift_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_client_contacts_name ON public.client_contacts(name);

-- Add comments
COMMENT ON TABLE public.client_contacts IS 'Contacts at client companies for gift distribution';
COMMENT ON COLUMN public.client_contacts.gift_type IS 'Type of gift for this contact (Brinde VIP, Brinde Médio, Outro, Não recebe)';
COMMENT ON COLUMN public.client_contacts.gift_other IS 'Custom gift type if "Outro" is selected';
COMMENT ON COLUMN public.client_contacts.gift_quantity IS 'Quantity of gifts for this contact';
COMMENT ON COLUMN public.client_contacts.gift_history IS 'JSON array of past gifts given to this contact';
COMMENT ON COLUMN public.client_contacts.gift_notes IS 'Notes about gift preferences or history';
COMMENT ON COLUMN public.client_contacts.address IS 'Contact delivery address (can be different from company address)';

-- Enable RLS
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your auth setup)
CREATE POLICY "Enable read access for all users" ON public.client_contacts
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.client_contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.client_contacts
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.client_contacts
  FOR DELETE USING (true);
