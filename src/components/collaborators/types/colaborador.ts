// src/types/colaborador.ts

export interface Colaborador {
  id: number
  nome: string
  cpf?: string
  data_nascimento?: string
  genero?: string
  
  // Endereço
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  
  // Dados Corporativos
  email?: string
  status?: string
  equipe?: string
  cargo?: string
  local?: string
  lider_equipe?: string
  data_admissao?: string
  data_desligamento?: string
  
  // Informações Profissionais (OAB)
  oab_numero?: string
  oab_uf?: string
  oab_vencimento?: string
  
  // Outros
  foto_url?: string
  created_at?: string
  updated_at?: string
}