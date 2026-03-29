// src/components/collaborators/pages/Presencial.tsx

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  RefreshCw, Download, Upload,
  Users, Briefcase, FileText,
  Plus, Clock, MapPin, User
} from 'lucide-react'
import XLSX from 'xlsx-js-style'
import { exportToStandardXLSX } from '../../../utils/exportUtils'
import { supabase } from '../../../lib/supabase'
import { FilterBar, FilterCategory } from '../components/FilterBar'

// Importações Modularizadas
import { PresenceRecord, SocioRule, MarcacaoPonto } from '../types/presencial'
import {
  normalizeKey,
  toTitleCase,
  findValue,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  processarMarcacoesDiarias,
  somaTemposFormatoHoras
} from '../utils/presencialUtils'
import { SocioRuleModal } from '../components/SocioRuleModal'
import { DescriptiveTable } from '../components/DescriptiveTable'
import { SocioRulesTable } from '../components/SocioRulesTable'
import { HorasTable } from '../components/HorasTable'

export function Presencial() {
  // === ESTADOS ===
  const [records, setRecords] = useState<PresenceRecord[]>([])
  const [marcacoes, setMarcacoes] = useState<MarcacaoPonto[]>([])
  const [socioRules, setSocioRules] = useState<SocioRule[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [filterSocio, setFilterSocio] = useState('')
  const [filterColaborador, setFilterColaborador] = useState('')
  const [filterMes, setFilterMes] = useState('')
  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Partial<SocioRule> | null>(null)
  const [viewMode, setViewMode] = useState<'horas' | 'descriptive' | 'socios'>('horas')
  const [startDate, setStartDate] = useState(getFirstDayOfMonth())
  const [endDate, setEndDate] = useState(getLastDayOfMonth())
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [sociosList, setSociosList] = useState<{ id: string, name: string }[]>([]) // Atualizado: nome -> name

  // === REFS ===
  const presenceInputRef = useRef<HTMLInputElement>(null)
  const socioInputRef = useRef<HTMLInputElement>(null)
  const horasRef = useRef<HTMLDivElement>(null)

  // === TODA A LÓGICA DO COMPONENTE ===
  const fetchInitialPeriod = async () => {
    const { data } = await supabase.from('marcacoes_ponto').select('data_hora').order('data_hora', { ascending: false }).limit(1)
    if (data && data.length > 0) {
      const lastDate = new Date(data[0].data_hora)
      setEndDate(lastDate.toISOString().split('T')[0])
      const firstDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1)
      setStartDate(firstDate.toISOString().split('T')[0])
    }
    setIsInitialLoad(false)
  }

  const fetchRecords = async () => {
    if (isInitialLoad) return
    setLoading(true)
    let allPresenceData: any[] = [];
    let allMarcacoesData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    // Buscar dados antigos da tabela presenca_portaria
    while (hasMore) {
      const { data: presenceData, error } = await supabase.from('presenca_portaria').select('*', { count: 'exact' }).gte('data_hora', startDate + 'T00:00:00').lte('data_hora', endDate + 'T23:59:59').order('data_hora', { ascending: true }).range(from, from + pageSize - 1);
      if (error) { console.error(error); break; }
      if (presenceData && presenceData.length > 0) { allPresenceData = [...allPresenceData, ...presenceData]; if (presenceData.length < pageSize) { hasMore = false; } else { from += pageSize; } } else { hasMore = false; }
    }

    // Buscar novos dados da tabela marcacoes_ponto
    from = 0;
    hasMore = true;
    while (hasMore) {
      const { data: marcacoesData, error } = await supabase.from('marcacoes_ponto').select('*', { count: 'exact' }).gte('data_hora', startDate + 'T00:00:00').lte('data_hora', endDate + 'T23:59:59').order('data_hora', { ascending: true }).range(from, from + pageSize - 1);
      if (error) { console.error(error); break; }
      if (marcacoesData && marcacoesData.length > 0) { allMarcacoesData = [...allMarcacoesData, ...marcacoesData]; if (marcacoesData.length < pageSize) { hasMore = false; } else { from += pageSize; } } else { hasMore = false; }
    }

    // Atualizado: socios_regras -> collaborators, nome_colaborador -> name
    const { data: rulesData } = await supabase.from('collaborators').select('*').order('name', { ascending: true }).limit(3000)
    if (rulesData) setSocioRules(rulesData)
    setRecords(allPresenceData)
    setMarcacoes(allMarcacoesData)
    setLoading(false)
  }

  const fetchSociosList = async () => {
    // Atualizado: socios_lista -> partners, nome -> name
    const { data } = await supabase.from('partners').select('id, name').order('name')
    if (data) setSociosList(data)
  }

  useEffect(() => { fetchInitialPeriod() }, [])
  useEffect(() => { if (!isInitialLoad) { fetchRecords() } }, [startDate, endDate, isInitialLoad])
  useEffect(() => { fetchSociosList() }, [])

  const socioMap = useMemo(() => {
    const map = new Map<string, string>()
    // Atualizado: nome_colaborador -> name, socio_responsavel -> partner_name (ou campo que retorne o nome do sócio)
    socioRules.forEach(rule => { map.set(normalizeKey(rule.name || rule.nome_colaborador), rule.partner_name || rule.socio_responsavel) })
    return map
  }, [socioRules])

  const uniqueColaboradores = useMemo(() => {
    let rules = socioRules;
    if (filterSocio) { rules = rules.filter(r => toTitleCase(r.partner_name || r.socio_responsavel) === filterSocio) }
    // Atualizado: nome_colaborador -> name
    return Array.from(new Set(rules.map(r => toTitleCase(r.name || r.nome_colaborador)))).sort().map(c => ({ nome: c }))
  }, [socioRules, filterSocio])

  // Opções de sócios para o FilterBar
  const socioOptions = useMemo(() => {
    const uniqueSocios = new Set<string>();
    socioRules.forEach(r => {
      const s = toTitleCase(r.partner_name || r.socio_responsavel);
      if (s && s !== '-') uniqueSocios.add(s);
    });
    return Array.from(uniqueSocios).sort().map(s => ({ value: s, label: s }));
  }, [socioRules]);

  // Opções de colaboradores para o FilterBar
  const colaboradorOptions = useMemo(() => {
    return uniqueColaboradores.map(c => ({ value: c.nome, label: c.nome }));
  }, [uniqueColaboradores]);

  // FilterBar: categorias, chips, count, clear
  const filterCategories = useMemo((): FilterCategory[] => {
    const cats: FilterCategory[] = [
      {
        key: 'socio',
        label: 'Sócio',
        icon: Users,
        type: 'single',
        options: socioOptions,
        value: filterSocio,
        onChange: setFilterSocio,
      },
      {
        key: 'colaborador',
        label: 'Integrante',
        icon: User,
        type: 'single',
        options: colaboradorOptions,
        value: filterColaborador,
        onChange: setFilterColaborador,
      },
    ];
    return cats;
  }, [filterSocio, filterColaborador, socioOptions, colaboradorOptions]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterSocio) count++;
    if (filterColaborador) count++;
    if (filterMes) count++;
    return count;
  }, [filterSocio, filterColaborador, filterMes]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (filterSocio) chips.push({ key: 'socio', label: `Sócio: ${filterSocio}`, onClear: () => setFilterSocio('') });
    if (filterColaborador) chips.push({ key: 'colaborador', label: `Integ: ${filterColaborador}`, onClear: () => setFilterColaborador('') });
    if (filterMes) {
      const [y, m] = filterMes.split('-');
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      chips.push({ key: 'mes', label: `Mês: ${meses[parseInt(m) - 1]}/${y}`, onClear: () => setFilterMes('') });
    }
    return chips;
  }, [filterSocio, filterColaborador, filterMes]);

  const clearAllFilters = () => {
    setFilterSocio('');
    setFilterColaborador('');
    setFilterMes('');
    setSearchText('');
  };

  const filteredData = useMemo(() => {
    const filteredRecords = records.filter(record => {
      const dateObj = new Date(record.data_hora)
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');
      if (dateObj < start || dateObj > end) return false

      // Filtro por mês
      if (filterMes) {
        const [year, month] = filterMes.split('-')
        const recordYear = dateObj.getFullYear().toString()
        const recordMonth = String(dateObj.getMonth() + 1).padStart(2, '0')
        if (recordYear !== year || recordMonth !== month) return false
      }

      const normName = normalizeKey(record.nome_colaborador)
      const socioRaw = socioMap.get(normName) || '-'
      const socioFormatted = toTitleCase(socioRaw)
      const nameFormatted = toTitleCase(record.nome_colaborador)
      if (filterSocio && socioFormatted !== filterSocio) return false
      if (filterColaborador && nameFormatted !== filterColaborador) return false
      if (searchText) {
        const lowerSearch = searchText.toLowerCase()
        const matchesName = String(record.nome_colaborador || '').toLowerCase().includes(lowerSearch)
        const matchesSocio = String(socioRaw || '').toLowerCase().includes(lowerSearch)
        if (!matchesName && !matchesSocio) return false
      }
      return true
    })

    const filteredMarcacoes = marcacoes.filter(marcacao => {
      const dateObj = new Date(marcacao.data_hora)
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');
      if (dateObj < start || dateObj > end) return false

      // Filtro por mês
      if (filterMes) {
        const [year, month] = filterMes.split('-')
        const recordYear = dateObj.getFullYear().toString()
        const recordMonth = String(dateObj.getMonth() + 1).padStart(2, '0')
        if (recordYear !== year || recordMonth !== month) return false
      }

      const nameFormatted = toTitleCase(marcacao.nome_colaborador)
      if (filterColaborador && nameFormatted !== filterColaborador) return false
      if (searchText) {
        const lowerSearch = searchText.toLowerCase()
        const matchesName = String(marcacao.nome_colaborador || '').toLowerCase().includes(lowerSearch)
        if (!matchesName) return false
      }
      return true
    })

    const filteredRules = socioRules.filter(rule => {
      // Atualizado: socio_responsavel -> partner_name, nome_colaborador -> name
      const socioFormatted = toTitleCase(rule.partner_name || rule.socio_responsavel)
      const nameFormatted = toTitleCase(rule.name || rule.nome_colaborador)
      if (filterSocio && socioFormatted !== filterSocio) return false
      if (filterColaborador && nameFormatted !== filterColaborador) return false
      if (searchText) {
        const lowerSearch = searchText.toLowerCase()
        const ruleName = String(rule.name || rule.nome_colaborador || '')
        const partnerName = String(rule.partner_name || rule.socio_responsavel || '')
        return ruleName.toLowerCase().includes(lowerSearch) || partnerName.toLowerCase().includes(lowerSearch)
      }
      return true
    })
    return { filteredRecords, filteredMarcacoes, filteredRules }
  }, [records, marcacoes, socioRules, startDate, endDate, filterSocio, filterColaborador, filterMes, searchText, socioMap])

  const descriptiveData = useMemo(() => {
    return [...filteredData.filteredRecords].sort((a, b) => {
      const nameA = toTitleCase(a.nome_colaborador);
      const nameB = toTitleCase(b.nome_colaborador);
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime();
    });
  }, [filteredData.filteredRecords]);

  const registrosHoras = useMemo(() => {
    return processarMarcacoesDiarias(filteredData.filteredMarcacoes)
  }, [filteredData.filteredMarcacoes])

  const handlePresenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setProgress(0);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const allData = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as any[][];

        // Dados sempre começam na linha 9 (índice 8, pois linha 8 é cabeçalho)
        const dataRows = allData.slice(8);
        const rawRecords = dataRows.map((row: any[]) => {
          if (!row || row.length < 3) return null;
          let nome = row[0]; const tempoRaw = row[2];
          if (!nome || typeof nome !== 'string' || nome.trim() === '') return null;
          nome = nome.trim();
          let dataFinal: Date | null = null;
          if (typeof tempoRaw === 'string') {
            const tempoStr = tempoRaw.trim();
            const parts = tempoStr.split(' ');
            const datePart = parts[0];
            const timePart = parts[1] || '00:00:00';

            if (datePart.includes('-')) {
              const dateParts = datePart.split('-');
              const timeParts = timePart.split(':');
              if (dateParts.length === 3) {
                const y = parseInt(dateParts[0]), m = parseInt(dateParts[1]), d = parseInt(dateParts[2]);
                const hh = parseInt(timeParts[0]) || 0, mm = parseInt(timeParts[1]) || 0, ss = parseInt(timeParts[2]) || 0;
                if (y && m && d) dataFinal = new Date(y, m - 1, d, hh, mm, ss);
              }
            } else if (datePart.includes('/')) {
              const dateParts = datePart.split('/');
              const timeParts = timePart.split(':');
              if (dateParts.length === 3) {
                const d = parseInt(dateParts[0]), m = parseInt(dateParts[1]), y = parseInt(dateParts[2]);
                const hh = parseInt(timeParts[0]) || 0, mm = parseInt(timeParts[1]) || 0, ss = parseInt(timeParts[2]) || 0;
                if (y && m && d) dataFinal = new Date(y, m - 1, d, hh, mm, ss);
              }
            }
          } else if (typeof tempoRaw === 'number') {
            dataFinal = new Date((tempoRaw - 25569) * 86400 * 1000);
          }
          if (!dataFinal || isNaN(dataFinal.getTime())) return null;
          return { nome_colaborador: nome, data_hora: dataFinal, arquivo_origem: file.name };
        }).filter((r: any) => r !== null);

        if (rawRecords.length === 0) { alert('Nenhum dado válido encontrado.'); setUploading(false); return; }

        const allDates = rawRecords.map((r: any) => r.data_hora);
        const minDate = new Date(Math.min(...allDates.map((d: Date) => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map((d: Date) => d.getTime())));

        const { data: existingRecords } = await supabase.from('marcacoes_ponto').select('nome_colaborador, data_hora').gte('data_hora', minDate.toISOString()).lte('data_hora', maxDate.toISOString());

        const existingSignatures = new Set<string>();
        if (existingRecords) {
          existingRecords.forEach(r => {
            existingSignatures.add(`${normalizeKey(r.nome_colaborador)}_${new Date(r.data_hora).toISOString()}`);
          });
        }

        const recordsToInsert = rawRecords.filter((r: any) => {
          const key = `${normalizeKey(r.nome_colaborador)}_${r.data_hora.toISOString()}`;
          return !existingSignatures.has(key);
        });

        if (recordsToInsert.length === 0) { alert('Nenhum registro novo.'); setUploading(false); return; }

        const BATCH_SIZE = 1000;
        for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
          const batch = recordsToInsert.slice(i, i + BATCH_SIZE).map((r: any) => ({ nome_colaborador: r.nome_colaborador, data_hora: r.data_hora.toISOString(), arquivo_origem: r.arquivo_origem }));
          const { error } = await supabase.from('marcacoes_ponto').insert(batch);
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
          let colab = findValue(row, ['nome', 'colaborador', 'integrante', 'funcionario']) || 'Desconhecido'
          if (typeof socio === 'string') socio = socio.trim(); if (typeof colab === 'string') colab = colab.trim();
          if (colab === 'Desconhecido') return;
          const meta = findValue(row, ['meta', 'dias', 'regra']) || 3
          // Atualizado: socio_responsavel -> partner_name, nome_colaborador -> name, meta_semanal -> weekly_goal
          uniqueRules.set(normalizeKey(colab), { socio_responsavel: socio, name: colab, weekly_goal: Number(meta) || 3 })
        });
        const rulesToInsert = Array.from(uniqueRules.values());
        if (confirm(`Substituir base?`)) {
          // Atualizado: socios_regras -> collaborators
          await supabase.from('collaborators').update({ partner_id: null, weekly_goal: 3 }).neq('id', '00000000-0000-0000-0000-000000000000')
          // Nota: No novo esquema, a "regra" faz parte do cadastro do integrante. 
          // Para importação em lote, seria necessário um script de match por nome.
          alert("Recurso em transição para tabela de colaboradores.");
        }
      } catch (err) { alert("Erro ao importar.") } finally { setUploading(false); if (socioInputRef.current) socioInputRef.current.value = '' }
    }
    reader.readAsBinaryString(file)
  }

  const handleOpenModal = (rule?: SocioRule) => {
    // Atualizado: nome_colaborador -> name, socio_responsavel -> partner_id, meta_semanal -> weekly_goal
    setEditingRule(rule || { partner_id: '', name: '', weekly_goal: 3 });
    setIsModalOpen(true);
  }

  const handleSaveRule = async () => {
    // Atualizado: socio_responsavel -> partner_id, nome_colaborador -> name
    if (!editingRule?.partner_id && !editingRule?.socio_responsavel) return alert("Preencha campos.")
    setLoading(true)
    try {
      // Atualizado: Payload para a tabela collaborators
      const payload = {
        partner_id: editingRule.partner_id,
        name: (editingRule.name || editingRule.nome_colaborador || '').trim(),
        weekly_goal: editingRule.weekly_goal || editingRule.meta_semanal || 3
      }
      if (editingRule.id) await supabase.from('collaborators').update(payload).eq('id', editingRule.id)
      else await supabase.from('collaborators').insert(payload)
      setIsModalOpen(false); fetchRecords()
    } catch (err: any) { alert("Erro: " + err.message) } finally { setLoading(false) }
  }

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Remover regra deste integrante?")) return;
    setLoading(true);
    // Atualizado: Zera a regra na tabela collaborators em vez de deletar o registro
    await supabase.from('collaborators').update({ partner_id: null, weekly_goal: null }).eq('id', id);
    fetchRecords()
  }



  const handleExportXLSX = () => {
    if (viewMode !== 'horas' || registrosHoras.length === 0) return;

    const hasSingleColaborador = registrosHoras.length > 0 && new Set(registrosHoras.map(r => r.colaborador)).size === 1;
    const totalTempoUtil = hasSingleColaborador ? somaTemposFormatoHoras(registrosHoras.map(r => r.tempo_util)) : '00:00';
    const totalExcedente = hasSingleColaborador ? somaTemposFormatoHoras(registrosHoras.map(r => r.excedente || '00:00')) : '00:00';

    const dataToExport = registrosHoras.map(item => ({
      'Integrante': item.colaborador,
      'Data': item.data,
      'Entrada': item.entrada,
      'Saída Almoço': item.saida_almoco || '-',
      'Volta Almoço': item.volta_almoco || '-',
      'Intervalo 1': item.intervalo1 || '-',
      'Intervalo 2': item.intervalo2 || '-',
      'Saída': item.saida || '-',
      'Tempo Útil': item.tempo_util,
      'Excedente': item.excedente || '-',
      'Observações': item.observacoes
    }));

    if (hasSingleColaborador) {
        dataToExport.push({
            'Integrante': 'Totais',
            'Data': '',
            'Entrada': '',
            'Saída Almoço': '',
            'Volta Almoço': '',
            'Intervalo 1': '',
            'Intervalo 2': '',
            'Saída': '',
            'Tempo Útil': totalTempoUtil,
            'Excedente': totalExcedente,
            'Observações': ''
        });
    }

    exportToStandardXLSX(
      [{ sheetName: "Horas", data: dataToExport, colWidths: [30, 15, 12, 15, 15, 15, 15, 12, 15, 15, 30] }],
      "Controle_Horas.xlsx"
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6">
      <SocioRuleModal isOpen={isModalOpen} editingRule={editingRule} onClose={() => setIsModalOpen(false)} onSave={handleSaveRule} setEditingRule={setEditingRule} />

      <input type="file" accept=".xlsx" ref={presenceInputRef} onChange={handlePresenceUpload} className="hidden" />
      <input type="file" accept=".xlsx" ref={socioInputRef} onChange={handleSocioUpload} className="hidden" />

      {/* PAGE HEADER - Título + Abas + Ações */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-500 relative z-40">
        {/* Left: Título e Ícone */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
                Presencial
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gestão de presença
            </p>
          </div>
        </div>

        {/* Right: Abas + Ações */}
        <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto justify-end mt-2 md:mt-0 custom-scrollbar">
          {/* Abas */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('horas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'horas' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Clock className="h-4 w-4" /> Horas
            </button>
            <button
              onClick={() => setViewMode('descriptive')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'descriptive' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FileText className="h-4 w-4" /> Descritivo
            </button>
            <button
              onClick={() => setViewMode('socios')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'socios' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase className="h-4 w-4" /> Regras
            </button>
          </div>

          {/* Ações: ícones redondos */}
          <div className="flex items-center gap-2 border-l border-gray-100 pl-3 ml-1">
            <button
              onClick={() => fetchRecords()}
              className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded-full transition-all"
              title="Atualizar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {viewMode === 'horas' && registrosHoras.length > 0 && (
              <button
                onClick={handleExportXLSX}
                className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30"
                title="Exportar XLSX"
              >
                <Download className="h-4 w-4" />
              </button>
            )}

            {viewMode === 'socios' ? (
              <>
                <button
                  onClick={() => handleOpenModal()}
                  className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30"
                  title="Adicionar Nova Regra"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  onClick={() => socioInputRef.current?.click()}
                  className="flex items-center justify-center w-10 h-10 bg-[#1e3a8a] text-white rounded-full hover:bg-[#112240] transition-all shadow-lg shadow-blue-500/30"
                  title="Importar Regras XLSX"
                >
                  <Upload className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => presenceInputRef.current?.click()}
                className="flex items-center justify-center w-10 h-10 bg-[#1e3a8a] text-white rounded-full hover:bg-[#112240] transition-all shadow-lg shadow-blue-500/30"
                title="Importar Presença XLSX"
              >
                <Upload className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Card + FilterBar + Período */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4">
        {/* Card de KPI */}
        <div className="flex items-stretch shrink-0">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
            <div className="p-2 rounded-lg bg-blue-50">
              {viewMode === 'horas' && <Clock className="h-5 w-5 text-[#1e3a8a]" />}
              {viewMode === 'descriptive' && <FileText className="h-5 w-5 text-[#1e3a8a]" />}
              {viewMode === 'socios' && <Briefcase className="h-5 w-5 text-[#1e3a8a]" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">
                {viewMode === 'horas' ? 'Registros' : viewMode === 'descriptive' ? 'Entradas' : 'Regras'}
              </span>
              <span className="text-xl font-black text-[#0a192f] leading-tight">
                {viewMode === 'horas' ? registrosHoras.length : viewMode === 'descriptive' ? descriptiveData.length : filteredData.filteredRules.length}
              </span>
            </div>
          </div>
        </div>

        {/* FilterBar */}
        <div className="flex-1">
          <FilterBar
            searchTerm={searchText}
            onSearchChange={setSearchText}
            categories={filterCategories}
            activeFilterChips={activeFilterChips}
            activeFilterCount={activeFilterCount}
            onClearAll={clearAllFilters}
            extraContent={(viewMode === 'descriptive' || viewMode === 'horas') ? (
              <div className="px-4 py-3 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Período</div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-2 flex-1 hover:border-[#1e3a8a] transition-all">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider pl-1">De</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent border-none text-sm p-0.5 outline-none text-gray-700 font-medium cursor-pointer w-full"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-2 flex-1 hover:border-[#1e3a8a] transition-all">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider pl-1">Até</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent border-none text-sm p-0.5 outline-none text-gray-700 font-medium cursor-pointer w-full"
                    />
                  </div>
                </div>
              </div>
            ) : undefined}
          />
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {viewMode === 'horas' && <HorasTable registros={registrosHoras} tableRef={horasRef} />}
        {viewMode === 'descriptive' && <DescriptiveTable descriptiveData={descriptiveData} socioMap={socioMap} />}
        {viewMode === 'socios' && <SocioRulesTable filteredRules={filteredData.filteredRules} onEdit={handleOpenModal} onDelete={handleDeleteRule} />}
      </div>
    </div>
  )
}