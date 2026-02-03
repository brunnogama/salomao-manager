// src/components/finance/ListaVencimentosOAB.tsx
import { useState, useEffect } from 'react'
import { Calendar, GraduationCap, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface VencimentoOAB {
  id: number
  nome: string
  cargo: string
  oab_numero: string
  oab_uf: string
  oab_vencimento: string
  data_admissao: string
  data_pagamento_oab: string
  dias_ate_pagamento: number
  equipe: string
  status: string
  email: string
}

interface ListaVencimentosOABProps {
  mesAtual: number
  anoAtual: number
}

export function ListaVencimentosOAB({ mesAtual, anoAtual }: ListaVencimentosOABProps) {
  const [vencimentos, setVencimentos] = useState<VencimentoOAB[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'urgente' | 'proximo'>('todos')

  useEffect(() => {
    fetchVencimentos()
  }, [mesAtual, anoAtual])

  const fetchVencimentos = async () => {
    setLoading(true)
    try {
      // Busca usando a função do Supabase
      const { data, error } = await supabase
        .rpc('fn_vencimentos_oab_por_mes', {
          mes_alvo: mesAtual + 1, // JavaScript usa 0-11, SQL usa 1-12
          ano_alvo: anoAtual
        })

      if (error) throw error
      setVencimentos(data || [])
    } catch (error) {
      console.error('Erro ao buscar vencimentos OAB:', error)
      // Fallback: buscar da view
      try {
        const { data, error: viewError } = await supabase
          .from('vw_vencimentos_oab_6meses')
          .select('*')
        
        if (!viewError && data) {
          // Filtrar manualmente por mês/ano
          const filtrados = data.filter((v: any) => {
            const dataPgto = new Date(v.data_pagamento_oab)
            return dataPgto.getMonth() === mesAtual && dataPgto.getFullYear() === anoAtual
          })
          setVencimentos(filtrados)
        }
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return new Date(date.valueOf() + date.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (dias: number) => {
    if (dias < 0) {
      return {
        icon: AlertCircle,
        text: 'VENCIDO',
        class: 'bg-red-50 text-red-700 border-red-200'
      }
    } else if (dias === 0) {
      return {
        icon: AlertCircle,
        text: 'HOJE',
        class: 'bg-orange-50 text-orange-700 border-orange-200'
      }
    } else if (dias <= 7) {
      return {
        icon: Clock,
        text: `${dias}d`,
        class: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      }
    } else if (dias <= 15) {
      return {
        icon: Clock,
        text: `${dias}d`,
        class: 'bg-blue-50 text-blue-700 border-blue-200'
      }
    } else {
      return {
        icon: CheckCircle2,
        text: `${dias}d`,
        class: 'bg-green-50 text-green-700 border-green-200'
      }
    }
  }

  const vencimentosFiltrados = vencimentos.filter(v => {
    if (filtro === 'urgente') return v.dias_ate_pagamento <= 7
    if (filtro === 'proximo') return v.dias_ate_pagamento > 7 && v.dias_ate_pagamento <= 15
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-[#1e3a8a]/30 border-t-[#1e3a8a] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Carregando vencimentos OAB...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#1e3a8a] shadow-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#0a192f]">Vencimentos OAB - 6 Meses Admissão</h3>
            <p className="text-xs text-gray-600 font-medium">
              {vencimentosFiltrados.length} {vencimentosFiltrados.length === 1 ? 'pagamento' : 'pagamentos'} este mês
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all ${
              filtro === 'todos' 
                ? 'bg-[#1e3a8a] text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1e3a8a]/30'
            }`}
          >
            Todos ({vencimentos.length})
          </button>
          <button
            onClick={() => setFiltro('urgente')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all ${
              filtro === 'urgente' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300'
            }`}
          >
            Urgente ({vencimentos.filter(v => v.dias_ate_pagamento <= 7).length})
          </button>
          <button
            onClick={() => setFiltro('proximo')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all ${
              filtro === 'proximo' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
            }`}
          >
            Próximo ({vencimentos.filter(v => v.dias_ate_pagamento > 7 && v.dias_ate_pagamento <= 15).length})
          </button>
        </div>
      </div>

      {/* Lista de Vencimentos */}
      {vencimentosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-gray-100">
              <GraduationCap className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-500">
              Nenhum vencimento de OAB neste período
            </p>
            <p className="text-xs text-gray-400">
              Não há advogados/sócios completando 6 meses de admissão neste mês
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {vencimentosFiltrados.map((vencimento) => {
            const status = getStatusBadge(vencimento.dias_ate_pagamento)
            const StatusIcon = status.icon

            return (
              <div
                key={vencimento.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#1e3a8a]/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Info Principal */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-[#1e3a8a] to-[#112240]">
                        <GraduationCap className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#0a192f]">{vencimento.nome}</h4>
                        <p className="text-xs text-gray-500 font-semibold">{vencimento.cargo} • {vencimento.equipe}</p>
                      </div>
                    </div>

                    {/* Detalhes OAB */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-0.5">OAB</p>
                        <p className="text-xs font-bold text-[#0a192f]">{vencimento.oab_numero}</p>
                      </div>
                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-0.5">UF</p>
                        <p className="text-xs font-bold text-[#0a192f]">{vencimento.oab_uf}</p>
                      </div>
                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Admissão</p>
                        <p className="text-xs font-bold text-[#0a192f]">{formatDate(vencimento.data_admissao)}</p>
                      </div>
                      <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                        <p className="text-[8px] font-black text-blue-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" /> Pagamento
                        </p>
                        <p className="text-xs font-bold text-blue-900">{formatDate(vencimento.data_pagamento_oab)}</p>
                      </div>
                    </div>

                    {/* Vencimento Anuidade (se tiver) */}
                    {vencimento.oab_vencimento && (
                      <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-100 inline-block">
                        <p className="text-[8px] font-black text-purple-600 uppercase tracking-wider mb-0.5">Vencimento Anuidade</p>
                        <p className="text-xs font-bold text-purple-900">{formatDate(vencimento.oab_vencimento)}</p>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border ${status.class}`}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-[9px] font-black uppercase tracking-wider">{status.text}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legenda */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Legenda de Status</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs font-semibold text-gray-600">Vencido</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs font-semibold text-gray-600">Hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs font-semibold text-gray-600">Até 7 dias</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs font-semibold text-gray-600">8-15 dias</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-gray-600">+15 dias</span>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-900 mb-1">Sobre o Pagamento OAB</p>
            <p className="text-xs text-blue-700">
              Os pagamentos da OAB devem ser realizados <strong>6 meses após a admissão do colaborador</strong>. 
              A data de pagamento calculada considera <strong>1 dia antes</strong> dos 6 meses completos para garantir processamento a tempo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}