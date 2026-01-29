export interface Colaborador {
  id: number;
  nome: string;
  email?: string;
  genero: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cpf: string;
  data_nascimento: string;
  tipo: string;
  equipe: string;
  local: string;
  lider_equipe: string;
  cargo: string;
  data_admissao: string;
  data_desligamento: string;
  status: string;
  foto_url?: string;
}