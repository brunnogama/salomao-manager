import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Upload, FileSpreadsheet, RefreshCw, Trash2, 
  BarChart3, Users, Briefcase,
  Pencil, Plus, X, Search, Filter as FilterIcon
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
  // Agora armazena as datas (strings formatadas) para cada dia da semana
  // Ex: { 1: ['02/12/24', '09/12/24'], ... } (1 = Segunda)
  diasSemanaDetalhado: { [key: number]: string[] };
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
  const [viewMode, setViewMode] = useState<'report' | 'socios'>('report')
  
  // Inicializa com o mês atual
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isInitialLoad, setIsInitialLoad] = useState(true)

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

  // --- 1. BUSCAR MÊS MAIS RECENTE ---
  const fetchInitialMonth = async () => {
      const { data } = await supabase
          .from('presenca_portaria')
          .select('data_hora')
          .order('data_hora', { ascending: false })
          .limit(1)
      
      if (data && data.length > 0) {
          const lastDate = new Date(data[0].data_hora)
          setSelectedMonth(lastDate.getUTCMonth())
          setSelectedYear(lastDate.getUTCFullYear())
      }
      setIsInitialLoad(false)
  }

  // --- 2. BUSCAR DADOS ---
  const fetchRecords = async () => {
    if (isInitialLoad) return; 

    setLoading(true)
    
    // Define intervalo cobrindo todo o mês em UTC (00:00:00 dia 1 até 23:59:59 ultimo dia)
    const startObj = new Date(Date.UTC(selectedYear, selectedMonth, 1, 0, 0, 0))
    const endObj = new Date(Date.UTC(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999))
    
    const startDate = startObj.toISOString()
    const endDate = endObj.toISOString()

    // Busca Presença do Mês Selecionado (Limite 100k para garantir tudo)
    const { data: presenceData } = await supabase
      .from('presenca_portaria')
      .select('*')
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)
      .order('data_hora', { ascending: true }) 
      .limit(100000) 

    // Busca Regras de Sócios
    const { data: rulesData } = await supabase
      .from('socios_regras')
      .select('*')
      .order('nome_colaborador', { ascending: true })
      .limit(3000)

    if (rulesData) setSocioRules(rulesData)

    if (presenceData) {
        setRecords(presenceData)
    } else {
        setRecords([])
    }
    
    setLoading(false)
  }

  useEffect(() => {
      fetchInitialMonth()
  }, [])

  useEffect(() => {
    if (!isInitialLoad) {
        fetchRecords()
    }
  }, [selectedMonth, selectedYear, isInitialLoad])

  useEffect(() => {
      if (showSearch && searchInputRef.current) {
          searchInputRef.current.focus()
      }
  }, [showSearch])

  // --- MAPA E LISTAS PARA FILTROS ---
  const socioMap = useMemo(() => {
      const map = new Map<string, string>()
      socioRules.forEach(rule => {
          map.set(normalizeKey(rule.nome_colaborador), rule.socio_responsavel)
      })
      return map
  }, [socioRules])

  const uniqueSocios = useMemo(() => {
      const socios = new Set(socioRules.map(r => toTitleCase(r.socio_responsavel)).filter(s => s !== 'Não Definido' && s !== ''))
      return Array.from(socios).sort()
  }, [socioRules])

  const uniqueColaboradores = useMemo(() => {
      let rules = socioRules;
      if (filterSocio) {
          rules = rules.filter(r => toTitleCase(r.socio_responsavel) === filterSocio)
      }
      return Array.from(new Set(rules.map(r => toTitleCase(r.nome_colaborador)))).sort()
  }, [socioRules, filterSocio])

  // --- FILTRAGEM CENTRALIZADA ---
  const filteredData = useMemo(() => {
      const filteredRecords = records.filter(record => {
          const dateObj = new Date(record.data_hora)
          const recordMonth = dateObj.getUTCMonth()
          const recordYear = dateObj.getUTCFullYear()
          
          if (recordMonth !== selectedMonth || recordYear !== selectedYear) return false

          const normName = normalizeKey(record.nome_colaborador)
          const socioRaw = socioMap.get(normName) || '-'
          const socioFormatted = toTitleCase(socioRaw)
          const nameFormatted = toTitleCase(record.nome_colaborador)

          if (filterSocio && socioFormatted !== filterSocio) return false
          if (filterColaborador && nameFormatted !== filterColaborador) return false

          if (searchText) {
              const lowerSearch = searchText.toLowerCase()
              const matchesName = record.nome_colaborador.toLowerCase().includes(lowerSearch)
              const matchesSocio = socioRaw.toLowerCase().includes(lowerSearch)
              if (!matchesName && !matchesSocio) return false
          }

          return true
      })

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
    // Agrupamento: Nome -> { dados }
    const grouped: { 
        [key: string]: { 
            originalName: string, 
            uniqueDays: Set<string>, 
            weekDaysDetail: { [key: number]: string[] } 
        } 
    } = {}

    filteredData.filteredRecords.forEach(record => {
      const dateObj = new Date(record.data_hora)
      const normalizedName = normalizeKey(record.nome_colaborador)
      const displayName = toTitleCase(record.nome_colaborador)
      
      // Chave única do dia (YYYY-MM-DD) para contagem
      const dayKey = dateObj.toISOString().split('T')[0] 
      
      // Dia da semana (0=Dom, 1=Seg...)
      const weekDay = dateObj.getUTCDay()
      
      // Data formatada para exibição no tooltip (DD/MM/AA)
      const displayDate = `${String(dateObj.getUTCDate()).padStart(2, '0')}/${String(dateObj.getUTCMonth()+1).padStart(2, '0')}/${String(dateObj.getUTCFullYear()).slice(-2)}`;

      if (!grouped[normalizedName]) {
          grouped[normalizedName] = { 
              originalName: displayName, 
              uniqueDays: new Set(), 
              weekDaysDetail: {} 
          }
      }
      
      // Se este dia ainda não foi computado para esta pessoa
      if (!grouped[normalizedName].uniqueDays.has(dayKey)) {
        grouped[normalizedName].uniqueDays.add(dayKey)
        
        // Adiciona ao detalhamento da semana
        if (!grouped[normalizedName].weekDaysDetail[weekDay]) {
            grouped[normalizedName].weekDaysDetail[weekDay] = []
        }
        grouped[normalizedName].weekDaysDetail[weekDay].push(displayDate)
      }
    })

    const result: ReportItem[] = Object.keys(grouped).map(key => {
      const item = grouped[key]
      const socioRaw = socioMap.get(key) || '-'
      const socioFormatted = toTitleCase(socioRaw)

      // Ordena as datas dentro de cada dia da semana para ficar bonito no tooltip
      Object.keys(item.weekDaysDetail).forEach(wd => {
          item.weekDaysDetail[Number(wd)].sort();
      });

      return { 
          nome: item.originalName, 
          socio: socioFormatted, 
          diasPresentes: item.uniqueDays.size, 
          diasSemanaDetalhado: item.weekDaysDetail,
          datas: [] // Campo mantido na interface mas não usado na UI nova
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
        
        const rawRecords = data.map((row: any) => {
          let nome = findValue(row, ['nome', 'colaborador', 'funcionario']) || 'Desconhecido'
          if (typeof nome === 'string') nome = nome.trim()
          
          const tempoRaw = findValue(row, ['tempo', 'data', 'horario'])
          let dataFinal: Date | null = null
          
          // PARSING MANUAL COM SUPORTE A DD/MM/AAAA
          if (typeof tempoRaw === 'string') {
               const datePart = tempoRaw.trim()
               
               // Tenta DD/MM/YYYY primeiro
               if (datePart.includes('/')) {
                   const parts = datePart.split('/')
                   if (parts.length === 3) {
                       const d = parseInt(parts[0])
                       const m = parseInt(parts[1]) - 1 
                       const y = parseInt(parts[2])
                       // Cria UTC 12:00 para evitar problemas de fuso
                       if(d > 0 && d <= 31 && m >= 0 && m <= 11 && y > 2000) {
                           dataFinal = new Date(Date.UTC(y, m, d, 12, 0, 0))
                       }
                   }
               }
               // Tenta YYYY-MM-DD
               else if (datePart.includes('-')) {
                   const parts = datePart.split('-')
                   if (parts.length === 3) {
                       const y = parseInt(parts[0])
                       const m = parseInt(parts[1]) - 1
                       const d = parseInt(parts[2])
                       if(d > 0 && d <= 31 && m >= 0 && m <= 11 && y > 2000) {
                           dataFinal = new Date(Date.UTC(y, m, d, 12, 0, 0))
                       }
                   }
               }
               
               // Se falhou, tenta Date() nativo mas ajusta para UTC
               if (!dataFinal) {
                   const tryDate = new Date(tempoRaw)
                   if (!isNaN(tryDate.getTime())) {
                       // Pega os componentes locais e cria UTC
                       dataFinal = new Date(Date.UTC(tryDate.getFullYear(), tryDate.getMonth(), tryDate.getDate(), 12, 0, 0))
                   }
               }
          }
          else if (typeof tempoRaw === 'number') {
               // Excel serial date (dias desde 1900)
               const dateObj = new Date((tempoRaw - 25569) * 86400 * 1000)
               dataFinal = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 12, 0, 0))
          }

          if (!dataFinal || isNaN(dataFinal.getTime())) return null;
          
          return { nome_colaborador: nome, data_hora: dataFinal, arquivo_origem: file.name }
        }).filter((r:any) => r && r.nome_colaborador !== 'Desconhecido')

        // DEDUPLICAÇÃO
        const uniqueSet = new Set();
        const existingSignatures = new Set(records.map(r => {
             const d = new Date(r.data_hora);
             const dateStr = d.toISOString().split('T')[0]; 
             return `${normalizeKey(r.nome_colaborador)}_${dateStr}`
        }));

        const recordsToInsert = rawRecords.filter((r: any) => {
            const d = r.data_hora;
            const dateStr = d.toISOString().split('T')[0]; 
            const key = `${normalizeKey(r.nome_colaborador)}_${dateStr}`;
            
            if (uniqueSet.has(key)) return false;
            if (existingSignatures.has(key)) return false;

            uniqueSet.add(key);
            return true;
        });

        const BATCH_SIZE = 1000; 
        const total = Math.ceil(recordsToInsert.length / BATCH_SIZE)
        
        for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
            const batch = recordsToInsert.slice(i, i + BATCH_SIZE).map(r => ({
                nome_colaborador: r.nome_colaborador,
                data_hora: r.data_hora.toISOString(),
                arquivo_origem: file.name
            }))
            
            await supabase.from('presenca_portaria').insert(batch)
            setProgress(Math.round(((i / BATCH_SIZE) + 1) / total * 100))
        }
        
        const skipped = rawRecords.length - recordsToInsert.length;
        alert(`${recordsToInsert.length} registros novos importados! (${skipped} duplicados/ignorados)`); 
        
        if (recordsToInsert.length > 0) {
            const firstDate = new Date(recordsToInsert[0].data_hora)
            setSelectedMonth(firstDate.getUTCMonth())
            setSelectedYear(firstDate.getUTCFullYear())
        } else {
            fetchRecords()
        }

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

                {/* FILTRO DE MÊS (APARECE APENAS EM REPORT) */}
                {viewMode === 'report' && (
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
                                <th className="px-4 py-2 border-b">Colaborador</th>
                                <th className="px-4 py-2 border-b">Sócio</th> 
                                <th className="px-4 py-2 border-b w-32">Frequência</th>
                                <th className="px-4 py-2 border-b">Semana</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reportData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/50">
                                    <td className="px-4 py-2 font-medium text-[#112240] text-sm whitespace-nowrap">{item.nome}</td>
                                    <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">
                                        {item.socio !== '-' ? <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200">{item.socio}</span> : <span className="text-red-400 text-xs italic bg-red-50 px-1.5 py-0.5 rounded">Sem Sócio</span>}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-[#112240] w-6">{item.diasPresentes}d</span>
                                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${item.diasPresentes >= 20 ? 'bg-green-500' : item.diasPresentes >= 10 ? 'bg-blue-500' : 'bg-yellow-500'}`} 
                                                    style={{ width: `${Math.min((item.diasPresentes / 22) * 100, 100)}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(weekDay => {
                                                const dayName = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'][weekDay - 1];
                                                const count = item.diasSemanaDetalhado[weekDay]?.length || 0;
                                                const dates = item.diasSemanaDetalhado[weekDay]?.join(', ') || 'Nenhum dia';
                                                
                                                return (
                                                    <div 
                                                        key={weekDay} 
                                                        title={dates}
                                                        className={`cursor-help text-[10px] px-2 py-0.5 rounded border ${count > 0 ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-gray-50 border-gray-100 text-gray-300'}`}
                                                    >
                                                        {dayName} {count > 0 && `(${count})`}
                                                    </div>
                                                )
                                            })}
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
                            <th className="px-4 py-2 border-b">Colaborador</th>
                            <th className="px-4 py-2 border-b">Sócio Responsável</th>
                            <th className="px-4 py-2 border-b">Meta</th>
                            <th className="px-4 py-2 border-b text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.filteredRules.map((rule) => (
                            <tr key={rule.id} className="hover:bg-gray-50 text-sm text-gray-700 group">
                                <td className="px-4 py-2 font-medium text-[#112240]">{toTitleCase(rule.nome_colaborador)}</td>
                                <td className="px-4 py-2">{toTitleCase(rule.socio_responsavel)}</td>
                                <td className="px-4 py-2"><span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-medium">{rule.meta_semanal}x</span></td>
                                <td className="px-4 py-2 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(rule)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-4 w-4" /></button>
                                        <button onClick={() => handleDeleteRule(rule.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                 )}
             </div>
        )}
      </div>
    </div>
  )
}
