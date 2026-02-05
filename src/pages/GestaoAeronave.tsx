import { useState, useEffect, useMemo } from 'react'
import { 
  Plane, 
  UserCircle, 
  LogOut, 
  Grid, 
  Plus, 
  Search, 
  Download, 
  Calendar, 
  XCircle, 
  LayoutDashboard, 
  Table2, 
  FileSpreadsheet,
  Wallet,
  Receipt,
  DollarSign,
  Loader2
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'

// Tipos
import { AeronaveLancamento, OrigemLancamento } from '../types/AeronaveTypes'

// Componentes
import { AeronaveTable } from '../components/AeronaveTable'
import { AeronaveDashboard } from '../components/AeronaveDashboard'
import { AeronaveFormModal } from '../components/AeronaveFormModal'
import { AeronaveViewModal } from '../components/AeronaveViewModal'
import { TipoLancamentoModal } from '../components/TipoLancamentoModal'

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
  // --- Estados de Controle ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dados'>('dados')
  const [filterOrigem, setFilterOrigem] = useState<'todos' | 'missao' | 'fixa'>('todos')
  
  // --- Estados de Dados e Filtros ---
  const [data, setData] = useState<AeronaveLancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  // --- Estados de Modais ---
  const [isTipoModalOpen, setIsTipoModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  
  const [selectedItem, setSelectedItem] = useState<AeronaveLancamento | null>(null)
  const [selectedOrigemForNew, setSelectedOrigemForNew] = useState<OrigemLancamento>('missao')

  // --- Buscando Dados ---
  const fetchDados = async () => {
    try {
      setLoading(true)
      const { data: result, error } = await supabase
        .from('aeronave_lancamentos')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (result) setData(result)
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchDados()
  }, [])

  // --- Filtragem no Front-end ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 1. Filtro de Origem
      if (filterOrigem !== 'todos' && item.origem !== filterOrigem) return false

      // 2. Filtro de Texto (Busca)
      const searchString = searchTerm.toLowerCase()
      const matchSearch = 
        (item.id_missao?.toString() || '').includes(searchString) ||
        (item.nome_missao || '').toLowerCase().includes(searchString) ||
        (item.fornecedor || '').toLowerCase().includes(searchString) ||
        (item.descricao || '').toLowerCase().includes(searchString) ||
        (item.despesa || '').toLowerCase().includes(searchString)

      if (searchTerm && !matchSearch) return false

      // 3. Filtro de Data
      const dateRef = item.data_missao || item.vencimento
      if (startDate && dateRef && dateRef < startDate) return false
      if (endDate && dateRef && dateRef > endDate) return false

      return true
    })
  }, [data, filterOrigem, searchTerm, startDate, endDate])

  // --- Totais (Cards) ---
  const totals = useMemo(() => {
    return filteredData.reduce((acc, curr) => {
      const valor = Number(curr.valor_pago) || 0
      
      acc.totalGeral += valor
      if (curr.origem === 'missao') acc.custoMissoes += valor
      if (curr.origem === 'fixa') acc.despesasFixas += valor
      
      return acc
    }, { totalGeral: 0, custoMissoes: 0, despesasFixas: 0 })
  }, [filteredData])

  // --- Handlers ---
  const handleFormatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const handleOpenNew = (origem: OrigemLancamento) => {
    setSelectedOrigemForNew(origem)
    setSelectedItem(null)
    setIsTipoModalOpen(false)
    setIsFormModalOpen(true)
  }

  const handleRowClick = (item: AeronaveLancamento) => {
    setSelectedItem(item)
    setIsViewModalOpen(true)
  }

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Lancamentos")
    XLSX.writeFile(wb, `Aeronave_Export_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // --- Lógica de Importação (CORRIGIDA) ---
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

        // Funções auxiliares de parse ROBUSTAS
        const parseDate = (val: any) => {
          if (!val) return null
          
          // Ignora textos inválidos explicitamente
          if (typeof val === 'string') {
            const clean = val.trim().toUpperCase()
            if (['N/A', '-', 'NAN', 'UNDEFINED', ''].includes(clean)) return null
          }

          // Se for número serial do Excel
          if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000))
            return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]
          }
          
          // Se for string DD/MM/AAAA
          if (typeof val === 'string' && val.includes('/')) {
            const parts = val.split('/')
            // Garante que tem dia, mês e ano (evita erro "N/A")
            if (parts.length !== 3) return null 
            
            const [d, m, a] = parts
            
            // Valida se são números
            if (isNaN(Number(d)) || isNaN(Number(m)) || isNaN(Number(a))) return null

            // Formata YYYY-MM-DD
            const anoFull = a.length === 2 ? `20${a}` : a
            return `${anoFull}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
          }

           // Se for string YYYY-MM-DD (ISO)
           if (typeof val === 'string' && val.includes('-') && !isNaN(Date.parse(val))) {
             return val
           }
          
          return null // Retorna null para qualquer outro caso estranho
        }

        const parseMoney = (val: any) => {
          if (typeof val === 'number') return val
          if (!val) return 0
          if (typeof val === 'string' && (val.toUpperCase() === 'N/A' || val === '-')) return 0
          
          const clean = String(val)
            .replace('R$', '')
            .replace(/\./g, '') // remove ponto de milhar
            .replace(',', '.') // troca vírgula decimal
            .trim()
          return parseFloat(clean) || 0
        }

        const findVal = (row: any, keys: string[]) => {
          const key = Object.keys(row).find(k => keys.includes(k.trim().toLowerCase()))
          return key ? row[key] : null
        }

        const mappedData = rawData.map((row: any) => {
          // Tenta encontrar ID da missão para definir a origem
          const idMissaoRaw = findVal(row, ['id', 'id missao', 'id_missao'])
          // Considera missão apenas se tiver um ID numérico válido
          const idMissao = idMissaoRaw && !isNaN(parseInt(idMissaoRaw)) ? parseInt(idMissaoRaw) : null
          const isMissao = !!idMissao

          return {
            origem: isMissao ? 'missao' : 'fixa',
            
            // Dados Comuns e de Missão
            tripulacao: findVal(row, ['tripulação', 'tripulacao'])?.toString() || null,
            aeronave: findVal(row, ['aeronave'])?.toString() || 'Aeronave Principal',
            data_missao: parseDate(findVal(row, ['data missao', 'data_missao'])),
            id_missao: idMissao,
            nome_missao: findVal(row, ['missao', 'missão', 'nome_missao'])?.toString() || null,
            
            // Dados Financeiros
            despesa: findVal(row, ['despesa'])?.toString() || (isMissao ? 'Custo Missões' : 'Despesa Fixa'),
            tipo: findVal(row, ['tipo'])?.toString() || 'Outros',
            descricao: findVal(row, ['descricao', 'descrição'])?.toString() || '',
            fornecedor: findVal(row, ['fornecedor'])?.toString() || '',
            
            faturado_cnpj: parseMoney(findVal(row, ['faturado cnpj salomão', 'faturado cnpj'])),
            vencimento: parseDate(findVal(row, ['vencimento'])),
            valor_previsto: parseMoney(findVal(row, ['valor previsto', 'previsto'])),
            
            data_pagamento: parseDate(findVal(row, ['pagamento', 'data pagamento'])),
            valor_pago: parseMoney(findVal(row, ['valor pago', 'pago'])),
            
            observacao: findVal(row, ['observação', 'observacao', 'obs'])?.toString() || '',
            
            // Fiscal
            doc_fiscal: findVal(row, ['doc fiscal', 'doc_fiscal'])?.toString() || null,
            numero_doc: findVal(row, ['numero', 'número', 'numero_doc'])?.toString() || null,
            valor_total_doc: parseMoney(findVal(row, ['valor total doc', 'total doc']))
          }
        })

        const { error } = await supabase.from('aeronave_lancamentos').insert(mappedData)

        if (error) {
          console.error(error)
          alert(`Erro na importação: ${error.message}`)
        } else {
          alert(`${mappedData.length} registros importados com sucesso!`)
          fetchDados()
        }

      } catch (err) {
        console.error(err)
        alert('Erro crítico ao processar arquivo.')
      } finally {
        setIsImporting(false)
        if (e.target) e.target.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <Plane className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0a192f] tracking-tight">Gestão da Aeronave</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Controle Unificado</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-[#1e3a8a]">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button onClick={onModuleHome} className="p-2 text-gray-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors">
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Cards de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Geral */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-indigo-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Geral</p>
            <p className="text-2xl font-black text-indigo-900 mt-1">{handleFormatCurrency(totals.totalGeral)}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Wallet className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        {/* Custo Missões */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Custo Missões</p>
            <p className="text-2xl font-black text-blue-900 mt-1">{handleFormatCurrency(totals.custoMissoes)}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <Receipt className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Despesas Fixas */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-emerald-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Despesas Fixas</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{handleFormatCurrency(totals.despesasFixas)}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl">
            <DollarSign className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* 3. Toolbar Principal */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        
        {/* Linha Superior: Tabs e Filtros de Tipo */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-2 bg-gray-100/50 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'dashboard' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('dados')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'dados' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Table2 className="h-3.5 w-3.5" /> Dados
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterOrigem('todos')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                filterOrigem === 'todos' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              Todos Pagamentos
            </button>
            <button
              onClick={() => setFilterOrigem('missao')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                filterOrigem === 'missao' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400'
              }`}
            >
              Custo Missões
            </button>
            <button
              onClick={() => setFilterOrigem('fixa')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                filterOrigem === 'fixa' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-400'
              }`}
            >
              Despesas Fixas
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input 
              type="date" 
              className="text-xs font-semibold text-gray-700 outline-none bg-transparent"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-gray-300">|</span>
            <input 
              type="date" 
              className="text-xs font-semibold text-gray-700 outline-none bg-transparent"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(''); setEndDate('') }} className="text-red-400 hover:text-red-600">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full my-2"></div>

        {/* Linha Inferior: Busca e Ações */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID, Missão, Fornecedor ou Descrição..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-green-400 transition-all text-xs font-bold uppercase tracking-wide"
            >
              <Download className="h-4 w-4" /> Exportar
            </button>
            
            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-blue-400 transition-all text-xs font-bold uppercase tracking-wide cursor-pointer">
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Importar
              <input type="file" accept=".xlsx" className="hidden" onChange={handleImportExcel} disabled={isImporting} />
            </label>

            <button
              onClick={() => setIsTipoModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#112240] transition-all shadow-md active:scale-95 text-xs font-black uppercase tracking-widest"
            >
              <Plus className="h-4 w-4" /> Novo Lançamento
            </button>
          </div>
        </div>
      </div>

      {/* 4. Área de Conteúdo */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        {activeTab === 'dashboard' ? (
          <AeronaveDashboard data={filteredData} />
        ) : (
          <AeronaveTable 
            data={filteredData} 
            loading={loading}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      {/* 5. Modais */}
      <TipoLancamentoModal 
        isOpen={isTipoModalOpen}
        onClose={() => setIsTipoModalOpen(false)}
        onSelect={(tipo) => handleOpenNew(tipo)}
      />

      <AeronaveFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        origem={selectedOrigemForNew}
        initialData={selectedItem}
        onSuccess={fetchDados}
      />

      <AeronaveViewModal 
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        item={selectedItem}
        onEdit={() => {
          setIsViewModalOpen(false)
          if (selectedItem) {
            setSelectedOrigemForNew(selectedItem.origem)
            setIsFormModalOpen(true)
          }
        }}
        onDelete={() => {
          setIsViewModalOpen(false)
          fetchDados()
        }}
      />

    </div>
  )
}