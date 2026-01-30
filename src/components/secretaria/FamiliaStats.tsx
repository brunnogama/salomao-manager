// src/components/secretaria/FamiliaStats.tsx
import { useMemo } from 'react'
import { Wallet, User } from 'lucide-react'

interface FamiliaStatsProps {
  data: any[]
}

export function FamiliaStats({ data }: FamiliaStatsProps) {
  const stats = useMemo(() => {
    const agora = new Date()
    const mesAtual = agora.getMonth()
    const anoAtual = agora.getFullYear()

    const filterByMonth = (item: any) => {
      if (!item.vencimento) return false
      const dataVenc = new Date(item.vencimento)
      const dataVencAjustada = new Date(dataVenc.getTime() + dataVenc.getTimezoneOffset() * 60000)
      return dataVencAjustada.getMonth() === mesAtual && dataVencAjustada.getFullYear() === anoAtual
    }

    const totalMes = data.reduce((acc, item) => {
      return filterByMonth(item) ? acc + (Number(item.valor) || 0) : acc
    }, 0)

    const totalRodrigo = data.reduce((acc, item) => {
      return filterByMonth(item) && item.titular?.toUpperCase() === 'RODRIGO' 
        ? acc + (Number(item.valor) || 0) 
        : acc
    }, 0)

    const totalLuisFelipe = data.reduce((acc, item) => {
      return filterByMonth(item) && item.titular?.toUpperCase() === 'LUÍS FELIPE'
        ? acc + (Number(item.valor) || 0) 
        : acc
    }, 0)

    return {
      totalMes,
      totalRodrigo,
      totalLuisFelipe,
      mesNome: agora.toLocaleString('pt-BR', { month: 'long' })
    }
  }, [data])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(val)
  }

  const StatBox = ({ label, value, icon: Icon, gradient }: any) => (
    <div className={`flex items-center gap-4 bg-gradient-to-br ${gradient} px-5 py-3 rounded-xl shadow-lg border border-white/10 group transition-all hover:shadow-blue-900/20`}>
      <div className="p-2.5 bg-white/10 rounded-xl text-blue-200 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white leading-none mb-1.5">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-white tracking-tight whitespace-nowrap">
            {formatCurrency(value)}
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex items-center gap-4">
      <StatBox 
        label={`Total Gasto em ${stats.mesNome}`} 
        value={stats.totalMes} 
        icon={Wallet} 
        gradient="from-[#112240] to-[#1e3a8a]" 
      />
      <StatBox 
        label="Rodrigo" 
        value={stats.totalRodrigo} 
        icon={User} 
        gradient="from-[#0f172a] to-[#1e3a8a]" 
      />
      <StatBox 
        label="Luís Felipe" 
        value={stats.totalLuisFelipe} 
        icon={User} 
        gradient="from-[#0f172a] to-[#1e3a8a]" 
      />
    </div>
  )
}