import { useMemo } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Info,
  Plane,
  Building2
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { AeronaveLancamento } from '../types/AeronaveTypes'

interface AeronaveComparativoProps {
  data: AeronaveLancamento[];
}

export function AeronaveComparativoComercialParticular({ data }: AeronaveComparativoProps) {
  
  // --- Formatadores ---
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const formatCompact = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(val);
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  // --- Separação de Dados: Comercial vs Particular (CORRIGIDO) ---
  const { comercialData, particularData } = useMemo(() => {
    const comercial = data.filter(item => {
      const aeronave = (item.aeronave || '').toLowerCase().trim()
      return aeronave.includes('comercial') && item.data_pagamento && item.valor_pago
    })
    
    const particular = data.filter(item => {
      const aeronave = (item.aeronave || '').toLowerCase().trim()
      return !aeronave.includes('comercial') && aeronave !== '' && item.data_pagamento && item.valor_pago
    })
    
    // Debug
    console.log('Comercial:', comercial.length, 'registros')
    console.log('Particular:', particular.length, 'registros')
    
    return { comercialData: comercial, particularData: particular }
  }, [data])

  // --- Cálculo de Médias Mensais ---
  const mediaMensalComercial = useMemo(() => {
    if (comercialData.length === 0) return 0
    
    const mesesUnicos = new Set(
      comercialData.map(item => {
        const date = new Date(item.data_pagamento!)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      })
    )
    
    const totalGasto = comercialData.reduce((acc, item) => acc + (item.valor_pago || 0), 0)
    return mesesUnicos.size > 0 ? totalGasto / mesesUnicos.size : 0
  }, [comercialData])

  const mediaMensalParticular = useMemo(() => {
    if (particularData.length === 0) return 0
    
    const mesesUnicos = new Set(
      particularData.map(item => {
        const date = new Date(item.data_pagamento!)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      })
    )
    
    const totalGasto = particularData.reduce((acc, item) => acc + (item.valor_pago || 0), 0)
    return mesesUnicos.size > 0 ? totalGasto / mesesUnicos.size : 0
  }, [particularData])

  // --- Dados do Gráfico (Comparativo Mensal) ---
  const chartData = useMemo(() => {
    const comercialPorMes: Record<string, number> = {}
    const particularPorMes: Record<string, number> = {}

    comercialData.forEach(item => {
      if (!item.data_pagamento) return
      const date = new Date(item.data_pagamento)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      comercialPorMes[key] = (comercialPorMes[key] || 0) + (item.valor_pago || 0)
    })

    particularData.forEach(item => {
      if (!item.data_pagamento) return
      const date = new Date(item.data_pagamento)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      particularPorMes[key] = (particularPorMes[key] || 0) + (item.valor_pago || 0)
    })

    const allKeys = new Set([...Object.keys(comercialPorMes), ...Object.keys(particularPorMes)])
    
    return Array.from(allKeys)
      .sort()
      .map(key => {
        const [ano, mes] = key.split('-')
        const mesLabel = new Date(parseInt(ano), parseInt(mes) - 1).toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: '2-digit' 
        }).replace('.', '')
        
        return {
          name: mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1),
          comercial: comercialPorMes[key] || 0,
          particular: particularPorMes[key] || 0,
          fullDate: key
        }
      })
  }, [comercialData, particularData])

  // --- Gastos por Centro de Custo (CORRIGIDO) ---
  const gastosPorCentroCusto = useMemo(() => {
    const grupos: Record<string, { despesas: Set<string>, total: number }> = {}

    data.forEach(item => {
      const cc = (item.centro_custo || '').trim()
      const valorPago = item.valor_pago || 0
      
      // Ignorar se não tem centro de custo OU não tem valor pago
      if (!cc || valorPago === 0) return
      
      if (!grupos[cc]) {
        grupos[cc] = { despesas: new Set(), total: 0 }
      }
      grupos[cc].total += valorPago
      if (item.despesa) grupos[cc].despesas.add(item.despesa)
    })

    const resultado = Object.entries(grupos)
      .map(([centro, dados]) => ({
        centro_custo: centro,
        despesa: Array.from(dados.despesas).join(', ') || '-',
        total: dados.total
      }))
      .sort((a, b) => b.total - a.total)
    
    // Debug
    console.log('Centros de Custo encontrados:', resultado.length)
    
    return resultado
  }, [data])

  // --- Casos da Agencia ---
  const casosAgencia = useMemo(() => {
    const agenciaData = data.filter(item => {
      const cc = (item.centro_custo || '').toLowerCase().trim()
      return cc.includes('agencia') || cc.includes('agência')
    })

    return agenciaData
      .sort((a, b) => {
        const dateA = new Date(a.data_pagamento || a.data_emissao || '').getTime()
        const dateB = new Date(b.data_pagamento || b.data_emissao || '').getTime()
        return dateB - dateA // Ordem decrescente
      })
  }, [data])

  // --- Insights Automáticos ---
  const insights = useMemo(() => {
    const economia = mediaMensalComercial - mediaMensalParticular
    const percentual = mediaMensalComercial > 0 
      ? ((economia / mediaMensalComercial) * 100) 
      : 0

    const economizando = economia > 0
    const diferencaAbs = Math.abs(economia)

    return {
      economizando,
      economia: diferencaAbs,
      percentual: Math.abs(percentual)
    }
  }, [mediaMensalComercial, mediaMensalParticular])

  // --- Custom Tooltip ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-xl min-w-[160px] z-50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] font-bold text-blue-600 uppercase">Comercial</span>
              <span className="text-xs font-black text-blue-700">{formatCurrency(payload[0]?.value || 0)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] font-bold text-emerald-600 uppercase">Particular</span>
              <span className="text-xs font-black text-emerald-700">{formatCurrency(payload[1]?.value || 0)}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // --- Custom Label para mostrar valores nos pontos ---
  const CustomLabel = ({ x, y, value, color }: any) => {
    if (!value || value === 0) return null
    return (
      <text 
        x={x} 
        y={y - 10} 
        fill={color}
        fontSize={9}
        fontWeight={900}
        textAnchor="middle"
      >
        {formatCompact(value)}
      </text>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-full">
      
      {/* Linha: Gráfico + Tabela */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico (2 colunas) */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6 flex flex-col h-[480px]">
          <div className="mb-6 pb-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">Comparativo Mensal</h2>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Comercial vs Particular</p>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 900 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 900 }}
                  tickFormatter={(val) => formatCompact(val)}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                  formatter={(value) => (
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {value === 'comercial' ? 'Voos Comerciais' : 'Aeronave Particular'}
                    </span>
                  )}
                />
                <Line 
                  type="monotone" 
                  dataKey="comercial" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 3 }}
                  activeDot={{ r: 7, fill: '#3b82f6', strokeWidth: 0 }}
                  label={<CustomLabel color="#3b82f6" />}
                />
                <Line 
                  type="monotone" 
                  dataKey="particular" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#ffffff', stroke: '#10b981', strokeWidth: 3 }}
                  activeDot={{ r: 7, fill: '#10b981', strokeWidth: 0 }}
                  label={<CustomLabel color="#10b981" />}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela de Centro de Custo (1 coluna) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[480px]">
          <div className="mb-4 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-lg">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">Por Centro de Custo</h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Maiores gastos</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 rounded-lg mb-2 shrink-0">
            <div className="col-span-5 text-[10px] font-black uppercase text-gray-500">Centro de Custo</div>
            <div className="col-span-3 text-[10px] font-black uppercase text-gray-500">Despesa</div>
            <div className="col-span-4 text-[10px] font-black uppercase text-gray-500 text-right">Total</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 min-h-0">
            {gastosPorCentroCusto.length > 0 ? (
              gastosPorCentroCusto.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border border-gray-100 rounded-xl hover:bg-purple-50/30 transition-colors items-center">
                  <div className="col-span-5 flex items-center gap-2 overflow-hidden">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-gray-100 text-[9px] font-bold text-gray-500 rounded">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-700 truncate" title={item.centro_custo}>
                      {item.centro_custo}
                    </span>
                  </div>
                  <div className="col-span-3 overflow-hidden">
                    <span className="text-[9px] font-semibold text-gray-500 truncate block" title={item.despesa}>
                      {item.despesa}
                    </span>
                  </div>
                  <div className="col-span-4 text-xs font-black text-purple-600 text-right">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                Nenhum dado de centro de custo
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Insight Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-wide mb-2">Análise Comparativa</h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              {insights.economizando ? (
                <>
                  A aeronave particular está gerando uma <strong>economia média mensal de {formatCurrency(insights.economia)}</strong> ({insights.percentual.toFixed(1)}%) 
                  em comparação aos voos comerciais. Considerando os períodos distintos de operação, a transição para aeronave própria 
                  demonstra redução significativa de custos operacionais.
                </>
              ) : (
                <>
                  A aeronave particular representa um <strong>custo adicional médio mensal de {formatCurrency(insights.economia)}</strong> ({insights.percentual.toFixed(1)}%) 
                  em relação aos voos comerciais. Este investimento adicional pode ser justificado por ganhos em flexibilidade operacional, 
                  produtividade e conveniência não capturados apenas pela análise financeira.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Casos da Agencia */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <div className="mb-6 pb-5 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-lg">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">Casos da Agencia</h2>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
              Relação de passagens • {casosAgencia.length} registro{casosAgencia.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {casosAgencia.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                    Data Passagem
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                    Fornecedor
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                    Observações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {casosAgencia.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap">
                      {formatDate(item.data_pagamento || item.data_emissao)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-600">
                      {item.fornecedor || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-600">
                      {item.tipo || item.despesa || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {item.observacoes || item.descricao || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Plane className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-semibold">Nenhum caso da Agencia encontrado</p>
            <p className="text-xs mt-1">Os registros serão exibidos aqui quando disponíveis</p>
          </div>
        )}
      </div>

    </div>
  )
}
