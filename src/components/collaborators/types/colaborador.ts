// src/types/colaborador.ts

export interface Colaborador {
  id: string // Alterado para string para suportar UUID do Supabase
  name: string // Atualizado de nome
  cpf?: string
  birthday?: string // Atualizado de data_nascimento
  gender?: string // Atualizado de genero
  
  // Endereço
  zip_code?: string // Atualizado de cep
  address?: string // Atualizado de endereco
  address_number?: string // Atualizado de numero
  address_complement?: string // Atualizado de complemento
  neighborhood?: string // Atualizado de bairro
  city?: string // Atualizado de cidade
  state?: string // Atualizado de estado
  
  // Dados Corporativos
  email?: string
  status?: string
  equipe?: string
  role?: string // Atualizado de cargo
  local?: string
  lider_equipe?: string
  hire_date?: string // Atualizado de data_admissao
  termination_date?: string // Atualizado de data_desligamento
  
  // Informações Profissionais (OAB)
  oab_number?: string // Atualizado de oab_numero
  oab_state?: string // Atualizado de oab_uf
  oab_expiration?: string // Atualizado de oab_vencimento
  
  // Outros
  photo_url?: string // Atualizado de foto_url
  created_at?: string
  updated_at?: string
}