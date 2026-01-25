import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Upload, FileSpreadsheet, RefreshCw, Download,
  BarChart3, Users, Briefcase, FileText,
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
  diasSemana: { [key: string]: number };
  datas: string[];
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
  const [viewMode, setViewMode] = useState<'report' | 'descriptive' | 'socios'>('report')
  
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
    
    const startObj = new Date(Date.UTC(selectedYear, selectedMonth, 1, 0, 0, 0))
    const endObj = new Date(Date.UTC(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999))
    
    const startDate = startObj.toISOString()
    const endDate = endObj.toISOString()

    console.log('🔍 Buscando dados:', {
      mes: selectedMonth + 1,
      ano: selectedYear,
      inicio: startDate,
      fim: endDate
    });

    // Busca TODOS os registros do mês usando paginação
    let allPresenceData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: presenceData, error, count } = await supabase
        .from('presenca_portaria')
        .select('*', { count: 'exact' })
        .gte('data_hora', startDate)
        .lte('data_hora', endDate)
        .order('data_hora', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('Erro ao buscar presença:', error);
        break;
      }

      if (presenceData && presenceData.length > 0) {
        allPresenceData = [...allPresenceData, ...presenceData];
        console.log(`📄 Página ${Math.floor(from / pageSize) + 1}: ${presenceData.length} registros (Total acumulado: ${allPresenceData.length})`);
        
        if (presenceData.length < pageSize) {
          hasMore = false;
        } else {
          from += pageSize;
        }
      } else {
        hasMore = false;
      }
    }

    // Busca Regras de Sócios
    const { data: rulesData } = await supabase
      .from('socios_regras')
      .select('*')
      .order('nome_colaborador', { ascending: true })
      .limit(3000)

    if (rulesData) setSocioRules(rulesData)

    setRecords(allPresenceData)
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
    const grouped: { [key: string]: { originalName: string, uniqueDays: Set<string>, weekDays: { [key: number]: number }, datesSet: Set<string> } } = {}

    filteredData.filteredRecords.forEach(record => {
      const dateObj = new Date(record.data_hora)
      const normalizedName = normalizeKey(record.nome_colaborador)
      const displayName = toTitleCase(record.nome_colaborador)
      
      const year = dateObj.getUTCFullYear()
      const month = dateObj.getUTCMonth() + 1
      const day = dateObj.getUTCDate()
      
      const dayKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayNumber = String(day).padStart(2, '0')
      const weekDay = dateObj.getUTCDay()

      if (!grouped[normalizedName]) {
          grouped[normalizedName] = { 
              originalName: displayName, 
              uniqueDays: new Set(), 
              weekDays: {},
              datesSet: new Set()
          }
      }
      
      if (!grouped[normalizedName].uniqueDays.has(dayKey)) {
        grouped[normalizedName].uniqueDays.add(dayKey)
        grouped[normalizedName].datesSet.add(dayNumber)
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

      const sortedDates = Array.from(item.datesSet)
        .map(d => parseInt(d))
        .sort((a, b) => a - b)
        .map(d => String(d).padStart(2, '0'))

      return { 
          nome: item.originalName, 
          socio: socioFormatted, 
          diasPresentes: item.uniqueDays.size, 
          diasSemana: weekDaysMap,
          datas: sortedDates
      }
    })
    
    return result.sort((a, b) => b.diasPresentes - a.diasPresentes)

  }, [filteredData.filteredRecords, socioMap])

  // --- LÓGICA DO DESCRITIVO (NOVA) ---
  const descriptiveData = useMemo(() => {
    // Cria uma lista plana de registros para exibição
    return [...filteredData.filteredRecords].sort((a, b) => {
        // Ordena por Nome e depois por Data
        const nameA = toTitleCase(a.nome_colaborador);
        const nameB = toTitleCase(b.nome_colaborador);
        
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        
        // Se nomes iguais, ordena por data
        return new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime();
    });
  }, [filteredData.filteredRecords]);

  // --- UTILS EXCEL ---
  const findValue = (row: any, keys: string[]) => {
    const rowKeys = Object.keys(row)
    for (const searchKey of keys) {
        const foundKey = rowKeys.find(k => normalizeKey(k) === normalizeKey(searchKey))
        if (foundKey) return row[foundKey]
    }
    return null
  }

  // --- UPLOAD DE PRESENÇA ---
  const handlePresenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (!file) return;
    
    setUploading(true); 
    setProgress(0);
    
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        
        const allData = XLSX.utils.sheet_to_json(ws, { 
          header: 1, 
          raw: false 
        }) as any[][];
        
        let startIndex = 0;
        for (let i = 0; i < allData.length; i++) {
          const row = allData[i];
          if (row && row[0] && typeof row[0] === 'string') {
            const firstCol = row[0].trim().toLowerCase();
            if (firstCol !== 'nome' && firstCol !== 'colaborador' && firstCol !== '' && !firstCol.includes('departamento')) {
              startIndex = i;
              break;
            }
          }
        }
        
        const dataRows = allData.slice(startIndex);
        
        const rawRecords = dataRows
          .map((row: any[], rowIndex: number) => {
            if (!row || row.length < 3) return null;
            
            let nome = row[0];
            const tempoRaw = row[2];
            
            if (!nome || typeof nome !== 'string' || nome.trim() === '') return null;
            nome = nome.trim();
            
            let dataFinal: Date | null = null;
            
            if (typeof tempoRaw === 'string') {
              const tempoStr = tempoRaw.trim();
              const parts = tempoStr.split(' ');
              const datePart = parts[0];
              
              if (datePart.includes('-')) {
                const dateParts = datePart.split('-');
                if (dateParts.length === 3) {
                  const year = parseInt(dateParts[0]);
                  const month = parseInt(dateParts[1]);
                  const day = parseInt(dateParts[2]);
                  
                  if (year && month && day && !isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    dataFinal = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                  }
                }
              }
              else if (datePart.includes('/')) {
                const dateParts = datePart.split('/');
                if (dateParts.length === 3) {
                  const day = parseInt(dateParts[0]);
                  const month = parseInt(dateParts[1]);
                  const year = parseInt(dateParts[2]);
                  
                  if (year && month && day && !isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    dataFinal = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                  }
                }
              }
            }
            else if (typeof tempoRaw === 'number') {
              const dateObj = new Date((tempoRaw - 25569) * 86400 * 1000);
              dataFinal = new Date(Date.UTC(
                dateObj.getUTCFullYear(), 
                dateObj.getUTCMonth(), 
                dateObj.getUTCDate(), 
                12, 0, 0
              ));
            }
            
            if (!dataFinal || isNaN(dataFinal.getTime())) {
              return null;
            }
            
            return { 
              nome_colaborador: nome, 
              data_hora: dataFinal, 
              arquivo_origem: file.name 
            };
          })
          .filter((r: any) => r !== null);
        
        const uniqueSet = new Set<string>();
        const allDates = rawRecords.map((r: any) => r.data_hora);
        const minDate = new Date(Math.min(...allDates.map((d: Date) => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map((d: Date) => d.getTime())));
        
        const { data: existingRecords } = await supabase
          .from('presenca_portaria')
          .select('nome_colaborador, data_hora')
          .gte('data_hora', minDate.toISOString())
          .lte('data_hora', maxDate.toISOString());
        
        const existingSignatures = new Set<string>();
        if (existingRecords) {
          existingRecords.forEach(r => {
            const d = new Date(r.data_hora);
            const dateStr = d.toISOString().split('T')[0];
            const key = `${normalizeKey(r.nome_colaborador)}_${dateStr}`;
            existingSignatures.add(key);
          });
        }
        
        const recordsToInsert = rawRecords.filter((r: any) => {
          const d = r.data_hora;
          const dateStr = d.toISOString().split('T')[0];
          const key = `${normalizeKey(r.nome_colaborador)}_${dateStr}`;
          
          if (existingSignatures.has(key)) return false;
          if (uniqueSet.has(key)) return false;
          
          uniqueSet.add(key);
          return true;
        });
        
        const duplicatesSkipped = rawRecords.length - recordsToInsert.length;
        
        if (recordsToInsert.length === 0) {
          alert('Nenhum registro novo para importar. Todos já existem no sistema.');
          setUploading(false);
          if (presenceInputRef.current) presenceInputRef.current.value = '';
          return;
        }
        
        const BATCH_SIZE = 1000;
        const totalBatches = Math.ceil(recordsToInsert.length / BATCH_SIZE);
        
        for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
          const batch = recordsToInsert.slice(i, i + BATCH_SIZE).map((r: any) => ({
            nome_colaborador: r.nome_colaborador,
            data_hora: r.data_hora.toISOString(),
            arquivo_origem: r.arquivo_origem
          }));
          
          const { error } = await supabase
            .from('presenca_portaria')
            .insert(batch);
          
          if (error) {
            console.error('Erro ao inserir batch:', error);
            throw error;
          }
          
          setProgress(Math.round(((i / BATCH_SIZE) + 1) / totalBatches * 100));
        }
        
        alert(
          `✅ Importação concluída!\n\n` +
          `• ${recordsToInsert.length} registros NOVOS importados\n` +
          `• ${duplicatesSkipped} duplicatas ignoradas\n` +
          `• ${rawRecords.length} linhas processadas`
        );
        
        // REFORÇO DA REGRA: Buscar sempre o mês mais recente no banco, 
        // em vez de focar no arquivo importado
        fetchInitialMonth();
        
      } catch (err) {
        console.error('Erro ao processar arquivo:', err);
        alert('❌ Erro ao importar arquivo. Verifique o formato da planilha.');
      } finally {
        setUploading(false);
        if (presenceInputRef.current) presenceInputRef.current.value = '';
      }
    };
    
    reader.readAsBinaryString(file);
  };

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

  // --- EXPORTAR XLSX ---
  const handleExportXLSX = () => {
    let dataToExport: any[] = [];
    let sheetName = 'Dados';
    let fileName = 'Presencial';

    if (viewMode === 'report') {
        dataToExport = reportData.map(item => ({
            'Colaborador': item.nome,
            'Sócio Responsável': item.socio !== '-' ? item.socio : 'Sem Sócio',
            'Dias Presentes': item.diasPresentes,
            'Segunda': item.diasSemana['Seg'] || 0,
            'Terça': item.diasSemana['Ter'] || 0,
            'Quarta': item.diasSemana['Qua'] || 0,
            'Quinta': item.diasSemana['Qui'] || 0,
            'Sexta': item.diasSemana['Sex'] || 0,
            'Sábado': item.diasSemana['Sáb'] || 0,
            'Domingo': item.diasSemana['Dom'] || 0
        }));
        sheetName = 'Relatório';
    } else if (viewMode === 'descriptive') {
        const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        dataToExport = descriptiveData.map(item => {
            const normName = normalizeKey(item.nome_colaborador)
            const socioRaw = socioMap.get(normName) || '-'
            const dateObj = new Date(item.data_hora);
            return {
                'Colaborador': toTitleCase(item.nome_colaborador),
                'Sócio Responsável': toTitleCase(socioRaw),
                'Data': dateObj.toLocaleDateString('pt-BR'),
                'Dia da Semana': weekDays[dateObj.getUTCDay()]
            };
        });
        sheetName = 'Descritivo';
        fileName = 'Presencial_Descritivo';
    } else {
        return; // Não exporta na aba Sócios por enquanto ou sem viewMode válido
    }

    if (dataToExport.length === 0) return alert('Sem dados para exportar.');

    // Cria worksheet e workbook
    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // Ajusta nome do arquivo
    if (viewMode === 'report') {
        if (filterColaborador) {
            fileName = `Presencial_${filterColaborador.replace(/\s+/g, '_')}`
        } else if (filterSocio) {
            fileName = `Presencial_Socio_${filterSocio.replace(/\s+/g, '_')}`
        } else {
            const monthName = months[selectedMonth]
            fileName = `Presencial_${monthName}_${selectedYear}`
        }
    }

    // Download
    XLSX.writeFile(wb, `${fileName}.xlsx`)
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
            
            {/* 1. SELETORES DE VISUALIZAÇÃO */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
                <button onClick={() => setViewMode('report')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'report' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><BarChart3 className="h-4 w-4" /> Relatório</button>
                <button onClick={() => setViewMode('descriptive')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'descriptive' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><FileText className="h-4 w-4" /> Descritivo</button>
                <button onClick={() => setViewMode('socios')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'socios' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Briefcase className="h-4 w-4" /> Regras</button>
            </div>
            
            <div className="flex items-center gap-2">
                <input type="file" accept=".xlsx" ref={presenceInputRef} onChange={handlePresenceUpload} className="hidden" />
                <input type="file" accept=".xlsx" ref={socioInputRef} onChange={handleSocioUpload} className="hidden" />
                
                <button 
                  onClick={() => fetchRecords()} 
                  className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                  title="Atualizar"
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                {/* BOTÃO EXPORTAR */}
                {(viewMode === 'report' || viewMode === 'descriptive') && (reportData.length > 0 || descriptiveData.length > 0) && (
                  <button 
                    onClick={handleExportXLSX} 
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    <Download className="h-4 w-4" /> 
                    Exportar
                  </button>
                )}
                
                {viewMode === 'socios' ? (
                    <div className="flex gap-2">
                         <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"><Plus className="h-4 w-4" /> Novo</button>
                         <button onClick={() => socioInputRef.current?.click()} disabled={uploading} className="bg-[#112240] hover:bg-[#1e3a8a] text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">{uploading ? '...' : <><Users className="h-4 w-4" /> Importar</>}</button>
                    </div>
                ) : (
                    <button onClick={() => presenceInputRef.current?.click()} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">{uploading ? '...' : <><FileSpreadsheet className="h-4 w-4" /> Importar</>}</button>
                )}
            </div>
        </div>

        {/* BARRA DE FERRAMENTAS: FILTROS */}
        <div className="flex flex-col lg:flex-row items-center justify-between border-t border-gray-100 pt-4 gap-4">
            
            {/* ESPAÇO VAZIO PARA MANTER O ALINHAMENTO A DIREITA SE NECESSÁRIO, OU APENAS O FLEX START */}
            <div className="hidden lg:block"></div>

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

                    {/* FILTRO DE MÊS (MOVIDO PARA A MESMA LINHA) */}
                    {(viewMode === 'report' || viewMode === 'descriptive') && (
                        <div className="flex items-center gap-2 w-full sm:w-auto border-l pl-2 border-gray-200">
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
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        
        {viewMode === 'report' && (
            <div className="flex-1 overflow-auto">
                {reportData.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                        <BarChart3 className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Sem dados correspondentes aos filtros</p>
                        <p className="text-sm">Importe uma planilha ou ajuste os filtros</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                            <tr className="border-b-2 border-gray-200">
                                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Colaborador</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Sócio</th> 
                                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Frequência</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Distribuição Semanal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reportData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/40 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                {item.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#112240] text-base">{item.nome}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.socio !== '-' ? (
                                            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium">
                                                <Briefcase className="h-3.5 w-3.5" />
                                                {item.socio}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-red-500 text-sm italic bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                                                <X className="h-3.5 w-3.5" />
                                                Sem Sócio
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-[#112240]">{item.diasPresentes}</span>
                                                <span className="text-sm text-gray-500 font-medium">dias</span>
                                            </div>
                                            <div className="w-full max-w-[120px] h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all ${
                                                        item.diasPresentes >= 20 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                                                        item.diasPresentes >= 15 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 
                                                        item.diasPresentes >= 10 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                                                        'bg-gradient-to-r from-red-500 to-rose-500'
                                                    }`} 
                                                    style={{ width: `${Math.min((item.diasPresentes / 22) * 100, 100)}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map(day => (
                                                <div 
                                                    key={day} 
                                                    className={`flex flex-col items-center justify-center min-w-[44px] h-14 rounded-lg border-2 transition-all ${
                                                        item.diasSemana[day] 
                                                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-sm' 
                                                            : 'bg-gray-50 border-gray-200'
                                                    }`}
                                                >
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${
                                                        item.diasSemana[day] ? 'text-green-700' : 'text-gray-400'
                                                    }`}>
                                                        {day}
                                                    </span>
                                                    <span className={`text-lg font-bold ${
                                                        item.diasSemana[day] ? 'text-green-600' : 'text-gray-300'
                                                    }`}>
                                                        {item.diasSemana[day] || '–'}
                                                    </span>
                                                </div>
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

        {viewMode === 'descriptive' && (
            <div className="flex-1 overflow-auto">
                {descriptiveData.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                        <FileText className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Sem registros detalhados</p>
                        <p className="text-sm">Nenhum dado encontrado para os filtros selecionados</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                            <tr className="border-b-2 border-gray-200">
                                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Colaborador</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Sócio</th> 
                                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Dia da Semana</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {descriptiveData.map((record, idx) => {
                                const normName = normalizeKey(record.nome_colaborador)
                                const socioRaw = socioMap.get(normName) || '-'
                                const socioFormatted = toTitleCase(socioRaw)
                                const dateObj = new Date(record.data_hora)
                                const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
                                const displayName = toTitleCase(record.nome_colaborador)

                                return (
                                    <tr key={record.id || idx} className="hover:bg-blue-50/40 transition-colors">
                                        <td className="px-6 py-4">
                                            {/* ADICIONADO ÍCONE COM INICIAIS */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                    {displayName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[#112240] text-base">{displayName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700 text-sm">
                                                {socioFormatted !== '-' ? socioFormatted : <span className="text-red-400 italic">Sem Sócio</span>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700 font-medium">
                                                {dateObj.toLocaleDateString('pt-BR')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-500 text-sm capitalize">
                                                {weekDays[dateObj.getUTCDay()]}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        )}

        {viewMode === 'socios' && (
             <div className="flex-1 overflow-auto">
                 {filteredData.filteredRules.length === 0 ? (
                     <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                         <Users className="h-16 w-16 mb-4 opacity-20" />
                         <p className="text-lg font-medium">Nenhuma regra encontrada</p>
                         <p className="text-sm">Crie uma nova regra ou ajuste os filtros</p>
                     </div>
                 ) : (
                    <table className="w-full text-left border-collapse">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                        <tr className="border-b-2 border-gray-200">
                            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Colaborador</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Sócio Responsável</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Meta Semanal</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.filteredRules.map((rule) => {
                             const displayName = toTitleCase(rule.nome_colaborador)
                             return (
                                <tr key={rule.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                         {/* ADICIONADO ÍCONE COM INICIAIS */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                {displayName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                            </div>
                                            <p className="font-semibold text-[#112240] text-base">{displayName}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">{toTitleCase(rule.socio_responsavel)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 font-bold text-sm min-w-[60px]">
                                            {rule.meta_semanal}x
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenModal(rule)} 
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteRule(rule.id)} 
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                             )
                        })}
                    </tbody>
                    </table>
                 )}
             </div>
        )}
      </div>
    </div>
  )
}
