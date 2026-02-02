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
  Download
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../../../lib/supabase'
import { AeronaveTable } from '../components/AeronaveTable'
import { AeronaveFormModal } from '../components/AeronaveFormModal'

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
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

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

  // Lógica de Filtros Avançados (SDS)
  const filteredData = useMemo(() => {
    return data.filter(item => 
      Object.values(item).some(val => 
        String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [data, searchTerm])

  // Lógica de Exportação XLSX
  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(filteredData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Dados_Aeronave")
    XLSX.writeFile(wb, `Aeronave_Relatorio_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Lógica de Salvamento/Update
  const handleSave = async (formData: any) => {
    const { error } = await supabase.from('financeiro_aeronave').upsert(formData)
    if (!error) {
      setIsModalOpen(false)
      fetchDados()
    }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rawData = XLSX.utils.sheet_to_json(ws)

        // Mapeamento exato dos nomes das colunas da planilha
        const mapped = rawData.map((row: any) => ({
          tripulacao: row['Tripuração'],
          aeronave: row['Aeronave'],
          data: row['Data'],
          localidade_destino: row['Localidade e destino'],
          despesa: row['Despesa'],
          fornecedor: row['Fornecedor'],
          faturado_cnpj: row['Faturado CNPJ SALOMÃO'],
          valor_previsto: row['R$ Previsto total'],
          valor_extra: row['R$ Extra'],
          valor_pago: row['R$ pago'],
          data_vencimento: row['Data Venc.'],
          data_pagamento: row['Data Pgto'],
          observacao: row['Observação']
        }))

        await supabase.from('financeiro_aeronave').insert(mapped)
        await fetchDados()
      } catch (err) { console.error(err) }
      finally { setIsImporting(false) }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-6">
      
      {/* HEADER PADRÃO SDS */}
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
          <div className="flex bg-gray-100/80 p-1 rounded-2xl border border-gray-200 shadow-sm shrink-0 mr-4">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-[#1e3a8a] text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('gerencial')} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'gerencial' ? 'bg-[#1e3a8a] text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Database className="h-3.5 w-3.5" /> Gerencial
            </button>
          </div>

          <div className="hidden md:flex flex-col items-end">
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

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3">
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

        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-all"
          >
            <Download className="h-3.5 w-3.5 text-[#1e3a8a]" /> Exportar
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-gray-50 cursor-pointer transition-all">
            {isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />}
            Importar XLSX
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} disabled={isImporting} />
          </label>

          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-[#112240] transition-all active:scale-95">
            <Plus className="h-3.5 w-3.5" /> Novo Registro
          </button>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto custom-scrollbar">
        {activeTab === 'gerencial' ? (
          <AeronaveTable data={filteredData} loading={loading} />
        ) : (
          <div className="p-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest flex flex-col items-center">
            <RefreshCw className="h-8 w-8 mb-4 animate-spin opacity-20" />
            Dashboard em desenvolvimento
          </div>
        )}
      </div>

      <AeronaveFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} />
    </div>
  )
}