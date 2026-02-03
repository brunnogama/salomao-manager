import { useState, useEffect } from 'react'
import { Calendar, GraduationCap, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

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
      // BUSCA DIRETA NA TABELA (Garante que puxe tudo sem depender de View)
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
      
      if (error) throw error

      if (data) {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        const processados = data.filter((v: any) => {
          if (!v.data_admissao) return false
          
          // FILTRO DE CARGO: Apenas Advogado ou Sócio (ignora case e acentos)
          const cargoNormalizado = v.cargo?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
          if (cargoNormalizado !== 'advogado' && cargoNormalizado !== 'socio') return false;
          
          // Suporta formato DD/MM/AAAA (da máscara) e YYYY-MM-DD
          let dia, mes, ano;
          if (v.data_admissao.includes('/')) {
            [dia, mes, ano] = v.data_admissao.split('/').map(Number);
          } else {
            [ano, mes, dia] = v.data_admissao.split('-').map(Number);
          }

          // Lógica: Admissão + 6 meses - 1 dia 
          const dataVenc = new Date(ano, (mes - 1) + 6, dia)
          dataVenc.setDate(dataVenc.getDate() - 1)

          // Só entra na lista se o vencimento calculado for no mês/ano visualizado
          return dataVenc.getMonth() === mesAtual && dataVenc.getFullYear() === anoAtual
        }).map((v: any) => {
          let dia, mes, ano;
          if (v.data_admissao.includes('/')) {
            [dia, mes, ano] = v.data_admissao.split('/').map(Number);
          } else {
            [ano, mes, dia] = v.data_admissao.split('-').map(Number);
          }

          const dataVenc = new Date(ano, (mes - 1) + 6, dia)
          dataVenc.setDate(dataVenc.getDate() - 1)
          
          const diff = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
          return { 
            ...v, 
            data_pagamento_oab: dataVenc.toISOString().split('T')[0],
            dias_ate_pagamento: diff 
          }
        })

        // ORDENAÇÃO: Do mais próximo (antigo no calendário) para o mais distante
        processados.sort((a, b) => new Date(a.data_pagamento_oab).getTime() - new Date(b.data_pagamento_oab).getTime())

        setVencimentos(processados)
      }
    } catch (error) {
      console.error('Erro ao buscar vencimentos OAB:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    // Converte YYYY-MM-DD ou strings ISO para DD/MM/AAAA
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    }
    return dateString
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
        class: 'bg-orange-600 text-white border-orange-700 font-black animate-pulse'
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#1e3a8a] shadow-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#0a192f]">Vencimentos OAB - 6 Meses Admissão</h3>
            <p className="text-xs text-gray-600 font-medium">
              {vencimentosFiltrados.length} {vencimentosFiltrados.length === 1 ? 'pagamento' : 'pagamentos'} para este período
            </p>
          </div>
        </div>

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

      {vencimentosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-gray-100">
              <GraduationCap className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-500">
              Nenhum vencimento de OAB encontrado
            </p>
            <p className="text-xs text-gray-400">
              Verificando período: {mesAtual + 1}/{anoAtual}
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
                className={`bg-white rounded-xl border p-5 transition-all ${vencimento.dias_ate_pagamento === 0 ? 'ring-2 ring-orange-500 border-orange-200 shadow-lg' : 'border-gray-200 hover:border-[#1e3a8a]/30 hover:shadow-md'}`}
              >
                <div className="flex items-start justify-between gap-4">
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
                      <div className={`${vencimento.dias_ate_pagamento === 0 ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-100'} p-2.5 rounded-lg border`}>
                        <p className={`text-[8px] font-black ${vencimento.dias_ate_pagamento === 0 ? 'text-orange-600' : 'text-blue-600'} uppercase tracking-wider mb-0.5 flex items-center gap-1`}>
                          <Calendar className="h-2.5 w-2.5" /> Pagamento
                        </p>
                        <p className={`text-xs font-bold ${vencimento.dias_ate_pagamento === 0 ? 'text-orange-900' : 'text-blue-900'}`}>{formatDate(vencimento.data_pagamento_oab)}</p>
                      </div>
                    </div>
                  </div>

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

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Legenda de Status</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-xs font-semibold text-gray-600">Vencido</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /><span className="text-xs font-semibold text-gray-600">Hoje</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span className="text-xs font-semibold text-gray-600">Até 7 dias</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-xs font-semibold text-gray-600">8-15 dias</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs font-semibold text-gray-600">+15 dias</span></div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-900 mb-1">Sobre o Pagamento OAB</p>
            <p className="text-xs text-blue-700">
              Os pagamentos da OAB devem ser realizados 6 meses após a admissão. A data calculada considera 1 dia antes dos 6 meses completos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}