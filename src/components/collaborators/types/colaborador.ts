export interface Colaborador {
  id: number;
  nome: string;
  cpf: string;
  genero?: string;
  data_nascimento?: string;
  email?: string;
  // Endereço
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  // Dados Profissionais (OAB)
  oab_numero?: string;
  oab_uf?: string;
  oab_validade?: string;
  oab_suplementares?: string[];
  // Dados Corporativos
  cargo: string;
  equipe: string;
  lider_equipe: string;
  local: string;
  data_admissao?: string;
  data_desligamento?: string;
  status: 'Ativo' | 'Desligado' | 'Inativo';
  foto_url?: string;
}

export interface GEDDocument {
  id: string;
  nome_arquivo: string;
  url: string;
  categoria: string;
  created_at: string;
}