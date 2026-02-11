export interface Colaborador {
  id: string; // Alterado para string para suportar UUID do Supabase
  name: string; // Atualizado de nome
  email?: string;
  gender: string; // Atualizado de genero
  zip_code: string; // Atualizado de cep
  address: string; // Atualizado de endereco
  address_number: string; // Atualizado de numero
  address_complement: string; // Atualizado de complemento
  neighborhood: string; // Atualizado de bairro
  city: string; // Atualizado de cidade
  state: string; // Atualizado de estado
  cpf: string;
  birthday: string; // Atualizado de data_nascimento
  type: string; // Atualizado de tipo
  equipe: string;
  local: string;
  lider_equipe: string;
  role: string; // Atualizado de cargo
  hire_date: string; // Atualizado de data_admissao
  termination_date: string; // Atualizado de data_desligamento
  status: string;
  photo_url?: string; // Atualizado de foto_url
}