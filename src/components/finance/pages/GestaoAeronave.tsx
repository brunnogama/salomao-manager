import { useState, useEffect, useMemo } from 'react'
import { 
  Plane, 
  UserCircle, 
  LogOut, 
  Grid, 
  Plus, 
  Search, 
  FileSpreadsheet,
  LayoutDashboard,
  Database,
  Loader2,
  Download,
  Calendar,
  XCircle,
  DollarSign,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Receipt,
  Wallet
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../../../lib/supabase'
import { AeronaveTable } from '../components/AeronaveTable'
import { AeronaveFormModal } from '../components/AeronaveFormModal'
import { AeronaveViewModal } from '../components/AeronaveViewModal'
import { AeronaveDashboard } from '../components/AeronaveDashboard'
import { TipoLancamentoModal } from '../components/TipoLancamentoModal'
import { AeronavePagamentoFormModal } from '../components/AeronavePagamentoFormModal'
import { AeronavePagamentoViewModal } from '../components/AeronavePagamentoViewModal'

// ============================================================================
// COMPONENTE INLINE: AeronavePagamentoTable (incorporado para evitar import)
// ============================================================================
interface PagamentoTableProps {
  data: any[];
  loading: boolean;
  onRowClick: (item: any) => void;
}

function AeronavePagamentoTable({ data, loading, onRowClick }: PagamentoTableProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      if (dateString.includes('/') && dateString.split('/')[0].length <= 2) {
        return dateString;
      }
      
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString;

      const adjustedDate = new Date(date.getTime() + Math.abs(date.getTimezoneOffset() * 60000));
      return new Intl.DateTimeFormat('pt-BR').format(adjustedDate)
    } catch (e) {
      return dateString
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
    </div>
  )

  if (!data || data.length === 0) return (
    <div className="p-20 text-center">
      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum pagamento encontrado</p>
    </div>
  )

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-separate border-spacing-y-2 px-4">
        <thead>
          <tr className="text-[#112240]">
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">ID</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Emissão</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Vencimento</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Tipo</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Devedor</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Descrição</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-right">Valor Bruto</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-right">Valor Líquido</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item: any) => (
            <tr 
              key={item.id} 
              onClick={() => onRowClick(item)}
              className="group bg-white hover:bg-blue-50/40 border border-gray-100 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <td className="px-4 py-4 text-[10px] font-black text-blue-600/60 first:rounded-l-xl uppercase tracking-widest">
                #{String(item.index_id || 0).padStart(6, '0')}
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-gray-600">
                {formatDate(item.emissao)}
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-gray-600">
                {formatDate(item.vencimento)}
              </td>
              <td className="px-4 py-4 text-sm font-bold text-[#1e3a8a]">{item.tipo}</td>
              <td className="px-4 py-4 text-sm font-semibold text-gray-700">{item.devedor}</td>
              <td className="px-4 py-4 text-sm font-medium text-gray-500 italic max-w-xs truncate">{item.descricao}</td>
              <td className="px-4 py-4 text-sm font-bold text-amber-600 text-right">
                {formatCurrency(item.valor_bruto)}
              </td>
              <td className="px-4 py-4 text-sm font-black text-emerald-600 text-right last:rounded-r-xl">
                {formatCurrency(item.valor_liquido_realizado)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
// ============================================================================
// FIM DO COMPONENTE INLINE
// ============================================================================

interface GestaoAeronaveProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
  onTogglePresentationMode?: (isPresenting: boolean) => void;
}

export function GestaoAeronave({ 
  userName = 'Usuário', 
  onModuleHome, 
  onLogout,
  onTogglePresentationMode
}: GestaoAeronaveProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gerencial'>('gerencial')
  const [dataType, setDataType] = useState<'tudo' | 'despesas' | 'pagamentos'>('tudo')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedExpense, setSelectedExpense] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [selectedDashboardYear, setSelectedDashboardYear] = useState<string>('total')
  const [data, setData] = useState<any[]>([])
  const [dataPagamentos, setDataPagamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTipoModalOpen, setIsTipoModalOpen] = useState(false)
  const [isPagamentoModalOpen, setIsPagamentoModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  const fetchDados = async () => {
    setLoading(true)
    const { data: result } = await supabase
      .from('financeiro_aeronave')
      .select('*')
      .order('data', { ascending: false })
    if (result) setData(result)
    loading && setLoading(false)
  }

  const fetchPagamentos = async () => {
    setLoading(true)
    const { data: result } = await supabase
      .from('financeiro_aeronave_pagamentos')
      .select('*')
      .order('emissao', { ascending: false })
    if (result) setDataPagamentos(result)
    setLoading(false)
  }

  useEffect(() => { 
    fetchDados()
    fetchPagamentos()
  }, [])

  const expenseOptions = useMemo(() => {
    const expenses = data.map(item => item.despesa).filter(Boolean)
    return Array.from(new Set(expenses)).sort()
  }, [data])

  const supplierOptions = useMemo(() => {
    const suppliers = data.map(item => item.fornecedor).filter(Boolean)
    return Array.from(new Set(suppliers)).sort()
  }, [data])

  const tipoOptions = useMemo(() => {
    const tipos = dataPagamentos.map(item => item.tipo).filter(Boolean)
    return Array.from(new Set(tipos)).sort()
  }, [dataPagamentos])

  const devedorOptions = useMemo(() => {
    const devedores = dataPagamentos.map(item => item.devedor).filter(Boolean)
    return Array.from(new Set(devedores)).sort()
  }, [dataPagamentos])

  const resetFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setSelectedExpense('')
    setSelectedSupplier('')
  }

  const filteredDataDespesas = useMemo(() => {
    return data.filter(item => {
      const matchSearch = Object.values(item).some(val => 
        String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
      )

      const itemDate = item.data ? new Date(item.data) : null
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null

      let matchDate = true
      if (itemDate) {
        if (start && itemDate < start) matchDate = false
        if (end && itemDate > end) matchDate = false
      } else if (start || end) {
        matchDate = false
      }

      const matchExpense = !selectedExpense || item.despesa === selectedExpense
      const matchSupplier = !selectedSupplier || item.fornecedor === selectedSupplier

      return matchSearch && matchDate && matchExpense && matchSupplier
    })
  }, [data, searchTerm, startDate, endDate, selectedExpense, selectedSupplier])

  const filteredDataPagamentos = useMemo(() => {
    return dataPagamentos.filter(item => {
      const matchSearch = Object.values(item).some(val => 
        String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
      )

      const itemDate = item.emissao ? new Date(item.emissao) : null
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null

      let matchDate = true
      if (itemDate) {
        if (start && itemDate < start) matchDate = false
        if (end && itemDate > end) matchDate = false
      } else if (start || end) {
        matchDate = false
      }

      return matchSearch && matchDate
    })
  }, [dataPagamentos, searchTerm, startDate, endDate])

  const currentFilteredData = dataType === 'despesas' ? filteredDataDespesas : 
                              dataType === 'pagamentos' ? filteredDataPagamentos : 
                              [...filteredDataDespesas, ...filteredDataPagamentos]

  // CARDS DINÂMICOS - Filtra por ano do dashboard
  const filteredDataForCards = useMemo(() => {
    let sourceData: any[] = []
    if (dataType === 'tudo') {
      sourceData = [...filteredDataDespesas, ...filteredDataPagamentos]
    } else if (dataType === 'despesas') {
      sourceData = filteredDataDespesas
    } else {
      sourceData = filteredDataPagamentos
    }
    
    if (selectedDashboardYear === 'total') return sourceData
    
    return sourceData.filter(item => {
      const dateField = item.data || item.emissao
      if (!dateField) return false
      const year = dateField.split('-')[0]
      return year === selectedDashboardYear
    })
  }, [filteredDataDespesas, filteredDataPagamentos, selectedDashboardYear, dataType])

  const totals = useMemo(() => {
    if (dataType === 'tudo') {
      const despesas = filteredDataForCards.filter(item => item.data)
      const pagamentos = filteredDataForCards.filter(item => item.emissao)
      
      const totalFlights = new Set(despesas.map(item => `${item.data}-${item.localidade_destino}`)).size
      const totalDespesasPrevisto = despesas.reduce((acc, curr) => acc + (Number(curr.valor_previsto) || 0), 0)
      const totalDespesasPago = despesas.reduce((acc, curr) => acc + (Number(curr.valor_pago) || 0), 0)
      const totalPagamentosBruto = pagamentos.reduce((acc, curr) => acc + (Number(curr.valor_bruto) || 0), 0)
      const totalPagamentosLiquido = pagamentos.reduce((acc, curr) => acc + (Number(curr.valor_liquido_realizado) || 0), 0)
      
      return {
        missoes: totalFlights || 0,
        totalRegistros: filteredDataForCards.length || 0,
        despesasPrevisto: totalDespesasPrevisto || 0,
        despesasPago: totalDespesasPago || 0,
        pagamentosBruto: totalPagamentosBruto || 0,
        pagamentosLiquido: totalPagamentosLiquido || 0,
        totalGeral: (totalDespesasPago || 0) + (totalPagamentosLiquido || 0)
      }
    } else if (dataType === 'despesas') {
      const totalFlights = new Set(filteredDataForCards.map(item => `${item.data}-${item.localidade_destino}`)).size
      return filteredDataForCards.reduce((acc, curr) => ({
        missoes: totalFlights || 0,
        previsto: acc.previsto + (Number(curr.valor_previsto) || 0),
        pago: acc.pago + (Number(curr.valor_pago) || 0),
      }), { missoes: totalFlights || 0, previsto: 0, pago: 0 })
    } else {
      return filteredDataForCards.reduce((acc, curr) => ({
        quantidade: acc.quantidade + 1,
        bruto: acc.bruto + (Number(curr.valor_bruto) || 0),
        liquido: acc.liquido + (Number(curr.valor_liquido_realizado) || 0),
      }), { quantidade: 0, bruto: 0, liquido: 0 })
    }
  }, [filteredDataForCards, dataType])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const handleExportExcel = () => {
    if (currentFilteredData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(currentFilteredData)
    const wb = XLSX.utils.book_new()
    const sheetName = dataType === 'despesas' ? 'Despesas' : 'Pagamentos'
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `Aeronave_${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleSave = async (formData: any) => {
    const { error } = await supabase.from('financeiro_aeronave').upsert(formData)
    if (!error) {
      setIsModalOpen(false)
      setSelectedItem(null)
      fetchDados()
    }
  }

  const handleSavePagamento = async (formData: any) => {
    const { error } = await supabase.from('financeiro_aeronave_pagamentos').upsert(formData)
    if (!error) {
      setIsPagamentoModalOpen(false)
      setSelectedItem(null)
      fetchPagamentos()
    }
  }

  const handleRowClick = (item: any) => {
    setSelectedItem(item)
    setIsViewModalOpen(true)
  }

  const handleEditFromView = (item: any) => {
    setIsViewModalOpen(false)
    setSelectedItem(item)
    // Verifica se é pagamento ou despesa pelo campo 'emissao'
    if (item.emissao) {
      setIsPagamentoModalOpen(true)
    } else {
      setIsModalOpen(true)
    }
  }

  const handleDeleteItem = async (item: any) => {
    const tableName = dataType === 'despesas' ? 'financeiro_aeronave' : 'financeiro_aeronave_pagamentos'
    const itemName = dataType === 'despesas' ? item.fornecedor : item.devedor
    if (confirm(`Tem certeza que deseja excluir o lançamento de ${itemName}?`)) {
      const { error } = await supabase.from(tableName).delete().eq('id', item.id)
      if (!error) {
        setIsViewModalOpen(false)
        setSelectedItem(null)
        if (dataType === 'despesas') {
          fetchDados()
        } else {
          fetchPagamentos()
        }
      }
    }
  }

  const handleMissionClick = (dataMissao: string, destinoMissao: string) => {
    setSearchTerm(destinoMissao)
    setStartDate(dataMissao)
    setEndDate(dataMissao)
    setActiveTab('gerencial')
  }

  const handleTogglePresentation = () => {
    const newMode = !isPresentationMode
    setIsPresentationMode(newMode)
    if (onTogglePresentationMode) {
      onTogglePresentationMode(newMode)
    }
  }

  const handleImportExcelDespesas = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: false })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rawData = XLSX.utils.sheet_to_json(ws)

        const formatExcelDate = (val: any) => {
          if (!val) return null
          if (typeof val === 'string' && val.includes('/')) {
            const [d, m, a] = val.split('/')
            return `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
          }
          if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000))
            return date.toISOString().split('T')[0]
          }
          return val
        }

        const parseCurrency = (val: any) => {
          if (typeof val === 'number') return val
          if (!val) return 0
          const cleanValue = String(val)
            .replace('R$', '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim()
          return parseFloat(cleanValue) || 0
        }

        const mapped = rawData.map((row: any) => {
          const cleanRow: any = {};
          Object.keys(row).forEach(key => {
            cleanRow[key.trim()] = row[key];
          });

          return {
            tripulacao: cleanRow['Tripulação']?.toString() || '',
            aeronave: cleanRow['Aeronave']?.toString() || '',
            data: formatExcelDate(cleanRow['Data']),
            localidade_destino: cleanRow['Localidade e destino']?.toString() || '',
            despesa: cleanRow['Despesa']?.toString() || '',
            descricao: cleanRow['Descrição']?.toString() || '',
            fornecedor: cleanRow['Fornecedor']?.toString() || '',
            faturado_cnpj: parseCurrency(cleanRow['Faturado CNPJ SALOMÃO']),
            valor_previsto: parseCurrency(cleanRow['R$ Previsto total']),
            valor_extra: parseCurrency(cleanRow['R$ Extra']),
            valor_pago: parseCurrency(cleanRow['R$ pago']),
            data_vencimento: formatExcelDate(cleanRow['Data Venc.']),
            data_pagamento: formatExcelDate(cleanRow['Data Pgto']),
            observacao: cleanRow['Observação']?.toString() || ''
          }
        })

        const { error } = await supabase.from('financeiro_aeronave').insert(mapped)
        
        if (error) {
          console.error('Erro detalhado:', error)
          alert(`Erro na importação: ${error.message}`)
        } else {
          alert(`${mapped.length} registros importados com sucesso!`)
          await fetchDados()
        }
      } catch (err) { 
        console.error(err) 
        alert('Erro ao processar o arquivo Excel.')
      } finally { 
        setIsImporting(false) 
        if (e.target) e.target.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImportExcelPagamentos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: false })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rawData = XLSX.utils.sheet_to_json(ws)

        const formatExcelDate = (val: any) => {
          if (!val) return null
          if (typeof val === 'string' && val.includes('/')) {
            const [d, m, a] = val.split('/')
            return `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
          }
          if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000))
            return date.toISOString().split('T')[0]
          }
          return val
        }

        const parseCurrency = (val: any) => {
          if (typeof val === 'number') return val
          if (!val) return 0
          const cleanValue = String(val)
            .replace('R$', '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim()
          return parseFloat(cleanValue) || 0
        }

        const mapped = rawData.map((row: any) => {
          const cleanRow: any = {};
          Object.keys(row).forEach(key => {
            cleanRow[key.trim()] = row[key];
          });

          return {
            emissao: formatExcelDate(cleanRow['Emissão']),
            vencimento: formatExcelDate(cleanRow['Vencimento']),
            valor_bruto: parseCurrency(cleanRow['Valor bruto']),
            valor_liquido_realizado: parseCurrency(cleanRow['Valor líquido realizado']),
            tipo: cleanRow['Tipo']?.toString() || '',
            devedor: cleanRow['Devedor']?.toString() || '',
            descricao: cleanRow['Descrição']?.toString() || ''
          }
        })

        const { error } = await supabase.from('financeiro_aeronave_pagamentos').insert(mapped)
        
        if (error) {
          console.error('Erro detalhado:', error)
          alert(`Erro na importação: ${error.message}`)
        } else {
          alert(`${mapped.length} pagamentos importados com sucesso!`)
          await fetchPagamentos()
        }
      } catch (err) { 
        console.error(err) 
        alert('Erro ao processar o arquivo Excel.')
      } finally { 
        setIsImporting(false) 
        if (e.target) e.target.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className={`flex flex-col min-h-full bg-gradient-to-br from-gray-50 to-gray-100 transition-all duration-300 p-6 space-y-6`}>
      
      {/* HEADER */}
      <div className={`flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in fade-in duration-300 ${isPresentationMode ? 'py-3' : ''}`}>
        <div className="flex items-center gap-4">
          <div className={`rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg ${isPresentationMode ? 'p-2' : 'p-3'}`}>
            <Plane className={isPresentationMode ? 'h-5 w-5 text-white' : 'h-7 w-7 text-white'} />
          </div>
          <div>
            <h1 className={`font-black text-[#0a192f] tracking-tight leading-none ${isPresentationMode ? 'text-xl' : 'text-[30px]'}`}>
              Gestão da Aeronave
            </h1>
            {!isPresentationMode && <p className="text-sm font-semibold text-gray-500 mt-0.5">Operacional e Financeiro</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isPresentationMode && (
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Conectado</span>
            </div>
          )}
          
          <button
            onClick={handleTogglePresentation}
            className={`p-2.5 bg-white border-2 rounded-lg transition-all shadow-sm hover:shadow-md ${
              isPresentationMode 
                ? 'border-blue-600 text-blue-600 bg-blue-50' 
                : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={isPresentationMode ? 'Sair do Modo Apresentação' : 'Modo Apresentação'}
          >
            {isPresentationMode ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>

          {!isPresentationMode && (
            <>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
                <UserCircle className="h-5 w-5" />
              </div>
              {onModuleHome && <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Grid className="h-5 w-5" /></button>}
              {onLogout && <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><LogOut className="h-5 w-5" /></button>}
            </>
          )}
        </div>
      </div>

      {/* CARDS DINÂMICOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-500">
        {dataType === 'tudo' ? (
          <>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Geral</p>
                <p className="text-2xl font-black text-indigo-600 mt-1">{formatCurrency(totals.totalGeral ?? 0)}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <Wallet className="h-6 w-6 text-indigo-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Custo Missões</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{formatCurrency(totals.despesasPago ?? 0)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Despesas Fixas</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totals.pagamentosLiquido ?? 0)}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </>
        ) : dataType === 'despesas' ? (
          <>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Missões</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{totals.missoes}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Plane className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Previsto (a pagar)</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(totals.previsto)}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Pago</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totals.pago)}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Pagamentos</p>
                <p className="text-2xl font-black text-purple-600 mt-1">{totals.quantidade}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                <Receipt className="h-6 w-6 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Bruto</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(totals.bruto)}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Líquido</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totals.liquido)}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100/80 p-1 rounded-2xl border border-gray-200 shadow-sm">
              <button 
                onClick={() => { setActiveTab('dashboard'); resetFilters(); }} 
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-[#1e3a8a] text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('gerencial')} 
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'gerencial' ? 'bg-[#1e3a8a] text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Database className="h-3.5 w-3.5" /> Gerencial
              </button>
            </div>

            {activeTab === 'gerencial' && (
              <div className="flex bg-white border-2 border-gray-200 p-1 rounded-xl shadow-sm ml-2">
                <button 
                  onClick={() => { setDataType('tudo'); resetFilters(); }} 
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${dataType === 'tudo' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Wallet className="h-3 w-3" /> Todos os pagamentos
                </button>
                <button 
                  onClick={() => { setDataType('despesas'); resetFilters(); }} 
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${dataType === 'despesas' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Receipt className="h-3 w-3" /> Custo Missões
                </button>
                <button 
                  onClick={() => { setDataType('pagamentos'); resetFilters(); }} 
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${dataType === 'pagamentos' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <DollarSign className="h-3 w-3" /> Despesas Fixas
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-visible pb-1 md:pb-0">
             <div className="flex items-center bg-white border-2 border-gray-200 hover:border-blue-400 rounded-xl px-4 py-2.5 transition-all shadow-sm hover:shadow-md">
                <Calendar className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                <input 
                  type="date" 
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none w-28"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <span className="mx-2 text-gray-400 text-xs font-black uppercase tracking-widest">até</span>
                <input 
                  type="date" 
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none w-28"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
             </div>

             {(startDate || endDate) && (
               <button 
                onClick={resetFilters} 
                className="flex items-center gap-1.5 px-3 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border-2 border-red-200 shadow-sm hover:shadow-md flex-shrink-0"
               >
                 <XCircle className="h-4 w-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Limpar</span>
               </button>
             )}
          </div>
        </div>

        {activeTab === 'gerencial' && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-50">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder={dataType === 'despesas' ? 'Buscar lançamentos...' : 'Buscar pagamentos...'} 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border-2 border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button 
                onClick={handleExportExcel}
                className="flex items-center justify-center p-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 hover:border-blue-300 transition-all"
                title="Exportar"
              >
                <Download className="h-5 w-5 text-[#1e3a8a]" />
              </button>

              <label className="flex items-center justify-center p-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 hover:border-green-300 cursor-pointer transition-all" title="Importar">
                {isImporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSpreadsheet className="h-5 w-5 text-green-600" />}
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                  onChange={dataType === 'despesas' ? handleImportExcelDespesas : handleImportExcelPagamentos} 
                  disabled={isImporting} 
                />
              </label>

              {(dataType === 'despesas' || dataType === 'pagamentos' || dataType === 'tudo') && (
                <button 
                  onClick={() => { setSelectedItem(null); setIsTipoModalOpen(true); }} 
                  className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-[#112240] transition-all active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" /> Novo Lançamento
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible animate-in fade-in duration-1000">
        {activeTab === 'gerencial' ? (
          <div className="w-full">
            {dataType === 'tudo' ? (
              <div className="space-y-8 p-6">
                <div>
                  <h3 className="text-lg font-black text-[#112240] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-blue-600" />
                    Despesas ({filteredDataDespesas.length})
                  </h3>
                  <AeronaveTable 
                    data={filteredDataDespesas} 
                    loading={loading} 
                    onRowClick={handleRowClick}
                  />
                </div>
                <div className="border-t-2 border-gray-100 pt-8">
                  <h3 className="text-lg font-black text-[#112240] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    Pagamentos ({filteredDataPagamentos.length})
                  </h3>
                  <AeronavePagamentoTable 
                    data={filteredDataPagamentos} 
                    loading={loading} 
                    onRowClick={handleRowClick}
                  />
                </div>
              </div>
            ) : dataType === 'despesas' ? (
              <AeronaveTable 
                data={filteredDataDespesas} 
                loading={loading} 
                onRowClick={handleRowClick}
              />
            ) : (
              <AeronavePagamentoTable 
                data={filteredDataPagamentos} 
                loading={loading} 
                onRowClick={handleRowClick}
              />
            )}
          </div>
        ) : (
          <AeronaveDashboard 
            data={filteredDataDespesas} 
            dataPagamentos={filteredDataPagamentos}
            onMissionClick={handleMissionClick}
            selectedYear={selectedDashboardYear}
            onYearChange={setSelectedDashboardYear}
            viewMode={dataType}
            onViewModeChange={setDataType}
          />
        )}
      </div>

      <TipoLancamentoModal 
        isOpen={isTipoModalOpen} 
        onClose={() => setIsTipoModalOpen(false)}
        onSelectDespesa={() => {
          setIsTipoModalOpen(false)
          setIsModalOpen(true)
        }}
        onSelectPagamento={() => {
          setIsTipoModalOpen(false)
          setIsPagamentoModalOpen(true)
        }}
      />

      <AeronaveFormModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedItem(null); }} 
        onSave={handleSave} 
        initialData={selectedItem} 
      />

      <AeronavePagamentoFormModal 
        isOpen={isPagamentoModalOpen} 
        onClose={() => { setIsPagamentoModalOpen(false); setSelectedItem(null); }} 
        onSave={handleSavePagamento} 
        initialData={selectedItem} 
      />

      {/* Modal de Visualização - Renderiza o correto baseado no tipo */}
      {selectedItem?.emissao ? (
        <AeronavePagamentoViewModal 
          item={selectedItem} 
          isOpen={isViewModalOpen} 
          onClose={() => { setIsViewModalOpen(false); setSelectedItem(null); }} 
          onEdit={handleEditFromView} 
          onDelete={handleDeleteItem} 
        />
      ) : (
        <AeronaveViewModal 
          item={selectedItem} 
          isOpen={isViewModalOpen} 
          onClose={() => { setIsViewModalOpen(false); setSelectedItem(null); }} 
          onEdit={handleEditFromView} 
          onDelete={handleDeleteItem} 
        />
      )}
    </div>
  )
}