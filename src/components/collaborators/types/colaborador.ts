// src/types/colaborador.ts

export interface Colaborador {
  id: string // Suporta UUID do Supabase
  name: string
  cpf?: string
  birthday?: string
  gender?: string

  // Endereço
  zip_code?: string
  address?: string
  address_number?: string
  address_complement?: string
  neighborhood?: string
  city?: string
  state?: string

  // Dados Corporativos
  email?: string
  status?: string
  equipe?: string
  role?: string
  local?: string

  // Hierarquia (UUIDs)
  partner_id?: string // UUID do sócio
  leader_id?: string // UUID do líder direto

  // Relacionamentos (Retornados via Join)
  partner?: { id: string; name: string }
  leader?: { id: string; name: string }

  hire_date?: string
  termination_date?: string

  // Informações Profissionais (OAB) - Mapeado conforme banco de dados
  oab_numero?: string
  oab_state?: string
  oab_validade?: string
  oabs?: {
    id?: string;
    numero: string;
    uf: string;
    tipo: string;
    validade?: string;
  }[];

  // Outros
  photo_url?: string
  created_at?: string
  updated_at?: string
}