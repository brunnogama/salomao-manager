import { useState, useEffect } from 'react'
import { Calendar, GraduationCap, AlertCircle, CheckCircle2, Clock, X, DollarSign, Ban } from 'lucide-react'
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
  // Novos campos da tabela financeira
  valor_anuidade?: number
  status_pagamento_real?: string
}

interface ListaVencimentosOABProps {
  mesAtual: number
  anoAtual: number
}

export function ListaVencimentosOAB({ mesAtual, anoAtual }: ListaVencimentosOABProps) {
  const [vencimentos, setVencimentos] = useState<VencimentoOAB[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'urgente' | 'tratados' | 'mes_atual'>('todos')
  const [selectedVencimento, setSelectedVencimento] = useState<VencimentoOAB | null>(null)
  const [valorInput, setValorInput] = useState('')

  useEffect(() => {
    fetchVencimentos()
  }, [mesAtual, anoAtual])

  const fetchVencimentos = async () => {
    setLoading(true)
    try {
      // 1. Busca Colaboradores
      const { data: colaboradores, error: colError } = await supabase
        .from('colaboradores')
        .select('*')

      if (colError) throw colError

      // 2. Busca Dados Financeiros Reais (Sem filtro de período para permitir visão global)
      const { data: financeiros, error: finError } = await supabase
        .from('financeiro_oab')
        .select('*')

      if (finError) throw finError

      if (colaboradores) {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        const processados = colaboradores.filter((v: any) => {
          if (!v.data_admissao) return false

          // Filtro de Status Ativo
          const statusLimpo = v.status?.trim().toLowerCase() || '';
          if (!statusLimpo.includes('ativ')) return false;

          const cargoLimpo = v.cargo?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
          const ehCargoValido = cargoLimpo.includes('advogad') || cargoLimpo.includes('socio') || cargoLimpo.includes('socia') || cargoLimpo.includes('estagiario') || cargoLimpo.includes('estagiaria') || cargoLimpo.includes('juridico') || cargoLimpo.includes('legal');

          if (v.cargo && !ehCargoValido && !v.equipe?.toLowerCase().includes('juridico')) return false;

          return true;
        }).map((v: any) => {
          let dia, mes, ano;
          const dataAdmissaoSoData = v.data_admissao.split('T')[0];

          if (dataAdmissaoSoData.includes('/')) {
            [dia, mes, ano] = dataAdmissaoSoData.split('/').map(Number);
          } else {
            [ano, mes, dia] = dataAdmissaoSoData.split('-').map(Number);
          }

          const dataVenc = new Date(ano, (mes - 1) + 6, dia)
          dataVenc.setDate(dataVenc.getDate() - 1)

          // Use UTC dates to avoid timezone differences incorrectly counting days when time is near midnight
          const dataVencUTC = Date.UTC(dataVenc.getFullYear(), dataVenc.getMonth(), dataVenc.getDate());
          const hojeUTC = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

          const diff = Math.ceil((dataVencUTC - hojeUTC) / (1000 * 60 * 60 * 24))

          // Add padStart to ensure valid YYYY-MM-DD format without local timezone shift vulnerabilities
          const dataPagamentoFmt = `${dataVenc.getFullYear()}-${String(dataVenc.getMonth() + 1).padStart(2, '0')}-${String(dataVenc.getDate()).padStart(2, '0')}`;

          // Cruzamento com dados financeiros reais baseado no vencimento calculado
          const fin = financeiros?.find(f =>
            f.colaborador_id === v.id &&
            f.mes_referencia === dataVenc.getMonth() &&
            f.ano_referencia === dataVenc.getFullYear()
          )

          return {
            ...v,
            data_pagamento_oab: dataPagamentoFmt,
            dias_ate_pagamento: diff,
            valor_anuidade: fin?.valor_anuidade,
            status_pagamento_real: fin?.status_pagamento
          }
        })

        // Ordenação: Do mais antigo (mais atrasado/menor diff) para o mais novo
        processados.sort((a, b) => a.dias_ate_pagamento - b.dias_ate_pagamento)

        setVencimentos(processados)
      }
    } catch (error) {
      console.error('Erro ao buscar vencimentos OAB:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (status: 'pago' | 'desconsiderado') => {
    if (!selectedVencimento) return

    const valorNumerico = parseFloat(valorInput.replace(/[R$\s.]/g, '').replace(',', '.'))
    const [anoStr, mesStr] = selectedVencimento.data_pagamento_oab.split('-');
    const mesRef = parseInt(mesStr, 10) - 1;
    const anoRef = parseInt(anoStr, 10);

    try {
      const { error } = await supabase
        .from('financeiro_oab')
        .upsert({
          colaborador_id: selectedVencimento.id,
          mes_referencia: mesRef,
          ano_referencia: anoRef,
          status_pagamento: status,
          valor_anuidade: status === 'pago' ? valorNumerico : 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'colaborador_id,mes_referencia,ano_referencia' })

      if (error) throw error

      await fetchVencimentos()
      setSelectedVencimento(null)
      setValorInput('')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar registro.')
    }
  }

  const formatCurrencyInput = (value: string) => {
    const digits = value.replace(/\D/g, '')
    const realValue = (Number(digits) / 100).toFixed(2)
    return realValue.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value)
    setValorInput(`R$ ${formatted}`)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('T')[0].split('-')
      return `${day}/${month}/${year}`
    }
    return dateString
  }

  const getStatusBadge = (dias: number, statusReal?: string) => {
    if (statusReal === 'pago') {
      return {
        icon: CheckCircle2,
        text: 'PAGO',
        class: 'bg-green-600 text-white border-green-700 font-black'
      }
    }

    if (statusReal === 'desconsiderado') {
      return {
        icon: Ban,
        text: 'DESC.',
        class: 'bg-gray-500 text-white border-gray-600 font-black'
      }
    }

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

  const vencimentosPendentesGlobal = vencimentos.filter(v => !v.status_pagamento_real || (v.status_pagamento_real !== 'pago' && v.status_pagamento_real !== 'desconsiderado'))
  const vencimentosTratadosGlobal = vencimentos.filter(v => v.status_pagamento_real === 'pago' || v.status_pagamento_real === 'desconsiderado')

  const vencimentosFiltrados = (() => {
    if (filtro === 'tratados') return vencimentosTratadosGlobal;
    if (filtro === 'urgente') return vencimentosPendentesGlobal.filter(v => v.dias_ate_pagamento <= 7);
    if (filtro === 'mes_atual') {
      const hoje = new Date();
      return vencimentosPendentesGlobal.filter(v => {
        const [year, month] = v.data_pagamento_oab.split('-');
        return parseInt(month, 10) === hoje.getMonth() + 1 && parseInt(year, 10) === hoje.getFullYear();
      });
    }
    return vencimentosPendentesGlobal; // 'todos'
  })();

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
      <div className="flex gap-2 flex-wrap p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setFiltro('todos')}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'todos'
            ? 'bg-[#1e3a8a] text-white shadow-md'
            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
        >
          Todos ({vencimentosPendentesGlobal.length})
        </button>

        <button
          onClick={() => setFiltro('urgente')}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'urgente'
            ? 'bg-red-600 text-white shadow-md'
            : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
        >
          Urgente ({vencimentosPendentesGlobal.filter(v => v.dias_ate_pagamento <= 7).length})
        </button>

        <button
          onClick={() => setFiltro('tratados')}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'tratados'
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
        >
          Tratados ({vencimentosTratadosGlobal.length})
        </button>
      </div>

      {vencimentosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
          Nenhum vencimento encontrado
        </div>
      ) : (
        <div className="space-y-3">
          {vencimentosFiltrados.map((vencimento) => {
            const status = getStatusBadge(vencimento.dias_ate_pagamento, vencimento.status_pagamento_real)
            const StatusIcon = status.icon

            return (
              <div
                key={vencimento.id}
                onClick={() => setSelectedVencimento(vencimento)}
                className={`bg-white rounded-xl border p-5 transition-all cursor-pointer ${vencimento.dias_ate_pagamento === 0 && !vencimento.status_pagamento_real ? 'ring-2 ring-orange-500 border-orange-200 shadow-lg' : 'border-gray-200 hover:border-[#1e3a8a]/30 hover:shadow-md'}`}
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

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                      <div className={`${vencimento.dias_ate_pagamento === 0 && !vencimento.status_pagamento_real ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-100'} p-2.5 rounded-lg border`}>
                        <p className={`text-[8px] font-black ${vencimento.dias_ate_pagamento === 0 && !vencimento.status_pagamento_real ? 'text-orange-600' : 'text-blue-600'} uppercase tracking-wider mb-0.5 flex items-center gap-1`}>
                          <Calendar className="h-2.5 w-2.5" /> Previsto
                        </p>
                        <p className={`text-xs font-bold ${vencimento.dias_ate_pagamento === 0 && !vencimento.status_pagamento_real ? 'text-orange-900' : 'text-blue-900'}`}>{formatDate(vencimento.data_pagamento_oab)}</p>
                      </div>
                      <div className="bg-green-50 p-2.5 rounded-lg border border-green-100">
                        <p className="text-[8px] font-black text-green-600 uppercase tracking-wider mb-0.5">Valor Pago</p>
                        <p className="text-xs font-bold text-green-900">
                          {vencimento.valor_anuidade ? `R$ ${vencimento.valor_anuidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                        </p>
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

      {selectedVencimento && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#1e3a8a] text-white">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Tratar Vencimento OAB</h3>
                  <p className="text-xs text-blue-100 font-medium">{selectedVencimento.nome}</p>
                </div>
              </div>
              <button onClick={() => setSelectedVencimento(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">OAB Número / UF</p>
                  <p className="text-sm font-bold text-[#0a192f]">{selectedVencimento.oab_numero} / {selectedVencimento.oab_uf}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Data Prevista</p>
                  <p className="text-sm font-bold text-[#0a192f]">{formatDate(selectedVencimento.data_pagamento_oab)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-700 uppercase tracking-wider block">Valor Pago</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={valorInput}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#0a192f] focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={() => handleUpdateStatus('desconsiderado')}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all uppercase tracking-widest"
                >
                  <Ban className="h-4 w-4" /> Desconsiderar
                </button>
                <button
                  onClick={() => handleUpdateStatus('pago')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 rounded-xl text-xs font-black text-white hover:bg-green-700 shadow-lg shadow-green-200 transition-all uppercase tracking-widest"
                >
                  <CheckCircle2 className="h-4 w-4" /> Marcar como Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Legenda de Status</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-xs font-semibold text-gray-600">Vencido</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /><span className="text-xs font-semibold text-gray-600">Hoje</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span className="text-xs font-semibold text-gray-600">Até 7 dias</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-xs font-semibold text-gray-600">8-15 dias</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs font-semibold text-gray-600">Pago / +15 dias</span></div>
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