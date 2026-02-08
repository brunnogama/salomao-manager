// src/types/AeronaveTypes.ts

export type OrigemLancamento = 'missao' | 'fixa';

export interface AeronaveLancamento {
  id: string; // UUID do Supabase
  created_at?: string;
  origem: OrigemLancamento;

  // Campos Específicos de Missão
  tripulacao?: string | null;
  aeronave?: string | null;
  data_missao?: string | null; // ISO Date YYYY-MM-DD
  id_missao?: number | null; // O ID numérico 999999
  nome_missao?: string | null;

  // Campos Comuns
  despesa: string;
  tipo: string;
  descricao: string;
  fornecedor: string;

  // Financeiro
  faturado_cnpj?: number | null;
  vencimento?: string | null;
  valor_previsto?: number | null;
  data_pagamento?: string | null;
  valor_pago?: number | null;

  // Detalhes
  observacao?: string | null;
  centro_custo?: string | null;
  
  // Fiscal
  doc_fiscal?: string | null;
  numero_doc?: string | null;
  valor_total_doc?: number | null;
}

// Interface auxiliar para os totais do Dashboard
export interface AeronaveDashboardTotals {
  totalGeral: number;
  custoMissoes: number;
  despesasFixas: number;
  countMissoes: number;
  countFixas: number;
}