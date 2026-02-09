//src/components/finance/contasareceber/pages/FinanceContasReceber.tsx
import { useState } from 'react'
import { 
  ArrowDownCircle, 
  UserCircle, 
  Grid, 
  LogOut,
  Filter,
  Mail,
  Clock,
  AlertCircle,
  Phone,
  CheckCircle2,
  Loader2,
  FileText,
  Search,
  Check
} from 'lucide-react'
import { FinanceModalEnviarFatura } from '../components/FinanceModalEnviarFatura'
import { useFinanceContasReceber, FaturaStatus } from '../hooks/useFinanceContasReceber'

interface FinanceContasReceberProps {
  userName?: string;
  userEmail?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function FinanceContasReceber({ 
  userName = 'Usuário', 
  userEmail = '',
  onModuleHome, 
  onLogout 
}: FinanceContasReceberProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { faturas, loading, confirmarPagamento } = useFinanceContasReceber()

  const getStatusStyles = (status: FaturaStatus) => {
    switch (status) {
      case 'aguardando_resposta':
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: <Clock className="h-3 w-3" />, label: 'Aguardando (2d)' }
      case 'radar':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: <AlertCircle className="h-3 w-3" />, label: 'No Radar (+2d)' }
      case 'contato_direto':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', icon: <Phone className="h-3 w-3" />, label: 'Contato Direto' }
      case 'pago':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Recebido' }
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', icon: <Clock className="h-3 w-3" />, label: 'Enviado' }
    }
  }

  const handleConfirmarPagamento = async (id: string, cliente: string) => {
    if (confirm(`Deseja confirmar o recebimento da fatura de ${cliente}?`)) {
      try {
        await confirmarPagamento(id);
      } catch (error: any) {
        alert("Erro ao confirmar pagamento: " + error.message);
      }
    }
  }

  const filteredFaturas = faturas.filter(f => 
    f.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">
      
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <ArrowDownCircle className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Contas a Receber
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Gestão de entradas e fluxo de cobrança 2d + 2d
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Financeiro</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 w-full">
        
        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-sm"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-100 text-[#0a192f] rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-sm hover:bg-gray-50 transition-all">
              <Filter className="h-4 w-4" /> Filtros
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Mail className="h-4 w-4" /> Enviar Fatura
            </button>
          </div>
        </div>

        {/* TABELA DE ACOMPANHAMENTO REAL */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#1e3a8a]" />
              <p className="font-bold text-sm uppercase tracking-widest">Carregando Faturas...</p>
            </div>
          ) : filteredFaturas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Enviado em</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status Fluxo</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredFaturas.map((fatura) => {
                    const style = getStatusStyles(fatura.status);
                    return (
                      <tr key={fatura.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-[#0a192f] block">{fatura.cliente_nome}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-[#1e3a8a]">
                            {Number(fatura.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-600">
                            {new Date(fatura.data_envio).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                              {style.icon}
                              <span className="text-[10px] font-black uppercase tracking-tighter">{style.label}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {fatura.status !== 'pago' && (
                              <button 
                                onClick={() => handleConfirmarPagamento(fatura.id, fatura.cliente_nome)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Confirmar Recebimento"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button className="p-2 text-gray-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-all">
                              <FileText className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full bg-blue-50 mb-4">
                <Mail className="h-12 w-12 text-[#1e3a8a] opacity-20" />
              </div>
              <h2 className="text-xl font-black text-[#0a192f]">Inicie sua cobrança</h2>
              <p className="text-gray-500 max-w-sm mt-2">Nenhuma fatura encontrada. Clique no botão acima para enviar a primeira fatura ao cliente.</p>
            </div>
          )}
        </div>
      </div>

      <FinanceModalEnviarFatura 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userEmail={userEmail}
      />
    </div>
  )
}