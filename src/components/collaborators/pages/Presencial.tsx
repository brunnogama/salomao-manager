// src/components/collaborators/pages/Presencial.tsx

import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Upload, FileSpreadsheet, RefreshCw, Download,
  BarChart3, Users, Briefcase, FileText,
  Plus, Search, Eraser, Mail, X
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../../../lib/supabase'
import html2canvas from 'html2canvas'
import { SearchableSelect } from '../../crm/SearchableSelect'

// Importações Modularizadas
import { PresenceRecord, SocioRule, ReportItem } from '../types/presencial'
import { 
  normalizeKey, 
  toTitleCase, 
  findValue, 
  getFirstDayOfMonth, 
  getLastDayOfMonth 
} from '../utils/presencialUtils'
import { SocioRuleModal } from '../components/SocioRuleModal'
import { ReportTable } from '../components/ReportTable'
import { DescriptiveTable } from '../components/DescriptiveTable'
import { SocioRulesTable } from '../components/SocioRulesTable'

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
  const reportRef = useRef<HTMLDivElement>(null)

  // --- NAVEGAÇÃO ---
  const [viewMode, setViewMode] = useState<'report' | 'descriptive' | 'socios'>('report')
   
  const [startDate, setStartDate] = useState(getFirstDayOfMonth())
  const [endDate, setEndDate] = useState(getLastDayOfMonth())
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // --- BUSCAR ÚLTIMA DATA PARA DEFINIR PERÍODO INICIAL ---
  const fetchInitialPeriod = async () => {
      const { data } = await supabase
          .from('presenca_portaria')
          .select('data_hora')
          .order('data_hora', { ascending: false })
          .limit(1)
       
      if (data && data.length > 0) {
          const lastDate = new Date(data[0].data_hora)
          const lastDateStr = lastDate.toISOString().split('T')[0]
          setEndDate(lastDateStr)
          
          const firstDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1)
          const firstDateStr = firstDate.toISOString().split('T')[0]
          setStartDate(firstDateStr)
      }
      setIsInitialLoad(false)
  }

  // --- BUSCAR DADOS ---
  const fetchRecords = async () => {
    if (isInitialLoad) return; 

    setLoading(true)
    
    let allPresenceData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: presenceData, error } = await supabase
        .from('presenca_portaria')
        .select('*', { count: 'exact' })
        .gte('data_hora', startDate + 'T00:00:00')
        .lte('data_hora', endDate + 'T23:59:59')
        .order('data_hora', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('Erro ao buscar presença:', error);
        break;
      }

      if (presenceData && presenceData.length > 0) {
        allPresenceData = [...allPresenceData, ...presenceData];
        
        if (presenceData.length < pageSize) {
          hasMore = false;
        } else {
          from += pageSize;
        }
      } else {
        hasMore = false;
      }
    }

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
      fetchInitialPeriod()
  }, [])

  useEffect(() => {
    if (!isInitialLoad) {
        fetchRecords()
    }
  }, [startDate, endDate, isInitialLoad])

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

  const [sociosList, setSociosList] = useState<{id: string, nome: string}[]>([])
  
  useEffect(() => {
    fetchSociosList()
  }, [])

  const fetchSociosList = async () => {
    const { data } = await supabase.from('socios_lista').select('*').order('nome')
    if (data) setSociosList(data)
  }

  const uniqueColaboradores = useMemo(() => {
      let rules = socioRules;
      if (filterSocio) {
          rules = rules.filter(r => toTitleCase(r.socio_responsavel) === filterSocio)
      }
      return Array.from(new Set(rules.map(r => toTitleCase(r.nome_colaborador)))).sort().map(c => ({ nome: c }))
  }, [socioRules, filterSocio])

  // --- FILTRAGEM CENTRALIZADA ---
  const filteredData = useMemo(() => {
      const filteredRecords = records.filter(record => {
          const dateObj = new Date(record.data_hora)
          const start = new Date(startDate + 'T00:00:00');
          const end = new Date(endDate + 'T23:59:59');
          if (dateObj < start || dateObj > end) return false

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
  }, [records, socioRules, startDate, endDate, filterSocio, filterColaborador, searchText, socioMap])

  // --- LÓGICA DO RELATÓRIO ---
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
      const sortedDates = Array.from(item.datesSet).map(d => parseInt(d)).sort((a, b) => a - b).map(d => String(d).padStart(2, '0'))

      return { 
          nome: item.originalName, 
          socio: socioFormatted, 
          diasPresentes: item.uniqueDays.size, 
          diasSemana: weekDaysMap,
          datas: sortedDates
      }
    })
    return result.sort((a, b) => a.nome.localeCompare(b.nome))
  }, [filteredData.filteredRecords, socioMap])

  // --- LÓGICA DO DESCRITIVO ---
  const descriptiveData = useMemo(() => {
    return [...filteredData.filteredRecords].sort((a, b) => {
        const nameA = toTitleCase(a.nome_colaborador);
        const nameB = toTitleCase(b.nome_colaborador);
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime();
    });
  }, [filteredData.filteredRecords]);

  // --- UPLOAD DE PRESENÇA ---
  const handlePresenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (!file) return;
    setUploading(true); setProgress(0);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const allData = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as any[][];
        let startIndex = 0;
        for (let i = 0; i < allData.length; i++) {
          const row = allData[i];
          if (row && row[0] && typeof row[0] === 'string') {
            const firstCol = row[0].trim().toLowerCase();
            if (firstCol !== 'nome' && firstCol !== 'colaborador' && firstCol !== '' && !firstCol.includes('departamento')) {
              startIndex = i; break;
            }
          }
        }
        const dataRows = allData.slice(startIndex);
        const rawRecords = dataRows.map((row: any[]) => {
            if (!row || row.length < 3) return null;
            let nome = row[0]; const tempoRaw = row[2];
            if (!nome || typeof nome !== 'string' || nome.trim() === '') return null;
            nome = nome.trim();
            let dataFinal: Date | null = null;
            if (typeof tempoRaw === 'string') {
              const tempoStr = tempoRaw.trim(); const parts = tempoStr.split(' '); const datePart = parts[0];
              if (datePart.includes('-')) {
                const dateParts = datePart.split('-');
                if (dateParts.length === 3) {
                  const y = parseInt(dateParts[0]), m = parseInt(dateParts[1]), d = parseInt(dateParts[2]);
                  if (y && m && d) dataFinal = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
                }
              } else if (datePart.includes('/')) {
                const dateParts = datePart.split('/');
                if (dateParts.length === 3) {
                  const d = parseInt(dateParts[0]), m = parseInt(dateParts[1]), y = parseInt(dateParts[2]);
                  if (y && m && d) dataFinal = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
                }
              }
            } else if (typeof tempoRaw === 'number') {
              const dateObj = new Date((tempoRaw - 25569) * 86400 * 1000);
              dataFinal = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 12, 0, 0));
            }
            if (!dataFinal || isNaN(dataFinal.getTime())) return null;
            return { nome_colaborador: nome, data_hora: dataFinal, arquivo_origem: file.name };
          }).filter((r: any) => r !== null);
        
        const allDates = rawRecords.map((r: any) => r.data_hora);
        const minDate = new Date(Math.min(...allDates.map((d: Date) => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map((d: Date) => d.getTime())));
        const { data: existingRecords } = await supabase.from('presenca_portaria').select('nome_colaborador, data_hora').gte('data_hora', minDate.toISOString()).lte('data_hora', maxDate.toISOString());
        const existingSignatures = new Set<string>();
        if (existingRecords) {
          existingRecords.forEach(r => {
            const d = new Date(r.data_hora);
            existingSignatures.add(`${normalizeKey(r.nome_colaborador)}_${d.toISOString().split('T')[0]}`);
          });
        }
        const uniqueSet = new Set<string>();
        const recordsToInsert = rawRecords.filter((r: any) => {
          const key = `${normalizeKey(r.nome_colaborador)}_${r.data_hora.toISOString().split('T')[0]}`;
          if (existingSignatures.has(key) || uniqueSet.has(key)) return false;
          uniqueSet.add(key); return true;
        });

        if (recordsToInsert.length === 0) {
          alert('Nenhum registro novo.'); setUploading(false); return;
        }

        const BATCH_SIZE = 1000;
        for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
          const batch = recordsToInsert.slice(i, i + BATCH_SIZE).map((r: any) => ({
            nome_colaborador: r.nome_colaborador, data_hora: r.data_hora.toISOString(), arquivo_origem: r.arquivo_origem
          }));
          const { error } = await supabase.from('presenca_portaria').insert(batch);
          if (error) throw error;
          setProgress(Math.round(((i / BATCH_SIZE) + 1) / Math.ceil(recordsToInsert.length / BATCH_SIZE) * 100));
        }
        alert('Importação concluída!'); fetchInitialPeriod();
      } catch (err) { alert('Erro ao importar.'); } finally { setUploading(false); if (presenceInputRef.current) presenceInputRef.current.value = ''; }
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
          if (typeof socio === 'string') socio = socio.trim(); if (typeof colab === 'string') colab = colab.trim();
          if (colab === 'Desconhecido') return;
          const meta = findValue(row, ['meta', 'dias', 'regra']) || 3 
          uniqueRules.set(normalizeKey(colab), { socio_responsavel: socio, nome_colaborador: colab, meta_semanal: Number(meta) || 3 })
        });
        const rulesToInsert = Array.from(uniqueRules.values());
        if(confirm(`Substituir base?`)) {
            await supabase.from('socios_regras').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('socios_regras').insert(rulesToInsert)
            alert("Base atualizada!"); fetchRecords()
        }
      } catch (err) { alert("Erro ao importar.") } finally { setUploading(false); if (socioInputRef.current) socioInputRef.current.value = '' }
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

  // --- LIMPAR FILTROS ---
  const clearFilters = () => { setFilterSocio(''); setFilterColaborador(''); setSearchText(''); }
  const hasActiveFilters = filterSocio !== '' || filterColaborador !== '' || searchText !== '';

  // --- ENVIAR EMAIL ---
  const handleSendEmail = async () => {
    if (!reportRef.current || viewMode !== 'report') return alert("Vá para a aba 'Relatório'.");
    setLoading(true);
    try {
        const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#ffffff' });
        canvas.toBlob(async (blob) => {
            if (!blob) { setLoading(false); return alert("Erro ao gerar imagem."); }
            try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                const subject = `Relatório de Presença - ${new Date().toLocaleDateString()}`;
                const body = `Segue em anexo (colado) o relatório filtrado.\n\n(Pressione Ctrl+V para colar a imagem aqui)`;
                window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                alert("📸 Imagem copiada!");
            } catch (err) { alert("Erro ao copiar."); }
        });
    } catch (error) { alert("Erro ao gerar imagem."); } finally { setLoading(false); }
  }

  // --- EXPORTAR XLSX ---
  const handleExportXLSX = () => {
    let dataToExport: any[] = []; let sheetName = 'Dados'; let fileName = 'Presencial';
    if (viewMode === 'report') {
        dataToExport = reportData.map(item => ({
            'Colaborador': item.nome, 'Sócio Responsável': item.socio !== '-' ? item.socio : 'Sem Sócio', 'Dias Presentes': item.diasPresentes,
            'Segunda': item.diasSemana['Seg'] || 0, 'Terça': item.diasSemana['Ter'] || 0, 'Quarta': item.diasSemana['Qua'] || 0,
            'Quinta': item.diasSemana['Qui'] || 0, 'Sexta': item.diasSemana['Sex'] || 0, 'Sábado': item.diasSemana['Sáb'] || 0, 'Domingo': item.diasSemana['Dom'] || 0
        }));
        sheetName = 'Relatório';
    } else if (viewMode === 'descriptive') {
        const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        dataToExport = descriptiveData.map(item => ({
            'Colaborador': toTitleCase(item.nome_colaborador), 'Sócio Responsável': toTitleCase(socioMap.get(normalizeKey(item.nome_colaborador)) || '-'),
            'Data': new Date(item.data_hora).toLocaleDateString('pt-BR'), 'Dia da Semana': weekDays[new Date(item.data_hora).getUTCDay()]
        }));
        sheetName = 'Descritivo'; fileName = 'Presencial_Descritivo';
    }
    if (dataToExport.length === 0) return alert('Sem dados.');
    const ws = XLSX.utils.json_to_sheet(dataToExport); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 space-y-6 relative">
      <SocioRuleModal 
        isOpen={isModalOpen} 
        editingRule={editingRule} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveRule} 
        setEditingRule={setEditingRule} 
      />

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
                <button onClick={() => setViewMode('report')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'report' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><BarChart3 className="h-4 w-4" /> Relatório</button>
                <button onClick={() => setViewMode('descriptive')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'descriptive' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><FileText className="h-4 w-4" /> Descritivo</button>
                <button onClick={() => setViewMode('socios')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'socios' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Briefcase className="h-4 w-4" /> Regras</button>
            </div>
            
            <div className="flex items-center gap-2">
                <input type="file" accept=".xlsx" ref={presenceInputRef} onChange={handlePresenceUpload} className="hidden" />
                <input type="file" accept=".xlsx" ref={socioInputRef} onChange={handleSocioUpload} className="hidden" />
                
                <button onClick={() => fetchRecords()} className="p-2.5 text-gray-500 hover:text-blue-600 rounded-lg"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button>

                {(viewMode === 'report' || viewMode === 'descriptive') && (reportData.length > 0 || descriptiveData.length > 0) && (
                  <div className="flex gap-2">
                    {viewMode === 'report' && <button onClick={handleSendEmail} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium"><Mail className="h-4 w-4" /> Email</button>}
                    <button onClick={handleExportXLSX} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium"><Download className="h-4 w-4" /> Exportar</button>
                  </div>
                )}
                
                {viewMode === 'socios' ? (
                    <div className="flex gap-2">
                          <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Novo</button>
                          <button onClick={() => socioInputRef.current?.click()} className="bg-[#112240] text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4" /> Importar</button>
                    </div>
                ) : (
                    <button onClick={() => presenceInputRef.current?.click()} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" /> Importar</button>
                )}
            </div>
        </div>

        {/* FILTROS */}
        <div className="flex flex-col lg:flex-row items-center justify-between border-t border-gray-100 pt-4 gap-4">
            <div className="hidden lg:block">{hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 bg-red-50 rounded-md"><Eraser className="h-3.5 w-3.5" /> Limpar Filtros</button>}</div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                <div className={`flex items-center bg-gray-50 border rounded-lg transition-all ${showSearch ? 'w-full sm:w-64 px-2' : 'w-10 justify-center'}`}>
                    <button onClick={() => setShowSearch(!showSearch)} className="p-2 text-gray-400">{showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}</button>
                    {showSearch && <input ref={searchInputRef} type="text" placeholder="Buscar..." className="bg-transparent border-none text-sm w-full outline-none" value={searchText} onChange={(e) => setSearchText(e.target.value)} />}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <SearchableSelect value={filterSocio} onChange={setFilterSocio} table="socios_lista" nameField="nome" placeholder="Todos Sócios" className="w-full sm:w-48" onRefresh={fetchSociosList} />
                    <SearchableSelect value={filterColaborador} onChange={setFilterColaborador} options={uniqueColaboradores} placeholder="Todos Colab." className="w-full sm:w-48" />
                    {(viewMode === 'report' || viewMode === 'descriptive') && (
                        <div className="flex items-center gap-2 border-l pl-2">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm p-1 outline-none" />
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm p-1 outline-none" />
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {viewMode === 'report' && <ReportTable reportData={reportData} reportRef={reportRef} startDate={startDate} endDate={endDate} />}
        {viewMode === 'descriptive' && <DescriptiveTable descriptiveData={descriptiveData} socioMap={socioMap} />}
        {viewMode === 'socios' && <SocioRulesTable filteredRules={filteredData.filteredRules} onEdit={handleOpenModal} onDelete={handleDeleteRule} />}
      </div>
    </div>
  )
}
