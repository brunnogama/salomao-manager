// src/components/collaborators/types/presencial.ts

export interface PresenceRecord {
  id?: string
  nome_colaborador: string
  data_hora: string
  arquivo_origem?: string
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
  partner_id?: string // Vínculo com a tabela partners
  partner_name?: string // Fallback para exibição (socio_responsavel)
  name?: string // Atualizado de nome_colaborador
  weekly_goal?: number // Atualizado de meta_semanal
  // Mantidos campos antigos para compatibilidade com funções de utility legadas
  socio_responsavel: string 
  nome_colaborador: string
  meta_semanal?: number
}

export interface ReportItem {
  nome: string
  socio: string
  diasPresentes: number
  diasSemana: { [key: string]: number }
  datas: string[] // Ajustado para refletir o array de strings das datas
}