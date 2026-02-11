// brunnogama/salomao-manager/salomao-manager-3e743876de4fb5af74c8aedf5b89ce1e3913c795/src/types/controladoria.ts

// Types da Controladoria - Integrados ao Manager

export interface Partner {
  id: string;
  name: string; // Centralizado (antigo socio_responsavel/nome)
  email?: string;
  phone?: string;
  active: boolean; // Mapeado para 'status' no banco (active/inactive)
  weekly_goal?: number;
  cpf?: string;
  birthday?: string;
  gender?: string;
  photo_url?: string;
  
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
}

export interface ContractDocument {
  id: string;
  contract_id: string;
  file_name: string;
  file_path: string;
  file_type: 'proposal' | 'contract';
  uploaded_at: string;
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
  documents?: ContractDocument[];
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
  created_at?: string;
  updated_at?: string;
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