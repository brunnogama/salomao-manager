// src/components/secretaria/FamiliaStats.tsx
import { useMemo } from 'react'
import { Wallet } from 'lucide-react'

interface FamiliaStatsProps {
  data: any[]
}

export function FamiliaStats({ data }: FamiliaStatsProps) {
  const stats = useMemo(() => {
    const agora = new Date()
    const mesAtual = agora.getMonth()
    const anoAtual = agora.getFullYear()

    const totalMes = data.reduce((acc, item) => {
      if (!item.vencimento) return acc
      
      const dataVenc = new Date(item.vencimento)
      // Ajuste para evitar problemas de fuso horário na comparação de data ISO
      const dataVencAjustada = new Date(dataVenc.getTime() + dataVenc.getTimezoneOffset() * 60000)
      
      if (dataVencAjustada.getMonth() === mesAtual && dataVencAjustada.getFullYear() === anoAtual) {
        return acc + (Number(item.valor) || 0)
      }
      return acc
    }, 0)

    return {
      totalMes,
      mesNome: agora.toLocaleString('pt-BR', { month: 'long' })
    }
  }, [data])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(val)
  }

  return (
    <div className="flex items-center gap-4 bg-gradient-to-br from-[#112240] to-[#1e3a8a] px-5 py-3 rounded-2xl shadow-lg border border-white/10 group transition-all hover:shadow-blue-900/20">
      <div className="p-2.5 bg-white/10 rounded-xl text-blue-200 group-hover:scale-110 transition-transform">
        <Wallet className="w-5 h-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200/60 leading-none mb-1">
          Total Gasto em {stats.mesNome}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-white tracking-tight">
            {formatCurrency(stats.totalMes)}
          </span>
        </div>
      </div>
    </div>
  )
}