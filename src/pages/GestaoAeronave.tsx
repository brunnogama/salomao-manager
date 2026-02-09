import { useState, useEffect, useMemo, useRef } from 'react'
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
  Loader2,
  FileText,
  Printer,
  TrendingUp,
  TrendingDown,
  Building2
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
import { AeronaveComparativoComercialParticular } from '../components/AeronaveComparativoComercialParticular'

// Componente de Cards do Comparativo
function ComparativoCards({ data }: { data: AeronaveLancamento[] }) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const { mediaMensalComercial, mediaMensalParticular, insights } = useMemo(() => {
    const comercial = data.filter(item => {
      const aeronave = (item.aeronave || '').toLowerCase().trim()
      return aeronave.includes('comercial') && item.data_pagamento && item.valor_pago
    })
    
    const particular = data.filter(item => {
      const aeronave = (item.aeronave || '').toLowerCase().trim()
      return !aeronave.includes('comercial') && aeronave !== '' && item.data_pagamento && item.valor_pago
    })

    // Média Mensal Comercial
    const mesesUnicosComercial = new Set(
      comercial.map(item => {
        const date = new Date(item.data_pagamento!)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      })
    )
    const totalComercial = comercial.reduce((acc, item) => acc + (item.valor_pago || 0), 0)
    const mediaComercial = mesesUnicosComercial.size > 0 ? totalComercial / mesesUnicosComercial.size : 0

    // Média Mensal Particular
    const mesesUnicosParticular = new Set(
      particular.map(item => {
        const date = new Date(item.data_pagamento!)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      })
    )
    const totalParticular = particular.reduce((acc, item) => acc + (item.valor_pago || 0), 0)
    const mediaParticular = mesesUnicosParticular.size > 0 ? totalParticular / mesesUnicosParticular.size : 0

    // Insights
    const economia = mediaComercial - mediaParticular
    const percentual = mediaComercial > 0 ? ((economia / mediaComercial) * 100) : 0
    const economizando = economia > 0

    return {
      mediaMensalComercial: mediaComercial,
      mediaMensalParticular: mediaParticular,
      insights: {
        economizando,
        economia: Math.abs(economia),
        percentual: Math.abs(percentual)
      }
    }
  }, [data])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
        <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Média/Mês</p>
          <p className="text-2xl font-black text-blue-900 mt-1">{formatCurrency(mediaMensalComercial)}</p>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">Voos Comerciais</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl">
          <Building2 className="h-6 w-6 text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
        <div className="absolute right-0 top-0 h-full w-1 bg-emerald-600"></div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Média/Mês</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{formatCurrency(mediaMensalParticular)}</p>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">Aeronave Particular</p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-xl">
          <Plane className="h-6 w-6 text-emerald-600" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
        <div className={`absolute right-0 top-0 h-full w-1 ${insights.economizando ? 'bg-green-600' : 'bg-amber-600'}`}></div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {insights.economizando ? 'Economia' : 'Custo Adicional'}
          </p>
          <p className={`text-2xl font-black mt-1 ${insights.economizando ? 'text-green-900' : 'text-amber-900'}`}>
            {formatCurrency(insights.economia)}
          </p>
          <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${insights.economizando ? 'text-green-600' : 'text-amber-600'}`}>
            {insights.percentual.toFixed(1)}% {insights.economizando ? 'de redução' : 'a mais'}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${insights.economizando ? 'bg-green-50' : 'bg-amber-50'}`}>
          {insights.economizando ? <TrendingDown className="h-6 w-6 text-green-600" /> : <TrendingUp className="h-6 w-6 text-amber-600" />}
        </div>
      </div>
    </div>
  )
}

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'comparativo' | 'faturas' | 'dados'>('dashboard')
  const [filterOrigem, setFilterOrigem] = useState<'todos' | 'missao' | 'fixa'>('todos')
  const [filterCentroCusto, setFilterCentroCusto] = useState<string>('todos')
  
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
  const [selectedGroup, setSelectedGroup] = useState<AeronaveLancamento[]>([])
  const [selectedOrigemForNew, setSelectedOrigemForNew] = useState<OrigemLancamento>('missao')

  // Ref para scroll ao topo
  const topRef = useRef<HTMLDivElement>(null)

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

  // Lista de Centros de Custo únicos para o filtro
  const centrosCusto = useMemo(() => {
    const unique = new Set(data.map(item => item.centro_custo).filter(Boolean))
    return Array.from(unique).sort()
  }, [data])

  // --- Filtragem no Front-end ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 0. FILTRO ESPECIAL PARA DASHBOARD E FATURAS: Excluir Voos Comerciais e Agência
      if (activeTab === 'dashboard' || activeTab === 'faturas') {
        const aeronave = (item.aeronave || '').toLowerCase().trim()
        const despesa = (item.despesa || '').toLowerCase().trim()
        const tipo = (item.tipo || '').toLowerCase().trim()
        
        const isComercial = aeronave.includes('comercial')
        const isAgencia = despesa.includes('agência') || despesa.includes('agencia')
        const isPassagem = tipo.includes('passagem')
        
        // Se for comercial/agência/passagem, excluir do dashboard e das faturas
        if (isComercial || isAgencia || isPassagem) return false
      }
      
      // 1. Filtro de Origem (não aplicar na aba Faturas e Comparativo)
      if (activeTab !== 'faturas' && activeTab !== 'comparativo' && filterOrigem !== 'todos' && item.origem !== filterOrigem) return false

      // Filtro de Centro de Custo (apenas para Comparativo)
      if (activeTab === 'comparativo' && filterCentroCusto !== 'todos' && item.centro_custo !== filterCentroCusto) return false

      // 2. Filtro de Texto (Busca)
      const searchString = searchTerm.toLowerCase()
      const matchSearch = 
        (item.id_missao?.toString() || '').includes(searchString) ||
        (item.nome_missao || '').toLowerCase().includes(searchString) ||
        (item.fornecedor || '').toLowerCase().includes(searchString) ||
        (item.descricao || '').toLowerCase().includes(searchString) ||
        (item.despesa || '').toLowerCase().includes(searchString)

      if (searchTerm && !matchSearch) return false

      // 3. Filtro de Data (ALTERADO: usa data_pagamento para Dados, data_missao para Dashboard)
      const dateRef = activeTab === 'dashboard' ? item.data_missao : item.data_pagamento
      if (startDate && dateRef && dateRef < startDate) return false
      if (endDate && dateRef && dateRef > endDate) return false

      return true
    })
  }, [data, filterOrigem, searchTerm, startDate, endDate, activeTab, filterCentroCusto])

  // --- Agrupamento de Faturas (Tarefa 3) ---
  const faturasAgrupadas = useMemo(() => {
    const validFaturas = filteredData.filter(item => item.doc_fiscal && item.doc_fiscal.trim() !== '')
    
    const groups: { [key: string]: AeronaveLancamento[] } = {}
    validFaturas.forEach(item => {
      const key = `${item.doc_fiscal}-${item.numero_doc}`
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })

    return Object.values(groups).map(group => {
      return {
        ...group[0],
        _items: group
      }
    })
  }, [filteredData])

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

  // --- Total Agência/Passagem para Card Cinza (Guia Dados) ---
  const totalAgenciaPassagem = useMemo(() => {
    return filteredData.reduce((acc, item) => {
      const despesa = (item.despesa || '').toLowerCase().trim()
      const tipo = (item.tipo || '').toLowerCase().trim()
      if ((despesa.includes('agência') || despesa.includes('agencia')) && tipo.includes('passagem')) {
        return acc + (Number(item.valor_pago) || 0)
      }
      return acc
    }, 0)
  }, [filteredData])

  // --- Totais do Ano Corrente ---
  const currentYear = new Date().getFullYear()
  const yearTotals = useMemo(() => {
    return data.reduce((acc, curr) => {
      const dateStr = curr.data_pagamento || curr.vencimento
      if (dateStr) {
        const year = dateStr.startsWith(String(currentYear)) 
          ? currentYear 
          : new Date(dateStr).getFullYear()
          
        if (year === currentYear) {
          const val = Number(curr.valor_pago) || 0
          if (curr.origem === 'missao') acc.missao += val
          if (curr.origem === 'fixa') acc.fixa += val
        }
      }
      return acc
    }, { missao: 0, fixa: 0 })
  }, [data, currentYear])

  // --- Contagens Dinâmicas ---
  const countDisplay = useMemo(() => {
    if (filterOrigem === 'missao') {
      const uniqueIds = new Set(filteredData.filter(i => i.id_missao).map(i => i.id_missao))
      return uniqueIds.size > 0 ? uniqueIds.size : filteredData.length
    }
    if (filterOrigem === 'fixa') {
      return filteredData.length
    }
    return 0
  }, [filteredData, filterOrigem])

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

  const handleFaturaClick = (group: any) => {
    setSelectedItem(group)
    setSelectedGroup(group._items || [])
    setIsViewModalOpen(true)
  }

  const handleMissionClick = (missionName: string) => {
    setSearchTerm(missionName)
    setFilterOrigem('missao')
    setActiveTab('dados')
    
    // Scroll para o topo após mudança de estado
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' })
    })
  }

  const handleSaveLancamento = async (formData: Partial<AeronaveLancamento>) => {
    if (formData.id) {
      const { error } = await supabase
        .from('aeronave_lancamentos')
        .update(formData)
        .eq('id', formData.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('aeronave_lancamentos')
        .insert(formData)
      if (error) throw error
    }
  }

  const handleExportExcel = () => {
    const dataToExport = filteredData.map(item => {
      const formattedDate = item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : ''
      const formattedID = item.id ? String(item.id).padStart(7, '0') : ''

      return {
        'ID': formattedID,
        'Origem': item.origem === 'missao' ? 'Missão' : 'Fixa',
        'Tripulação': item.tripulacao || '',
        'Aeronave': item.aeronave || '',
        'Data Missão': item.data_missao ? new Date(item.data_missao).toLocaleDateString('pt-BR') : '',
        'ID Missão': item.id_missao || '',
        'Nome Missão': item.nome_missao || '',
        'Despesa': item.despesa || '',
        'Tipo': item.tipo || '',
        'Descrição': item.descricao || '',
        'Fornecedor': item.fornecedor || '',
        'Vencimento': item.vencimento ? new Date(item.vencimento).toLocaleDateString('pt-BR') : '',
        'Valor Previsto': item.valor_previsto || 0,
        'Data Pagamento': item.data_pagamento ? new Date(item.data_pagamento).toLocaleDateString('pt-BR') : '',
        'Valor Pago': item.valor_pago || 0,
        'Centro de Custo': item.centro_custo || '',
        'Doc Fiscal': item.doc_fiscal || '',
        'Número Doc': item.numero_doc || '',
        'Valor Total Doc': item.valor_total_doc || 0,
        'Observação': item.observacao || '',
        'Criado em': formattedDate
      }
    })

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Lancamentos")
    XLSX.writeFile(wb, `Aeronave_Export_${new Date().toISOString().split('T')[0]}.xlsx`)
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

      const parseDate = (val: any): string | null => {
        if (!val) return null
        
        // Se for Date do Excel (objeto)
        if (val instanceof Date) {
          return val.toISOString().split('T')[0]
        }
        
        // Se for número (serial date do Excel)
        if (typeof val === 'number') {
          const date = new Date(Math.round((val - 25569) * 86400 * 1000))
          return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]
        }
        
        // Se for string
        if (typeof val === 'string') {
          const clean = val.trim().toUpperCase()
          if (['N/A', '-', 'NAN', 'UNDEFINED', ''].includes(clean)) return null
          
          // Formato ISO (YYYY-MM-DD HH:MM:SS ou YYYY-MM-DD)
          if (val.includes('-')) {
            const dateOnly = val.split(' ')[0] // Pega só a parte da data
            const parsed = new Date(dateOnly)
            return isNaN(parsed.getTime()) ? null : dateOnly
          }
          
          // Formato brasileiro (DD/MM/YYYY)
          if (val.includes('/')) {
            const parts = val.split('/')
            if (parts.length !== 3) return null
            const [d, m, a] = parts
            const anoFull = a.length === 2 ? `20${a}` : a
            return `${anoFull}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
          }
        }
        
        return null
      }

      const parseMoney = (val: any): number => {
        // Se já for número, retorna direto
        if (typeof val === 'number') return val
        
        // Se for null/undefined/vazio
        if (!val || val === '') return 0
        
        // Converte para string e limpa
        const str = String(val).trim()
        if (str === '' || str.toUpperCase() === 'N/A') return 0
        
        // Remove símbolos de moeda e formata
        const cleaned = str
          .replace('R$', '')
          .replace(/\s/g, '')
          .replace(/\./g, '') // Remove pontos de milhar
          .replace(',', '.') // Troca vírgula decimal por ponto
          .trim()
        
        const number = parseFloat(cleaned)
        return isNaN(number) ? 0 : number
      }

      const findVal = (row: any, keys: string[]) => {
        const key = Object.keys(row).find(k => keys.includes(k.trim().toLowerCase()))
        return key ? row[key] : null
      }

      const mappedData = rawData.map((row: any) => {
        const idMissaoRaw = findVal(row, ['id', 'id missao', 'id_missao'])
        const idMissao = idMissaoRaw && !isNaN(parseInt(idMissaoRaw)) ? parseInt(idMissaoRaw) : null
        const isMissao = !!idMissao

        return {
          origem: isMissao ? 'missao' : 'fixa',
          tripulacao: findVal(row, ['tripulação', 'tripulacao'])?.toString() || null,
          aeronave: findVal(row, ['aeronave'])?.toString() || 'Comercial',
          data_missao: parseDate(findVal(row, ['data', 'data_voos', 'data missao', 'data_missao'])),
          id_missao: idMissao,
          nome_missao: findVal(row, ['missao', 'missão', 'nome_missao', 'nome missao', 'misao'])?.toString() || null,
          despesa: findVal(row, ['despesa'])?.toString() || (isMissao ? 'Custo Missões' : 'Despesa Fixa'),
          tipo: findVal(row, ['tipo'])?.toString() || 'Outros',
          descricao: findVal(row, ['descricao', 'descrição'])?.toString() || '',
          fornecedor: findVal(row, ['fornecedor'])?.toString() || '',
          faturado_cnpj: parseMoney(findVal(row, ['faturado cnpj salomão', 'faturado cnpj'])),
          vencimento: parseDate(findVal(row, ['vencimento'])),
          valor_previsto: parseMoney(findVal(row, ['valor previsto', 'previsto'])),
          data_pagamento: parseDate(findVal(row, ['pagamento', 'data pagamento', 'data_pagamento'])),
          valor_pago: parseMoney(findVal(row, ['valor pago', 'valor_pago', 'pago'])),
          observacao: findVal(row, ['observação', 'observacao', 'obs'])?.toString() || '',
          centro_custo: findVal(row, ['centro_custo', 'centro custo', 'centro de custo'])?.toString() || '',
          doc_fiscal: findVal(row, ['doc fiscal', 'doc_fiscal'])?.toString() || null,
          numero_doc: findVal(row, ['numero', 'número', 'numero_doc'])?.toString() || null,
          valor_total_doc: parseMoney(findVal(row, ['valor total doc', 'total doc']))
        }
      })

      const { error } = await supabase.from('aeronave_lancamentos').insert(mappedData)
      if (error) {
        alert(`Erro na importação: ${error.message}`)
      } else {
        alert(`${mappedData.length} registros importados com sucesso!`)
        fetchDados()
      }
    } catch (err) {
      alert('Erro crítico ao processar arquivo.')
    } finally {
      setIsImporting(false)
      if (e.target) e.target.value = ''
    }
  }
  reader.readAsBinaryString(file)
}

  return (
    <div ref={topRef} className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <Plane className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Gestão da Aeronave</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Controle Unificado</p>
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
      {activeTab === 'comparativo' ? (
        // Cards do Comparativo
        <ComparativoCards data={filteredData} />
      ) : (
        // Cards Normais (Dashboard, Faturas, Dados)
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-indigo-600"></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {filterOrigem === 'missao' ? 'Quantidade de Missões' :
                 filterOrigem === 'fixa' ? 'Quantidade de lançamentos' : 
                 'Total Geral'}
              </p>
              <p className="text-2xl font-black text-indigo-900 mt-1">
                {filterOrigem === 'missao' ? countDisplay :
                 filterOrigem === 'fixa' ? countDisplay :
                 handleFormatCurrency(totals.totalGeral)}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Wallet className="h-6 w-6 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {filterOrigem === 'fixa' ? `Total gasto no ano (${currentYear})` : 'Custo Missões'}
              </p>
              <p className="text-2xl font-black text-blue-900 mt-1">
                {filterOrigem === 'fixa' ? handleFormatCurrency(yearTotals.missao) : handleFormatCurrency(totals.custoMissoes)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-emerald-600"></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {filterOrigem === 'missao' ? `Total gasto no ano (${currentYear})` : 'Despesas Fixas'}
              </p>
              <p className="text-2xl font-black text-emerald-900 mt-1">
                {filterOrigem === 'missao' ? handleFormatCurrency(yearTotals.fixa) : handleFormatCurrency(totals.despesasFixas)}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>

          {/* Card Cinza para Agência/Passagem */}
          <div className="bg-gray-100 p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-gray-400"></div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Agência / Passagem
              </p>
              <p className="text-2xl font-black text-gray-700 mt-1">
                {handleFormatCurrency(totalAgenciaPassagem)}
              </p>
            </div>
            <div className="p-3 bg-gray-200 rounded-xl">
              <Plane className="h-6 w-6 text-gray-500" />
            </div>
          </div>
        </div>
      )}

      {/* 3. Toolbar Principal */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-2 bg-gray-100/50 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('dashboard')
                setFilterOrigem('todos')
                setSearchTerm('')
                setStartDate('')
                setEndDate('')
                setFilterCentroCusto('todos')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'dashboard' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab('comparativo')
                setSearchTerm('')
                setStartDate('')
                setEndDate('')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'comparativo' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" /> Comparativo
            </button>
            <button
              onClick={() => setActiveTab('faturas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'faturas' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Faturas
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

          {/* Esconder botões nas abas Faturas e Comparativo */}
          {activeTab !== 'faturas' && activeTab !== 'comparativo' && (
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
          )}

          {/* Filtro de Centro de Custo para Comparativo */}
          {activeTab === 'comparativo' && (
            <div className="flex flex-col gap-1 min-w-[200px]">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Centro de Custo
              </span>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                <Building2 className="h-4 w-4 text-gray-400" />
                <select
                  value={filterCentroCusto}
                  onChange={(e) => setFilterCentroCusto(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-700 outline-none bg-transparent border-none focus:ring-0 cursor-pointer"
                >
                  <option value="todos">Todos os Centros</option>
                  {centrosCusto.map(cc => (
                    <option key={cc} value={cc}>{cc}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Esconder filtro de data na aba Comparativo */}
          {activeTab !== 'comparativo' && (
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                {activeTab === 'dashboard' ? 'Período de Missões' : 'Período de Pagamento'}
              </span>
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
          )}
        </div>

        {activeTab === 'dados' && (
          <>
            <div className="h-px bg-gray-100 w-full my-2"></div>
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
          </>
        )}
      </div>

      {/* 4. Área de Conteúdo */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        {activeTab === 'dashboard' ? (
          <AeronaveDashboard 
            data={filteredData} 
            onMissionClick={handleMissionClick}
            filterOrigem={filterOrigem}
          />
        ) : activeTab === 'comparativo' ? (
          <AeronaveComparativoComercialParticular data={filteredData} />
        ) : activeTab === 'faturas' ? (
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <table className="w-full text-left border-separate border-spacing-y-2 px-4 table-fixed">
              <thead>
                <tr className="text-[#112240]">
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest w-[15%]">Doc. Fiscal</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest w-[15%]">Número</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest w-[20%] text-right">Valor Total Doc</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest w-[50%]">Observação</th>
                </tr>
              </thead>
              <tbody>
                {faturasAgrupadas.length > 0 ? (
                  faturasAgrupadas.map((group, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => handleFaturaClick(group)}
                      className="group bg-white hover:bg-blue-50/40 border border-gray-100 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
                    >
                      <td className="px-4 py-4 text-sm font-semibold text-[#1e3a8a] first:rounded-l-xl whitespace-nowrap overflow-hidden text-ellipsis">
                        {group.doc_fiscal}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
                        {group.numero_doc || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm font-black text-gray-800 text-right whitespace-nowrap">
                        {group.valor_total_doc && group.valor_total_doc > 0 ? (
                          handleFormatCurrency(group.valor_total_doc)
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 last:rounded-r-xl overflow-hidden text-ellipsis" title={group.observacao || ''}>
                        {group.observacao || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-300 gap-2">
                        <FileText className="h-8 w-8" />
                        <p className="text-xs font-bold uppercase tracking-widest">Nenhuma fatura encontrada</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedItem(null)
        }}
        origem={selectedOrigemForNew}
        initialData={selectedItem}
        onSave={handleSaveLancamento}
        onSuccess={fetchDados}
      />

      <AeronaveViewModal 
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedItem(null)
          setSelectedGroup([])
        }}
        item={selectedItem}
        itemsGroup={selectedGroup}
        onEdit={(item) => {
          setIsViewModalOpen(false)
          setSelectedItem(item)
          setSelectedOrigemForNew(item.origem)
          setIsFormModalOpen(true)
        }}
        onDelete={() => {
          setIsViewModalOpen(false)
          setSelectedItem(null)
          fetchDados()
        }}
      />

    </div>
  )
}
