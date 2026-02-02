import { useMemo, useEffect } from 'react'
import { DollarSign, Plane, Building2, Wallet, TrendingUp, BarChart3, PieChart } from 'lucide-react'

interface DashboardProps {
  data: any[];
  onMissionClick?: (data: string, destino: string) => void;
  onResetFilter?: () => void;
}

export function AeronaveDashboard({ data, onMissionClick, onResetFilter }: DashboardProps) {
  // Resetar filtros ao montar o componente (voltar para a aba)
  useEffect(() => {
    if (onResetFilter) {
      onResetFilter();
    }
  }, [onResetFilter]);

  const stats = useMemo(() => {
    const totalPaid = data.reduce((acc, curr) => acc + (Number(curr.valor_pago) || 0), 0)
    const totalCnpj = data.reduce((acc, curr) => acc + (Number(curr.faturado_cnpj) || 0), 0)
    
    const totalFlights = new Set(data.map(item => `${item.data}-${item.localidade_destino}`)).size

    const missionsMap: any = {}
    data.forEach(item => {
      const key = `${item.data} | ${item.localidade_destino}`
      if (!missionsMap[key]) {
        missionsMap[key] = { key, data: item.data, destino: item.localidade_destino, pago: 0, cnpj: 0 }
      }
      missionsMap[key].pago += Number(item.valor_pago) || 0
      missionsMap[key].cnpj += Number(item.faturado_cnpj) || 0
    })

    const expenseMap: any = {}
    data.forEach(item => {
      const cat = item.despesa || 'Outros'
      expenseMap[cat] = (expenseMap[cat] || 0) + (Number(item.valor_pago) || 0)
    })

    const supplierMap: any = {}
    data.forEach(item => {
      const sup = item.fornecedor || 'Não Informado'
      supplierMap[sup] = (supplierMap[sup] || 0) + (Number(item.valor_pago) || 0)
    })

    return {
      totalPaid,
      totalCnpj,
      totalFlights,
      missions: Object.values(missionsMap).sort((a: any, b: any) => b.data.localeCompare(a.data)),
      expenses: Object.entries(expenseMap).sort((a: any, b: any) => b[1] - a[1]),
      suppliers: Object.entries(supplierMap).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5)
    }
  }, [data])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---'
    try {
      if (dateStr.includes('/')) return dateStr
      const [y, m, d] = dateStr.split('-')
      return `${d}/${m}/${y}`
    } catch { return dateStr }
  }

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
        color === 'emerald' ? 'bg-emerald-50' : color === 'orange' ? 'bg-orange-50' : 'bg-blue-50'
      }`}>
        <Icon className={`h-6 w-6 ${
          color === 'emerald' ? 'text-emerald-600' : color === 'orange' ? 'text-orange-600' : 'text-blue-600'
        }`} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-xl font-black text-[#112240] tracking-tight mt-1">{value}</h3>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Pago (R$)" value={formatCurrency(stats.totalPaid)} icon={Wallet} color="emerald" />
        <StatCard title="Faturado CNPJ" value={formatCurrency(stats.totalCnpj)} icon={Building2} color="orange" />
        <StatCard title="Total de Missões" value={stats.totalFlights} icon={Plane} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
            <h4 className="text-[11px] font-black text-[#112240] uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Totais por Missão
            </h4>
            <span className="text-[9px] font-bold text-gray-400 uppercase">{data.length} Lançamentos</span>
          </div>
          <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">
                <tr>
                  <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Data / Trecho</th>
                  <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">CNPJ</th>
                  <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.missions.map((m: any) => (
                  <tr 
                    key={m.key} 
                    onClick={() => {
                      if (onMissionClick) onMissionClick(m.data, m.destino);
                    }}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[#112240]">{formatDate(m.data)}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[200px]">{m.destino}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-orange-600 text-right">{formatCurrency(m.cnpj)}</td>
                    <td className="px-8 py-4 text-xs font-black text-emerald-600 text-right">{formatCurrency(m.pago)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h4 className="text-[11px] font-black text-[#112240] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" /> Principais Fornecedores
            </h4>
            <div className="space-y-5">
              {stats.suppliers.map(([name, value]: any) => (
                <div key={name} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-500 truncate max-w-[140px] uppercase">{name}</span>
                    <span className="text-[10px] font-black text-[#112240]">{formatCurrency(value)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${(value / (stats.totalPaid || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#112240] p-8 rounded-[2rem] shadow-xl text-white">
            <h4 className="text-[11px] font-black text-blue-300 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <PieChart className="h-4 w-4" /> Despesas por Tipo
            </h4>
            <div className="space-y-4">
              {stats.expenses.slice(0, 6).map(([name, value]: any) => (
                <div key={name} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-150 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300">{name}</span>
                  </div>
                  <span className="text-[10px] font-black">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}