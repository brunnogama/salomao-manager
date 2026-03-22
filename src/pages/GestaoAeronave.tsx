import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Plane,
  Plus,
  Download,
  Upload,
  Calendar,
  XCircle,
  LayoutDashboard,
  Table2,
  Wallet,
  Receipt,
  DollarSign,
  Loader2,
  FileText,
  TrendingUp,
  TrendingDown,
  Building2
} from 'lucide-react'
import { FilterBar, FilterCategory } from '../components/collaborators/components/FilterBar'
import XLSX from 'xlsx-js-style'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/logger'

// Tipos
import { AeronaveLancamento } from '../types/AeronaveTypes'

// Componentes
import { AeronaveTable } from '../components/AeronaveTable'
import { AeronaveDashboard } from '../components/AeronaveDashboard'
import { AeronaveFormModal } from '../components/AeronaveFormModal'
import { AeronaveViewModal } from '../components/AeronaveViewModal'

import { AeronaveComparativoComercialParticular } from '../components/AeronaveComparativoComercialParticular'
import { ConfirmationModal } from '../components/ui/ConfirmationModal'

// Componente de Cards do Comparativo
function ComparativoCards({ data }: { data: AeronaveLancamento[] }) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const { mediaMensalComercial, mediaMensalParticular } = useMemo(() => {
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
        economia: Math.abs(mediaComercial - mediaParticular),
        percentual: Math.abs(percentual)
      }
    }
  }, [data])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
        <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Voos Comerciais (média/mês)</p>
          <p className="text-2xl font-black text-blue-900 mt-1">{formatCurrency(mediaMensalComercial)}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl">
          <Building2 className="h-6 w-6 text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
        <div className="absolute right-0 top-0 h-full w-1 bg-emerald-600"></div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aeronave Particular (média/mês)</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{formatCurrency(mediaMensalParticular)}</p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-xl">
          <Plane className="h-6 w-6 text-emerald-600" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
        <div className={`absolute right-0 top-0 h-full w-1 ${mediaMensalComercial - mediaMensalParticular > 0 ? 'bg-green-600' : 'bg-amber-600'}`}></div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {mediaMensalComercial - mediaMensalParticular > 0 ? 'Economia (média/mês)' : 'Custo Adicional (média/mês)'}
          </p>
          <p className={`text-2xl font-black mt-1 ${mediaMensalComercial - mediaMensalParticular > 0 ? 'text-green-900' : 'text-amber-900'}`}>
            {formatCurrency(Math.abs(mediaMensalComercial - mediaMensalParticular))}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${mediaMensalComercial - mediaMensalParticular > 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
          {mediaMensalComercial - mediaMensalParticular > 0 ? <TrendingDown className="h-6 w-6 text-green-600" /> : <TrendingUp className="h-6 w-6 text-amber-600" />}
        </div>
      </div>
    </div>
  )
}



export function GestaoAeronave() {
  // --- Estados de Controle ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'comparativo' | 'faturas' | 'dados'>('dashboard')
  const [filterOrigem, setFilterOrigem] = useState<'todos' | 'missao' | 'fixa'>('todos')

  // --- Estados de Dados e Filtros ---
  const [data, setData] = useState<AeronaveLancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [faturaSearchTerm, setFaturaSearchTerm] = useState('')
  const [filterDocFiscal, setFilterDocFiscal] = useState('todos')
  const [filterStatusFatura, setFilterStatusFatura] = useState<'todos' | 'pago' | 'pendente'>('todos')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  // --- Estados de Modais ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState<AeronaveLancamento | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<AeronaveLancamento[]>([])

  // --- Estado de Deleção ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<AeronaveLancamento | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
  // Lista de Centros de Custo removida pois não estava sendo usada na renderização


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



      // 2. Filtro de Texto (Busca)
      const searchString = searchTerm.toLowerCase()
      const matchSearch =
        (item.id_missao?.toString() || '').includes(searchString) ||
        (item.nome_missao || '').toLowerCase().includes(searchString) ||
        (item.fornecedor || '').toLowerCase().includes(searchString) ||
        (item.descricao || '').toLowerCase().includes(searchString) ||
        (item.despesa || '').toLowerCase().includes(searchString)

      if (searchTerm && !matchSearch) return false

      // 3. Filtro de Data (ALTERADO: usa data_pagamento para Dados/Comparativo/Faturas, data_missao para Dashboard)
      const dateRef = activeTab === 'dashboard' ? item.data_missao : item.data_pagamento
      if (startDate && dateRef && dateRef < startDate) return false
      if (endDate && dateRef && dateRef > endDate) return false

      return true
    })
  }, [data, filterOrigem, searchTerm, startDate, endDate, activeTab])

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

  // --- Tipos únicos de Doc Fiscal para filtro ---
  const docFiscalTypes = useMemo(() => {
    const types = new Set<string>()
    faturasAgrupadas.forEach(g => {
      if (g.doc_fiscal) types.add(g.doc_fiscal)
    })
    return Array.from(types).sort()
  }, [faturasAgrupadas])

  // --- Faturas filtradas por pesquisa, tipo e status ---
  const faturasFiltradas = useMemo(() => {
    let result = faturasAgrupadas
    if (filterDocFiscal !== 'todos') {
      result = result.filter(g => g.doc_fiscal === filterDocFiscal)
    }
    if (filterStatusFatura !== 'todos') {
      result = result.filter(g => {
        const items = (g as any)._items || [g]
        const allPaid = items.every((i: any) => i.data_pagamento)
        return filterStatusFatura === 'pago' ? allPaid : !allPaid
      })
    }
    if (faturaSearchTerm.trim()) {
      const term = faturaSearchTerm.toLowerCase()
      result = result.filter(g =>
        (g.doc_fiscal || '').toLowerCase().includes(term) ||
        (g.numero_doc || '').toLowerCase().includes(term) ||
        (g.observacao || '').toLowerCase().includes(term) ||
        (g.fornecedor || '').toLowerCase().includes(term)
      )
    }
    return result
  }, [faturasAgrupadas, filterDocFiscal, filterStatusFatura, faturaSearchTerm])

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

  const handleOpenNew = () => {
    setSelectedItem(null)
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
    // Limpa strings vazias e converte para null
    const cleanData = Object.entries(formData).reduce((acc, [key, value]) => {
      // Se o valor for string vazia, converte para null
      if (value === '' || value === undefined) {
        acc[key] = null
      } else {
        acc[key] = value
      }
      return acc
    }, {} as any)

    if (cleanData.id) {
      const { error } = await supabase
        .from('aeronave_lancamentos')
        .update(cleanData)
        .eq('id', cleanData.id)
      if (error) throw error
    } else {
      // Remover o ID se for uma inserção para garantir que o banco gere um novo UUID
      const { id, ...insertData } = cleanData
      const { error } = await supabase
        .from('aeronave_lancamentos')
        .insert([insertData])
      if (error) throw error
    }

    const isEdit = !!cleanData.id
    const action = isEdit ? 'EDITAR' : 'CRIAR'
    const msg = isEdit
      ? `Editou lançamento: ${cleanData.descricao || cleanData.nome_missao || 'Sem descrição'}`
      : `Criou lançamento: ${cleanData.descricao || cleanData.nome_missao || 'Sem descrição'}`

    await logAction(action, 'FINANCEIRO', msg, 'Patrimônio')
  }

  const handleDeleteLancamento = async () => {
    if (!itemToDelete) return

    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from('aeronave_lancamentos')
        .delete()
        .eq('id', itemToDelete.id)

      if (error) throw error

      await logAction('EXCLUIR', 'FINANCEIRO', `Excluiu lançamento: ${itemToDelete.descricao || itemToDelete.nome_missao || 'Sem descrição'}`, 'Patrimônio')

      setIsDeleteModalOpen(false)
      setItemToDelete(null)
      fetchDados()
    } catch (error) {
      console.error(error)
      alert('Erro ao excluir lançamento.')
    } finally {
      setIsDeleting(false)
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
          {/* Abas */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('dashboard')
                setFilterOrigem('todos')
                setSearchTerm('')
                setStartDate('')
                setEndDate('')
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'comparativo' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <TrendingUp className="h-3.5 w-3.5" /> Comparativo
            </button>
            <button
              onClick={() => setActiveTab('faturas')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'faturas' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <FileText className="h-3.5 w-3.5" /> Faturas
            </button>
            <button
              onClick={() => setActiveTab('dados')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dados' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Table2 className="h-3.5 w-3.5" /> Dados
            </button>
          </div>

          {/* Botões de ação */}
          {activeTab === 'dados' && (
            <>
              <button
                onClick={handleExportExcel}
                className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 hover:border-green-400 transition-all shadow-sm"
                title="Exportar Excel"
              >
                <Download className="h-4 w-4" />
              </button>
              <label
                className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 hover:border-blue-400 transition-all shadow-sm cursor-pointer"
                title="Importar Excel"
              >
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <input type="file" accept=".xlsx" className="hidden" onChange={handleImportExcel} disabled={isImporting} />
              </label>
            </>
          )}

          <button
            onClick={() => handleOpenNew()}
            className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30"
            title="Novo Lançamento"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 2. Cards Compactos + FilterBar */}
      {activeTab === 'comparativo' ? (
        <ComparativoCards data={filteredData} />
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          {/* Cards compactos à esquerda */}
          <div className="flex items-stretch gap-3 shrink-0">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="p-2 rounded-lg bg-indigo-50">
                <Wallet className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">
                  {filterOrigem === 'missao' ? 'Qtd. Missões' :
                    filterOrigem === 'fixa' ? 'Qtd. Lançamentos' :
                      'Total Geral'}
                </span>
                <span className="text-xl font-black text-indigo-900 leading-tight">
                  {filterOrigem === 'missao' ? countDisplay :
                    filterOrigem === 'fixa' ? countDisplay :
                      handleFormatCurrency(totals.totalGeral)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="p-2 rounded-lg bg-blue-50">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">
                  {filterOrigem === 'fixa' ? `Ano (${currentYear})` : 'Missões'}
                </span>
                <span className="text-xl font-black text-blue-900 leading-tight">
                  {filterOrigem === 'fixa' ? handleFormatCurrency(yearTotals.missao) : handleFormatCurrency(totals.custoMissoes)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="p-2 rounded-lg bg-emerald-50">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">
                  {filterOrigem === 'missao' ? `Ano (${currentYear})` : 'Despesas'}
                </span>
                <span className="text-xl font-black text-emerald-900 leading-tight">
                  {filterOrigem === 'missao' ? handleFormatCurrency(yearTotals.fixa) : handleFormatCurrency(totals.despesasFixas)}
                </span>
              </div>
            </div>
          </div>

          {/* FilterBar à direita */}
          <div className="flex-1">
            <FilterBar
              searchTerm={activeTab === 'faturas' ? faturaSearchTerm : searchTerm}
              onSearchChange={activeTab === 'faturas' ? setFaturaSearchTerm : setSearchTerm}
              categories={(() => {
                const cats: FilterCategory[] = []
                if (activeTab !== 'faturas') {
                  cats.push({
                    key: 'tipo_pagamento',
                    label: 'Tipo de Pagamento',
                    icon: Wallet,
                    type: 'single',
                    options: [
                      { value: 'todos', label: 'Todos' },
                      { value: 'missao', label: 'Missões' },
                      { value: 'fixa', label: 'Despesas' },
                    ],
                    value: filterOrigem === 'todos' ? '' : filterOrigem,
                    onChange: (val: string) => setFilterOrigem(val === '' ? 'todos' : val as any),
                  })
                }
                if (activeTab === 'faturas') {
                  cats.push({
                    key: 'doc_fiscal',
                    label: 'Doc. Fiscal',
                    icon: FileText,
                    type: 'single',
                    options: [{ value: 'todos', label: 'Todos' }, ...docFiscalTypes.map(t => ({ value: t, label: t }))],
                    value: filterDocFiscal === 'todos' ? '' : filterDocFiscal,
                    onChange: (val: string) => setFilterDocFiscal(val === '' ? 'todos' : val),
                  })
                  cats.push({
                    key: 'status_fatura',
                    label: 'Status',
                    icon: Receipt,
                    type: 'single',
                    options: [
                      { value: 'todos', label: 'Todos' },
                      { value: 'pago', label: 'Pago' },
                      { value: 'pendente', label: 'Pendente' },
                    ],
                    value: filterStatusFatura === 'todos' ? '' : filterStatusFatura,
                    onChange: (val: string) => setFilterStatusFatura(val === '' ? 'todos' : val as any),
                  })
                }
                return cats
              })()}
              activeFilterChips={(() => {
                const chips: { key: string; label: string; onClear: () => void }[] = []
                if (activeTab !== 'faturas' && filterOrigem !== 'todos') {
                  chips.push({
                    key: 'tipo_pagamento',
                    label: filterOrigem === 'missao' ? 'Missões' : 'Despesas',
                    onClear: () => setFilterOrigem('todos'),
                  })
                }
                if (activeTab === 'faturas' && filterDocFiscal !== 'todos') {
                  chips.push({ key: 'doc_fiscal', label: `Doc: ${filterDocFiscal}`, onClear: () => setFilterDocFiscal('todos') })
                }
                if (activeTab === 'faturas' && filterStatusFatura !== 'todos') {
                  chips.push({ key: 'status_fatura', label: filterStatusFatura === 'pago' ? 'Pago' : 'Pendente', onClear: () => setFilterStatusFatura('todos') })
                }
                if (startDate || endDate) {
                  const label = startDate && endDate ? `${startDate} → ${endDate}` : startDate ? `A partir de ${startDate}` : `Até ${endDate}`
                  chips.push({ key: 'periodo', label, onClear: () => { setStartDate(''); setEndDate('') } })
                }
                return chips
              })()}
              activeFilterCount={
                (activeTab !== 'faturas' && filterOrigem !== 'todos' ? 1 : 0) +
                (activeTab === 'faturas' && filterDocFiscal !== 'todos' ? 1 : 0) +
                (activeTab === 'faturas' && filterStatusFatura !== 'todos' ? 1 : 0) +
                (startDate || endDate ? 1 : 0)
              }
              onClearAll={() => {
                setFilterOrigem('todos')
                setFilterDocFiscal('todos')
                setFilterStatusFatura('todos')
                setStartDate('')
                setEndDate('')
              }}
              extraContent={
                <div className="px-4 py-3">
                  <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Período</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                      type="date"
                      className="text-xs font-semibold text-gray-700 outline-none bg-transparent flex-1"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="text-gray-300">→</span>
                    <input
                      type="date"
                      className="text-xs font-semibold text-gray-700 outline-none bg-transparent flex-1"
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
              }
            />
          </div>
        </div>
      )}

      {/* 4. Área de Conteúdo */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        {activeTab === 'dashboard' ? (
          <AeronaveDashboard
            data={filteredData}
            onMissionClick={handleMissionClick}
            filterOrigem={filterOrigem}
          />
        ) : activeTab === 'comparativo' ? (
          <div className="flex flex-col h-full">
            <AeronaveComparativoComercialParticular data={filteredData} />
          </div>
        ) : activeTab === 'faturas' ? (
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <table className="w-full text-left border-separate border-spacing-y-2 px-4 table-fixed">
              <thead className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-white tracking-widest w-[15%]">Doc. Fiscal</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-white tracking-widest w-[12%]">Número</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-white tracking-widest w-[15%] text-right">Valor Total Doc</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-white tracking-widest w-[13%] text-center">Data da Baixa</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-white tracking-widest w-[45%]">Observação</th>
                </tr>
              </thead>
              <tbody>
                {faturasFiltradas.length > 0 ? (
                  faturasFiltradas.map((group, idx) => {
                    const items = (group as any)._items || [group]
                    const allPaid = items.every((i: any) => i.data_pagamento)
                    const dataBaixa = allPaid
                      ? items.reduce((latest: string, i: any) => i.data_pagamento > latest ? i.data_pagamento : latest, items[0].data_pagamento)
                      : null

                    return (
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
                      <td className="px-4 py-4 text-sm text-center whitespace-nowrap">
                        {dataBaixa ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs">
                            {new Date(dataBaixa + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-600 font-bold text-[10px] uppercase tracking-wider">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 last:rounded-r-xl overflow-hidden text-ellipsis" title={group.observacao || ''}>
                        {group.observacao || '-'}
                      </td>
                    </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
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
            onEdit={(item) => {
              setSelectedItem(item)
              setIsFormModalOpen(true)
            }}
            onDelete={(item) => {
              setItemToDelete(item)
              setIsDeleteModalOpen(true)
            }}
          />
        )}
      </div>

      {/* 5. Modais */}
      <AeronaveFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedItem(null)
        }}
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
          setIsFormModalOpen(true)
        }}
        onDelete={() => {
          setIsViewModalOpen(false)
          setSelectedItem(null)
          fetchDados()
        }}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteLancamento}
        title="Excluir Lançamento"
        description={`Tem certeza que deseja excluir o lançamento "${itemToDelete?.descricao || itemToDelete?.nome_missao || 'Sem descrição'}"? Esta ação não pode ser desfeita.`}
        confirmText={isDeleting ? 'Excluindo...' : 'Excluir'}
        cancelText="Cancelar"
        variant="danger"
      />

    </div>
  )
}
