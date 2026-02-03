import { useState, useEffect, useMemo } from 'react'
import { 
  Plane, 
  UserCircle, 
  LogOut, 
  Grid, 
  Plus, 
  Search, 
  FileSpreadsheet,
  RefreshCw,
  LayoutDashboard,
  Database,
  Loader2,
  Download,
  Calendar,
  XCircle,
  Tag,
  Building2
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../../../lib/supabase'
import { AeronaveTable } from '../components/AeronaveTable'
import { AeronaveFormModal } from '../components/AeronaveFormModal'
import { AeronaveViewModal } from '../components/AeronaveViewModal'
import { AeronaveDashboard } from '../components/AeronaveDashboard'

interface GestaoAeronaveProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function GestaoAeronave({ 
  userName = 'Usuário', 
  onModuleHome, 
  onLogout 
}: GestaoAeronaveProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gerencial'>('gerencial')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedExpense, setSelectedExpense] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  const fetchDados = async () => {
    setLoading(true)
    const { data: result } = await supabase
      .from('financeiro_aeronave')
      .select('*')
      .order('data', { ascending: false })
    if (result) setData(result)
    setLoading(false)
  }

  useEffect(() => { fetchDados() }, [])

  // Opções dinâmicas extraídas dos dados para os selects
  const expenseOptions = useMemo(() => {
    const options = data.map(item => item.despesa).filter(Boolean)
    return Array.from(new Set(options)).sort()
  }, [data])

  const supplierOptions = useMemo(() => {
    const options = data.map(item => item.fornecedor).filter(Boolean)
    return Array.from(new Set(options)).sort()
  }, [data])

  const resetFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setSelectedExpense('')
    setSelectedSupplier('')
  }

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Filtro de Texto Global
      const matchSearch = Object.values(item).some(val => 
        String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
      )

      // Filtro de Período
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

      // Filtros de Select (Despesa e Fornecedor)
      const matchExpense = !selectedExpense || item.despesa === selectedExpense
      const matchSupplier = !selectedSupplier || item.fornecedor === selectedSupplier

      return matchSearch && matchDate && matchExpense && matchSupplier
    })
  }, [data, searchTerm, startDate, endDate, selectedExpense, selectedSupplier])

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(filteredData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Dados_Aeronave")
    XLSX.writeFile(wb, `Aeronave_Relatorio_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleSave = async (formData: any) => {
    const { error } = await supabase.from('financeiro_aeronave').upsert(formData)
    if (!error) {
      setIsModalOpen(false)
      setSelectedItem(null)
      fetchDados()
    }
  }

  const handleRowClick = (item: any) => {
    setSelectedItem(item)
    setIsViewModalOpen(true)
  }

  const handleEditFromView = (item: any) => {
    setIsViewModalOpen(false)
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleDeleteItem = async (item: any) => {
    if (confirm(`Tem certeza que deseja excluir o lançamento de ${item.fornecedor}?`)) {
      const { error } = await supabase.from('financeiro_aeronave').delete().eq('id', item.id)
      if (!error) {
        setIsViewModalOpen(false)
        setSelectedItem(null)
        fetchDados()
      }
    }
  }

  const handleMissionClick = (dataMissao: string, destinoMissao: string) => {
    setSearchTerm(destinoMissao)
    setStartDate(dataMissao)
    setEndDate(dataMissao)
    setActiveTab('gerencial')
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="flex flex-col min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-6">
      
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Plane className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Gestão da Aeronave</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Operacional e Financeiro</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Conectado</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Grid className="h-5 w-5" /></button>}
          {onLogout && <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><LogOut className="h-5 w-5" /></button>}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex bg-gray-100/80 p-1 rounded-2xl border border-gray-200 shadow-sm w-full md:w-auto">
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

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
             {/* FILTRO DE DESPESA */}
             <div className="flex items-center bg-gray-100/50 border border-gray-200 rounded-xl px-3 py-2">
                <Tag className="h-3.5 w-3.5 text-gray-400 mr-2" />
                <select 
                  value={selectedExpense} 
                  onChange={e => setSelectedExpense(e.target.value)}
                  className="bg-transparent text-[11px] font-bold text-gray-600 outline-none min-w-[120px] cursor-pointer"
                >
                  <option value="">Todas Despesas</option>
                  {expenseOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
             </div>

             {/* FILTRO DE FORNECEDOR */}
             <div className="flex items-center bg-gray-100/50 border border-gray-200 rounded-xl px-3 py-2">
                <Building2 className="h-3.5 w-3.5 text-gray-400 mr-2" />
                <select 
                  value={selectedSupplier} 
                  onChange={e => setSelectedSupplier(e.target.value)}
                  className="bg-transparent text-[11px] font-bold text-gray-600 outline-none min-w-[140px] cursor-pointer"
                >
                  <option value="">Todos Fornecedores</option>
                  {supplierOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
             </div>

             {/* FILTRO DE DATA */}
             <div className="flex items-center bg-gray-100/50 border border-gray-200 rounded-xl px-4 py-2 w-full md:w-auto">
                <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                <input 
                  type="date" 
                  className="bg-transparent text-xs font-bold text-gray-600 outline-none"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <span className="mx-3 text-gray-400 text-[10px] font-black uppercase tracking-widest">até</span>
                <input 
                  type="date" 
                  className="bg-transparent text-xs font-bold text-gray-600 outline-none"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
             </div>

             {(startDate || endDate || searchTerm || selectedExpense || selectedSupplier) && (
               <button 
                onClick={resetFilters} 
                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100 animate-in zoom-in duration-300"
               >
                 <XCircle className="h-4 w-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Limpar</span>
               </button>
             )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-50">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar lançamentos..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={handleExportExcel}
              className="flex items-center justify-center p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
              title="Exportar"
            >
              <Download className="h-5 w-5 text-[#1e3a8a]" />
            </button>

            <label className="flex items-center justify-center p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 cursor-pointer transition-all" title="Importar">
              {isImporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSpreadsheet className="h-5 w-5 text-green-600" />}
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} disabled={isImporting} />
            </label>

            <button 
              onClick={() => { setSelectedItem(null); setIsModalOpen(true); }} 
              className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-[#112240] transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" /> Novo Registro
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
        {activeTab === 'gerencial' ? (
          <div className="w-full">
            <AeronaveTable 
              data={filteredData} 
              loading={loading} 
              onRowClick={handleRowClick}
            />
          </div>
        ) : (
          <AeronaveDashboard 
            data={data} 
            onMissionClick={handleMissionClick} 
          />
        )}
      </div>

      <AeronaveFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedItem(null); }} onSave={handleSave} initialData={selectedItem} />
      <AeronaveViewModal item={selectedItem} isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setSelectedItem(null); }} onEdit={handleEditFromView} onDelete={handleDeleteItem} />
    </div>
  )
}