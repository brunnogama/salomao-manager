import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Upload, FileSpreadsheet, RefreshCw, Trash2, 
  LayoutList, BarChart3, Calendar, Users, Briefcase,
  Pencil, Plus, X, Save, Search, Filter as FilterIcon
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'

// --- TIPOS ---
interface PresenceRecord {
  id: string;
  nome_colaborador: string;
  data_hora: string;
}

interface SocioRule {
  id: string;
  socio_responsavel: string;
  nome_colaborador: string;
  meta_semanal: number;
}

interface ReportItem {
  nome: string;
  socio: string; 
  diasPresentes: number;
  diasSemana: { [key: string]: number };
}

export function Presencial() {
  // --- ESTADOS GERAIS ---
  const [records, setRecords] = useState<PresenceRecord[]>([])
  const [socioRules, setSocioRules] = useState<SocioRule[]>([]) 
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  // --- ESTADOS DE FILTRO ---
  const [filterSocio, setFilterSocio] = useState('')
  const [filterColaborador, setFilterColaborador] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchText, setSearchText] = useState('')

  // Estado para Edição/Criação de Regra
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Partial<SocioRule> | null>(null)

  // Refs
  const presenceInputRef = useRef<HTMLInputElement>(null)
  const socioInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // --- NAVEGAÇÃO ---
  const [viewMode, setViewMode] = useState<'list' | 'report' | 'socios'>('report')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // --- HELPER NORMALIZAÇÃO ---
  const normalizeKey = (text: string) => {
      if (!text) return ""
      return text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ")
  }

  // --- HELPER FORMATAÇÃO (CAMEL CASE / TITLE CASE) ---
  const toTitleCase = (text: string) => {
      if (!text) return ""
      return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }

  // --- 1. BUSCAR DADOS ---
  const fetchRecords = async () => {
    setLoading(true)
    
    // Busca Presença
    const { data: presenceData } = await supabase
      .from('presenca_portaria')
      .select('*')
      .order('data_hora', { ascending: false })
      .limit(10000)

    // Busca Regras de Sócios
    const { data: rulesData } = await supabase
      .from('socios_regras')
      .select('*')
      .order('nome_colaborador', { ascending: true })
      .limit(3000)

    if (rulesData) setSocioRules(rulesData)

    if (presenceData && presenceData.length > 0) {
        setRecords(presenceData)
        
        // --- AUTO-SELEÇÃO DE DATA RESTAURADA ---
        // Ajusta o filtro para o mês/ano do registro mais recente
        const lastDate = new Date(presenceData[0].data_hora)
        setSelectedMonth(lastDate.getMonth())
        setSelectedYear(lastDate.getFullYear())
    } else {
        setRecords([])
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  // --- EFEITO: FOCA NO INPUT DE BUSCA AO ABRIR ---
  useEffect(() => {
      if (showSearch && searchInputRef.current) {
          searchInputRef.current.focus()
      }
  }, [showSearch])

  // --- MAPA E LISTAS PARA FILTROS (MEMOIZED & FORMATTED) ---
  const socioMap = useMemo(() => {
      const map = new Map<string, string>()
      socioRules.forEach(rule => {
          map.set(normalizeKey(rule.nome_colaborador), rule.socio_responsavel)
      })
      return map
  }, [socioRules])

  const uniqueSocios = useMemo(() => {
      // Usa toTitleCase para formatar a lista
      const socios = new Set(socioRules.map(r => toTitleCase(r.socio_responsavel)).filter(s => s !== 'Não Definido' && s !== ''))
      return Array.from(socios).sort()
  }, [socioRules])

  const uniqueColaboradores = useMemo(() => {
      let rules = socioRules;
      if (filterSocio) {
          // Compara formatado com formatado
          rules = rules.filter(r => toTitleCase(r.socio_responsavel) === filterSocio)
      }
      return Array.from(new Set(rules.map(r => toTitleCase(r.nome_colaborador)))).sort()
  }, [socioRules, filterSocio])

  // --- FILTRAGEM CENTRALIZADA (APLICA A TUDO) ---
  const filteredData = useMemo(() => {
      // 1. Filtra registros de presença
      const filteredRecords = records.filter(record => {
          const dateObj = new Date(record.data_hora)
          
          // Filtro de Data
          if (dateObj.getMonth() !== selectedMonth || dateObj.getFullYear() !== selectedYear) return false

          const normName = normalizeKey(record.nome_colaborador)
          const socioRaw = socioMap.get(normName) || '-'
          
          // Formata para comparação com os filtros que estão em TitleCase
          const socioFormatted = toTitleCase(socioRaw)
          const nameFormatted = toTitleCase(record.nome_colaborador)

          // Filtro de Sócio
          if (filterSocio && socioFormatted !== filterSocio) return false
          
          // Filtro de Colaborador
          if (filterColaborador && nameFormatted !== filterColaborador) return false

          // Pesquisa Livre
          if (searchText) {
              const lowerSearch = searchText.toLowerCase()
              const matchesName = record.nome_colaborador.toLowerCase().includes(lowerSearch)
              const matchesSocio = socioRaw.toLowerCase().includes(lowerSearch)
              if (!matchesName && !matchesSocio) return false
          }

          return true
      })

      // 2. Filtra regras de sócios (para a aba de Sócios)
      const filteredRules = socioRules.filter(rule => {
          const socioFormatted = toTitleCase(rule.socio_responsavel)
          const nameFormatted = toTitleCase(rule.nome_colaborador)

          if (filterSocio && socioFormatted !== filterSocio) return false
          if (filterColaborador && nameFormatted !== filterColaborador) return false
          
          if (searchText) {
              const lowerSearch = searchText.toLowerCase()
              return rule.nome_colaborador.toLowerCase().includes(lowerSearch) || 
                     rule.socio_responsavel.toLowerCase().includes(lowerSearch)
          }
          return true
      })

      return { filteredRecords, filteredRules }
  }, [records, socioRules, selectedMonth, selectedYear, filterSocio, filterColaborador, searchText, socioMap])


  // --- 2. LÓGICA DO RELATÓRIO ---
  const reportData = useMemo(() => {
    const grouped: { [key: string]: { originalName: string, uniqueDays: Set<string>, weekDays: { [key: number]: number } } } = {}

    // Usa filteredRecords em vez de records brutos
    filteredData.filteredRecords.forEach(record => {
      const dateObj = new Date(record.data_hora)
      const normalizedName = normalizeKey(record.nome_colaborador)
      
      // Usa TitleCase para exibição bonita
      const displayName = toTitleCase(record.nome_colaborador)
      
      const dayKey = dateObj.toLocaleDateString('pt-BR')
      const weekDay = dateObj.getDay()

      if (!grouped[normalizedName]) {
          grouped[normalizedName] = { 
              originalName: displayName, 
              uniqueDays: new Set(), 
              weekDays: {} 
          }
      }
      
      if (!grouped[normalizedName].uniqueDays.has(dayKey)) {
        grouped[normalizedName].uniqueDays.add(dayKey)
        grouped[normalizedName].weekDays[weekDay] = (grouped[normalizedName].weekDays[weekDay] || 0) + 1
      }
    })

    const result: ReportItem[] = Object.keys(grouped).map(key => {
      const item = grouped[key]
      const weekDaysMap: { [key: string]: number } = {}
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      Object.entries(item.weekDays).forEach(([i, count]) => weekDaysMap[days[Number(i)]] = count)
      
      const socioRaw = socioMap.get(key) || '-'
      const socioFormatted = toTitleCase(socioRaw)

      return { 
          nome: item.originalName, 
          socio: socioFormatted, 
          diasPresentes: item.uniqueDays.size, 
          diasSemana: weekDaysMap 
      }
    })
    
    return result.sort((a, b) => b.diasPresentes - a.diasPresentes)

  }, [filteredData.filteredRecords, socioMap])

  // --- UTILS EXCEL ---
  const findValue = (row: any, keys: string[]) => {
    const rowKeys = Object.keys(row)
    for (const searchKey of keys) {
        const foundKey = rowKeys.find(k => normalizeKey(k) === normalizeKey(searchKey))
        if (foundKey) return row[foundKey]
    }
    return null
  }

  // --- UPLOADS ---
  const handlePresenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setProgress(0);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        const recordsToInsert = data.map((row: any) => {
          let nome = findValue(row, ['nome', 'colaborador', 'funcionario']) || 'Desconhecido'
          if (typeof nome === 'string') nome = nome.trim()
          const tempoRaw = findValue(row, ['tempo', 'data', 'horario'])
          let dataFinal = new Date()
          if (typeof tempoRaw === 'string') dataFinal = new Date(tempoRaw)
          else if (typeof tempoRaw === 'number') dataFinal = new Date((tempoRaw - 25569) * 86400 * 1000)
          return { nome_colaborador: nome, data_hora: isNaN(dataFinal.getTime()) ? new Date() : dataFinal, arquivo_origem: file.name }
        }).filter((r:any) => r.nome_colaborador !== 'Desconhecido')
        const BATCH_SIZE = 100; const total = Math.ceil(recordsToInsert.length / BATCH_SIZE)
        for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
            await supabase.from('presenca_portaria').insert(recordsToInsert.slice(i, i + BATCH_SIZE))
            setProgress(Math.round(((i / BATCH_SIZE) + 1) / total * 100))
        }
        alert(`${recordsToInsert.length} registros importados!`); fetchRecords()
      } catch (err) { alert("Erro ao importar.") } 
      finally { setUploading(false); if (presenceInputRef.current) presenceInputRef.current.value = '' }
    }
    reader.readAsBinaryString(file)
  }

  const handleSocioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setProgress(0);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        const uniqueRules = new Map<string, any>();
        data.forEach((row: any) => {
          let socio = findValue(row, ['socio', 'sócio', 'responsavel', 'gestor', 'partner']) || 'Não Definido'
          let colab = findValue(row, ['nome', 'colaborador', 'funcionario']) || 'Desconhecido'
          if (typeof socio === 'string') socio = socio.trim()
          if (typeof colab === 'string') colab = colab.trim()
          if (colab === 'Desconhecido') return;
          const meta = findValue(row, ['meta', 'dias', 'regra']) || 3 
          const key = normalizeKey(colab);
          uniqueRules.set(key, { socio_responsavel: socio, nome_colaborador: colab, meta_semanal: Number(meta) || 3 })
        });
        const rulesToInsert = Array.from(uniqueRules.values());
        if(confirm(`Substituir base por ${rulesToInsert.length} registros?`)) {
            await supabase.from('socios_regras').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('socios_regras').insert(rulesToInsert)
            alert("Base atualizada!"); fetchRecords()
        }
      } catch (err) { console.error(err); alert("Erro ao importar.") } 
      finally { setUploading(false); if (socioInputRef.current) socioInputRef.current.value = '' }
    }
    reader.readAsBinaryString(file)
  }

  // --- CRUD ---
  const handleOpenModal = (rule?: SocioRule) => { setEditingRule(rule || { socio_responsavel: '', nome_colaborador: '', meta_semanal: 3 }); setIsModalOpen(true); }
  const handleSaveRule = async () => {
      if (!editingRule?.socio_responsavel || !editingRule?.nome_colaborador) return alert("Preencha campos.")
      setLoading(true)
      try {
          const payload = { socio_responsavel: editingRule.socio_responsavel.trim(), nome_colaborador: editingRule.nome_colaborador.trim(), meta_semanal: editingRule.meta_semanal || 3 }
          if (editingRule.id) await supabase.from('socios_regras').update(payload).eq('id', editingRule.id)
          else await supabase.from('socios_regras').insert(payload)
          setIsModalOpen(false); fetchRecords()
      } catch (err: any) { alert("Erro: " + err.message) } finally { setLoading(false) }
  }
  const handleDeleteRule = async (id: string) => { if (!confirm("Excluir?")) return; setLoading(true); await supabase.from('socios_regras').delete().eq('id', id); fetchRecords() }
  const handleClearData = async () => {
      if (viewMode === 'socios') { if (!confirm("Apagar REGRAS?")) return; await supabase.from('socios_regras').delete().neq('id', '00000000-0000-0000-0000-000000000000') } 
      else { if (!confirm("Apagar PRESENÇA?")) return; await supabase.from('presenca_portaria').delete().neq('id', '00000000-0000-0000-0000-000000000000') }
      fetchRecords()
  }

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="flex flex-col h-full bg-gray-100 space-y-6 relative">
      
      {/* MODAL */}
      {isModalOpen && editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
                <div className="bg-[#112240] px-6 py-4 flex justify-between items-center">
                    <h3 className="text-white font-bold">{editingRule.id ? 'Editar Regra' : 'Nova Regra'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5"/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
                        <input type="text" className="w-full border p-2 rounded" value={editingRule.nome_colaborador} onChange={e => setEditingRule({...editingRule, nome_colaborador: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sócio Responsável</label>
                        <input type="text" className="w-full border p-2 rounded" value={editingRule.socio_responsavel} onChange={e => setEditingRule({...editingRule, socio_responsavel: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Semanal</label>
                        <input type="number" className="w-full border p-2 rounded" value={editingRule.meta_semanal} onChange={e => setEditingRule({...editingRule, meta_semanal: Number(e.target.value)})} />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded hover:bg-gray-50">Cancelar</button>
                        <button onClick={handleSaveRule} className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-xl font-bold text-[#112240]">Controle de Presença</h2>
                <p className="text-sm text-gray-500">Gestão de acessos e regras de sócios.</p>
            </div>
            
            <div className="flex items-center gap-2">
                <input type="file" accept=".xlsx" ref={presenceInputRef} onChange={handlePresenceUpload} className="hidden" />
                <input type="file" accept=".xlsx" ref={socioInputRef} onChange={handleSocioUpload} className="hidden" />
                <button onClick={() => fetchRecords()} className="p-2 text-gray-400 hover:text-blue-600" title="Atualizar"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button>
                <button onClick={handleClearData} className="p-2 text-gray-400 hover:text-red-600" title="Limpar"><Trash2 className="h-5 w-5" /></button>
                
                {viewMode === 'socios' ? (
                    <div className="flex gap-2">
                         <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Novo</button>
                         <button onClick={() => socioInputRef.current?.click()} disabled={uploading} className="bg-[#112240] hover:bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">{uploading ? '...' : <><Users className="h-4 w-4" /> Importar</>}</button>
                    </div>
                ) : (
                    <button onClick={() => presenceInputRef.current?.click()} disabled={uploading} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">{uploading ? '...' : <><FileSpreadsheet className="h-4 w-4" /> Importar</>}</button>
                )}
            </div>
        </div>

        {/* BARRA DE FERRAMENTAS: FILTROS E VIEW */}
        <div className="flex flex-col lg:flex-row items-center justify-between border-t border-gray-100 pt-4 gap-4">
            
            {/* 1. SELETORES DE VISUALIZAÇÃO */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-full lg:w-auto overflow-x-auto">
                <button onClick={() => setViewMode('report')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'report' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><BarChart3 className="h-4 w-4" /> Relatório</button>
                <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'list' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><LayoutList className="h-4 w-4" /> Bruto</button>
                <button onClick={() => setViewMode('socios')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'socios' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Briefcase className="h-4 w-4" /> Regras</button>
            </div>

            {/* 2. ÁREA DE PESQUISA E FILTROS */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                
                {/* BOTÃO/CAMPO DE PESQUISA */}
                <div className={`flex items-center bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${showSearch ? 'w-full sm:w-64 px-2' : 'w-10 justify-center'}`}>
                    <button onClick={() => setShowSearch(!showSearch)} className="p-2 text-gray-400 hover:text-blue-600">
                        {showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                    </button>
                    {showSearch && (
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            placeholder="Buscar nome..." 
                            className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none text-gray-700"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    )}
                </div>

                {/* FILTROS DROPDOWN */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-40">
                        <FilterIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <select 
                            value={filterSocio} 
                            onChange={(e) => setFilterSocio(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg pl-8 p-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        >
                            <option value="">Todos Sócios</option>
                            {uniqueSocios.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="relative w-full sm:w-40">
                        <Users className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <select 
                            value={filterColaborador} 
                            onChange={(e) => setFilterColaborador(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg pl-8 p-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        >
                            <option value="">Todos Colab.</option>
                            {uniqueColaboradores.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* FILTRO DE DATA (APARECE EM REPORT E LIST) */}
                {(viewMode === 'report' || viewMode === 'list') && (
                    <div className="flex items-center gap-2 w-full sm:w-auto border-l pl-2 ml-2 border-gray-200">
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2">
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        
        {viewMode === 'report' && (
            <div className="flex-1 overflow-auto">
                {reportData.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400"><p>Sem dados correspondentes aos filtros.</p></div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 border-b">Colaborador</th>
                                <th className="px-6 py-4 border-b">Sócio Responsável</th> 
                                <th className="px-6 py-4 border-b w-64">Frequência Mensal</th>
                                <th className="px-6 py-4 border-b">Semana</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reportData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/50">
                                    <td className="px-6 py-4 font-medium text-[#112240] text-sm">{item.nome}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {item.socio !== '-' ? <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200 text-xs font-semibold">{item.socio}</span> : <span className="text-red-400 text-xs italic bg-red-50 px-2 py-1 rounded">Sem Sócio</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-baseline gap-1"><span className="text-lg font-bold text-[#112240]">{item.diasPresentes}</span><span className="text-xs text-gray-500">dias</span></div>
                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${item.diasPresentes >= 20 ? 'bg-green-500' : item.diasPresentes >= 10 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min((item.diasPresentes / 22) * 100, 100)}%` }} /></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map(day => (
                                                <div key={day} className={`text-xs px-2 py-1 rounded border ${item.diasSemana[day] ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>{day}{item.diasSemana[day] ? ` (${item.diasSemana[day]})` : ''}</div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        )}

        {viewMode === 'socios' && (
             <div className="flex-1 overflow-auto">
                 {filteredData.filteredRules.length === 0 ? (
                     <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                         <Users className="h-12 w-12 mb-3 opacity-20" />
                         <p>Nenhuma regra encontrada com os filtros atuais.</p>
                     </div>
                 ) : (
                    <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                        <tr>
                            <th className="px-6 py-4 border-b">Colaborador</th>
                            <th className="px-6 py-4 border-b">Sócio Responsável</th>
                            <th className="px-6 py-4 border-b">Meta</th>
                            <th className="px-6 py-4 border-b text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.filteredRules.map((rule) => (
                            <tr key={rule.id} className="hover:bg-gray-50 text-sm text-gray-700 group">
                                <td className="px-6 py-3 font-medium text-[#112240]">{toTitleCase(rule.nome_colaborador)}</td>
                                <td className="px-6 py-3">{toTitleCase(rule.socio_responsavel)}</td>
                                <td className="px-6 py-3"><span className="bg-gray-100 px-2 py-1 rounded border border-gray-200 font-medium">{rule.meta_semanal}x</span></td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(rule)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-4 w-4" /></button>
                                        <button onClick={() => handleDeleteRule(rule.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                 )}
             </div>
        )}

        {viewMode === 'list' && (
             <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                    <tr><th className="px-6 py-4 border-b">Nome</th><th className="px-6 py-4 border-b">Data</th><th className="px-6 py-4 border-b">Hora</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredData.filteredRecords.map((record) => {
                        const date = new Date(record.data_hora)
                        return (
                            <tr key={record.id} className="hover:bg-gray-50 text-sm text-gray-700">
                                <td className="px-6 py-3 font-medium">{toTitleCase(record.nome_colaborador)}</td>
                                <td className="px-6 py-3">{date.toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-3 text-gray-500 font-mono">{date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td>
                            </tr>
                        )
                    })}
                </tbody>
                </table>
             </div>
        )}
      </div>
    </div>
  )
}
