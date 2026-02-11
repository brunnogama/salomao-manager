// src/components/collaborators/types/presencial.ts

export interface PresenceRecord {
  id?: string
  nome_colaborador: string
  data_hora: string
  arquivo_origem?: string
  // Suporte a nomes vindos de join
  name?: string 
  created_at?: string
}

export interface MarcacaoPonto {
  id?: string
  nome_colaborador: string
  data_hora: string
  tipo_marcacao?: 'entrada' | 'saida_almoco' | 'volta_almoco' | 'saida'
  arquivo_origem?: string
  created_at?: string
}

export interface RegistroDiario {
  colaborador: string
  data: string
  entrada?: string
  saida_almoco?: string
  volta_almoco?: string
  intervalo1?: string
  intervalo2?: string
  saida?: string
  saidas_extras?: string[]
  tempo_util: string
  observacoes: string
  tem_inconsistencia: boolean
}

export interface SocioRule {
  id?: string
  colaborador_id?: string // UUID do colaborador
  partner_id?: string // UUID do sócio (tabela partners)
  weekly_goal?: number // Meta semanal (dias)
  
  // Relacionamentos vindos do Join do Supabase
  collaborator?: { id: string; name: string }
  partner?: { id: string; name: string }

  // Fallbacks e campos de compatibilidade legada
  name?: string 
  partner_name?: string
  socio_responsavel: string 
  nome_colaborador: string
  meta_semanal?: number
}

export interface ReportItem {
  nome: string
  socio: string
  diasPresentes: number
  diasSemana: { [key: string]: number }
  datas: string[]
}