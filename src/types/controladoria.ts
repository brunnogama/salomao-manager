// brunnogama/salomao-manager/salomao-manager-3e743876de4fb5af74c8aedf5b89ce1e3913c795/src/types/controladoria.ts

// Types da Controladoria - Integrados ao Manager

export interface Partner {
  id: string;
  name: string; // Centralizado (antigo socio_responsavel/nome)
  email?: string;
  phone?: string;
  active: boolean; // Mapeado para 'status' no banco (active/inactive)
  status?: 'active' | 'inactive';
  weekly_goal?: number;
  cpf?: string;
  birthday?: string;
  gender?: string;
  photo_url?: string;
  foto_url?: string; // Legacy/DB field support

  // Endereço
  zip_code?: string;
  address?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;

  // Profissional
  oab_number?: string;
  oab_state?: string;
  oab_expiration?: string;
  hire_date?: string;
  termination_date?: string;

  created_at?: string;
  updated_at?: string;
}

export interface Collaborator {
  id: string;
  matricula_interna?: string;
  name: string;
  partner_id?: string; // Vínculo com o Sócio Responsável (tabela partners)
  partner?: { id: string; name: string }; // Joined field
  leader_id?: string; // Vínculo com o Líder Direto
  leader?: { id: string; name: string }; // Joined field
  email?: string; // E-mail Corporativo
  email_pessoal?: string; // E-mail Pessoal
  telefone?: string;
  linkedin_url?: string;
  status: 'active' | 'inactive' | 'Pré-Cadastro';
  cpf?: string;
  birthday?: string;
  gender?: string;
  photo_url?: string;
  foto_url?: string; // Legacy/DB field support

  // Endereço
  zip_code?: string;
  address?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;

  // Profissional
  role?: string;
  original_role?: string; // Para histórico
  role_change_date?: string; // Para histórico
  roles?: { name: string }; // Joined field
  hire_date?: string;
  termination_date?: string;
  oab_vencimento?: string;
  perfil?: string; // Tags de habilidades
  resumo_cv?: string; // Resumo gerado pela IA
  oabs?: {
    id?: string;
    numero: string;
    uf: string;
    tipo: string;
    validade?: string;
  }[];

  // Novos campos
  contract_type?: string;
  history_observations?: string;
  ctps_numero?: string;
  ctps_serie?: string;
  ctps_uf?: string;
  pis_pasep?: string;
  dispensa_militar?: string;

  // Notificações de RH
  mochila_entregue?: boolean;
  ultimo_aniversario_parabenizado?: number;

  // Escolaridade
  escolaridade_nivel?: string;
  escolaridade_subnivel?: string;
  escolaridade_instituicao?: string;
  escolaridade_matricula?: string;
  escolaridade_semestre?: string;
  escolaridade_previsao_conclusao?: string;
  escolaridade_curso?: string;
  education_history?: {
    id: string;
    nivel: 'Ensino Fundamental' | 'Ensino Médio' | 'Graduação' | 'Pós-Graduação' | string;
    subnivel?: string;
    instituicao: string;
    instituicao_uf?: string; // Novo campo
    curso: string;
    status: 'Cursando' | 'Formado(a)';
    matricula?: string;
    semestre?: string;
    previsao_conclusao?: string;
    ano_conclusao?: string;
  }[];

  // Novos Campos (Solicitados)
  rg?: string;
  emergencia_nome?: string;
  emergencia_telefone?: string;
  emergencia_parentesco?: string;
  emergency_contacts?: {
    id?: string;
    nome: string;
    telefone: string;
    parentesco: string;
  }[];
  atuacao?: string;
  motivo_desligamento?: string;
  matricula_esocial?: string;
  observacoes?: string;
  atividades_academicas?: string;
  idiomas?: string;
  oab_emissao?: string;

  // Dados Bancários
  forma_pagamento?: string;
  banco_nome?: string;
  banco_tipo_conta?: string;
  banco_agencia?: string;
  banco_conta?: string;
  pix_tipo?: string;
  pix_chave?: string;

  // Novos Campos (Rateio e Desligamento)
  rateio_id?: string;
  hiring_reason_id?: string;
  candidato_id?: string;
  termination_initiative_id?: string;
  termination_type_id?: string;
  termination_reason_id?: string;

  // New Field: Area
  area?: 'Administrativa' | 'Jurídica';

  // Transporte
  transportes?: {
    tipo: string;
    ida_qtd: number;
    volta_qtd: number;
    ida_valores: number[];
    volta_valores: number[];
  }[];

  // Horário de Trabalho
  work_schedule_start?: string;
  work_schedule_end?: string;

  // Campos Adicionais para evitar erros de lint (UI/Form)
  civil_status?: string;
  nacionalidade?: string;
  naturalidade_cidade?: string;
  naturalidade_uf?: string;
  mae?: string;
  pai?: string;
  ctps?: string;
  cnh?: string;
  tituloseleitor?: string;
  reservista?: string;
  pis?: string;

  // Filhos
  has_children?: boolean;
  children_count?: number;
  children_data?: {
    id: string;
    name: string;
    birth_date: string;
  }[];

  hiring_reasons?: { id: string; name: string };
  termination_initiatives?: { id: string; name: string };
  termination_types?: { id: string; name: string };
  termination_reasons?: { id: string; name: string };

  local?: string;
  locations?: { name: string }; // Joined field
  equipe?: string;
  teams?: { name: string }; // Joined field
  rateios?: { id: string; name: string };

  cadastro_atualizado?: boolean;
  competencias?: string;

  created_at?: string;
  updated_at?: string;
}

export interface Analyst {
  id: string;
  name: string;
  active: boolean;
  email?: string;
  created_at?: string;
}

export interface Magistrate {
  name: string;
  title?: string;
}

export interface ContractProcess {
  id?: string;
  contract_id?: string;
  process_number: string;
  author?: string;
  opponent?: string;
  court?: string;
  vara?: string;
  comarca?: string;
  subject?: string;
  magistrates?: Magistrate[];

  // UI/Form fields
  position?: string;
  uf?: string;
  author_cnpj?: string;
  opponent_cnpj?: string;
  cause_value?: string;
  value_of_cause?: number;
}

export interface ContractCase {
  id?: string;
  contract_id?: string;
  pro_labore?: string;
  final_success_fee?: string;
  success_fee?: string;
}

export interface ContractDocument {
  id: string;
  contract_id: string;
  file_name: string;
  file_path: string;
  file_type: 'proposal' | 'contract';
  uploaded_at: string;
  hon_number_ref?: string;
}

export interface Contract {
  id?: string;
  seq_id?: number;
  display_id?: string;
  cnpj?: string;
  has_no_cnpj?: boolean;
  client_name: string;
  client_position?: 'Autor' | 'Réu';
  area?: string;
  uf?: string;
  billing_location?: string;
  partner_id?: string;
  partner_name?: string;
  analyst_id?: string;
  analyzed_by_name?: string;
  has_legal_process?: boolean;
  processes?: ContractProcess[];
  process_count?: number;
  status: 'analysis' | 'proposal' | 'active' | 'rejected' | 'probono';
  prospect_date?: string;
  proposal_date?: string;
  contract_date?: string;
  rejection_date?: string;
  probono_date?: string;
  pro_labore?: string;
  pro_labore_clause?: string;
  pro_labore_extras?: string[];
  pro_labore_extras_clauses?: string[];
  other_fees?: string;
  other_fees_clause?: string;
  fixed_monthly_fee?: string;
  fixed_monthly_fee_clause?: string;
  intermediate_fees?: string[];
  intermediate_fees_clauses?: string[];
  final_success_fee?: string;
  final_success_fee_clause?: string;
  final_success_extras?: string[];
  final_success_extras_clauses?: string[];
  hon_number?: string;
  physical_signature?: boolean;
  observations?: string;
  reference?: string;
  created_at?: string;
  updated_at?: string;
  proposal_code?: string;
  rejection_by?: string;
  rejection_reason?: string;
  documents?: ContractDocument[];

  // Missing fields added for ContractFormModal
  client_id?: string;
  timesheet?: boolean;

  pro_labore_installments?: string;
  final_success_fee_installments?: string;
  fixed_monthly_fee_installments?: string;
  other_fees_installments?: string;

  pro_labore_breakdown?: any[];
  final_success_fee_breakdown?: any[];
  fixed_monthly_fee_breakdown?: any[];
  other_fees_breakdown?: any[];
  interim_breakdown?: any[];

  pro_labore_extras_installments?: string[];
  final_success_extras_installments?: string[];
  fixed_monthly_extras_installments?: string[];
  other_fees_extras_installments?: string[];
  intermediate_fees_installments?: string[];

  percent_extras?: string[];
  percent_extras_clauses?: string[];
  final_success_percent?: string;
  final_success_percent_clause?: string;

  // Additional fields for calculations
  fixed_monthly_extras?: string[];
  other_fees_extras?: string[];
  cases?: ContractCase[];
  responsavel_socio?: string;
  rejection_source?: string;

  // Potential legacy fields
  fixed_fee?: string;
  honorarios_fixos?: string;
}

export interface ClientContact {
  id?: string;
  client_id?: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  is_main_contact?: boolean;

  // CRM / Brindes
  gift_type?: string;
  gift_other?: string;
  gift_quantity?: number;
  gift_notes?: string;

  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id?: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  city?: string;
  uf?: string;
  is_person?: boolean;
  partner_id?: string;
  partner_name?: string;
  active_contracts_count?: number;
  contacts?: ClientContact[];
  created_at?: string;
  updated_at?: string;

  // Campos de endereço
  address?: string;
  number?: string;
  complement?: string;

  // Campos unificados para Brindes/CRM
  company?: string;
  gift_type?: string;
  gift_other?: string;
  quantity?: number;
  gift_history?: any;
  notes?: string;
}

export interface FinancialInstallment {
  id: string;
  contract_id: string;
  type: 'pro_labore' | 'success_fee' | 'final_success_fee' | 'intermediate_fee' | 'fixed_monthly_fee' | 'other_fees';
  amount: number;
  installment_number: number;
  total_installments: number;
  due_date: string | null;
  paid_at?: string | null;
  status: 'pending' | 'paid';
  clause?: string;
  contract?: {
    id: string;
    seq_id?: number;
    display_id?: string;
    hon_number?: string;
    client_name: string;
    partner_id?: string;
    partner_name?: string;
    billing_location?: string;
    status: string;
  };
  created_at?: string;
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'signature' | 'done';
  priority: 'Baixa' | 'Média' | 'Alta';
  due_date?: string | null;
  contract_id?: string | null;
  position?: number;
  contract?: {
    client_name: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface TimelineEvent {
  id: string;
  contract_id: string;
  event_type: string;
  old_value?: any;
  new_value?: any;
  changed_by?: string;
  changed_at: string;
}

export interface GEDDocument {
  id: string;
  colaborador_id: string;
  nome_arquivo: string;
  url: string;
  categoria: string;
  tamanho: number;
  tipo_arquivo: string;
  created_at: string;
}

export interface Candidato {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  linkedin?: string;
  curriculo_url?: string;
  atividades_academicas?: string;
  idiomas?: string;
  created_at?: string;
}

export interface Vaga {
  id: string;
  vaga_id_text: string;
  role_id?: string | number;
  atuacao_id?: string | number;
  location_id?: string | number;
  quantidade: number;
  hiring_reason_id?: string | number;
  replaced_collaborator_id?: string;
  perfil?: string;
  area?: string;
  tipo?: 'Temporária' | 'Definitiva';
  sigilosa?: boolean;
  remuneracao?: number;
  partner_id?: string;
  leader_id?: string;
  recrutadora?: string;
  data_abertura?: string;
  data_prazo?: string;
  data_fechamento?: string;
  data_aprovacao_gestor?: string;
  status: 'Congelada' | 'Aberta' | 'Fechada' | 'Aguardando Autorização';
  observacoes?: string;
  candidato_aprovado_id?: string;
  aprovador_id?: string;
  created_at?: string;
  updated_at?: string;

  // Joined fields for display
  role?: { id: string; name: string };
  location?: { id: string; name: string };
  atuacao?: { id: string; name: string };
  hiring_reason?: { id: string; name: string };
  replaced_collaborator?: { id: string; name: string };
  partner?: { id: string; name: string };
  leader?: { id: string; name: string };
  candidato_aprovado?: { id: string; nome: string };
  candidato?: { id?: string; nome: string };
  aprovador?: { id: string; name: string };
}
