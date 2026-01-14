import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Upload, FileSpreadsheet, RefreshCw, Trash2, 
  LayoutList, BarChart3, Calendar, Users, Briefcase 
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'

// Tipos
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
  const [deleting, setDeleting] = useState(false)
  
  // Refs
  const presenceInputRef = useRef<HTMLInputElement>(null)
  const socioInputRef = useRef<HTMLInputElement>(null)

  // --- ESTADOS DE NAVEGAÇÃO ---
  const [viewMode, setViewMode] = useState<'list' | 'report' | 'socios'>('report')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // --- HELPER NORMALIZAÇÃO ---
  const normalizeText = (text: string) => {
      if (!text) return ""
      return text
        .trim() // Garante remoção de espaços aqui também
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
  }

  // --- 1. BUSCAR DADOS ---
  const fetchRecords = async () => {
    setLoading(true)
    
    // Busca Presença (Aumentei o limite para garantir histórico)
    const { data: presenceData } = await supabase
      .from('presenca_portaria')
      .select('*')
      .order('data_hora', { ascending: false })
      .limit(10000)

    // Busca Regras de Sócios
    const { data: rulesData } = await supabase
      .from('socios_regras')
      .select('*')
      .order('socio_responsavel', { ascending: true })

    if (rulesData) setSocioRules(rulesData)

    if (presenceData && presenceData.length > 0) {
        setRecords(presenceData)
        
        // --- AUTO-AJUSTE DE DATA ---
        // Se houver dados, ajusta o filtro para o mês/ano do registro mais recente
        // para evitar que a tela pareça vazia ao entrar.
        const lastDate = new Date(presenceData[0].data_hora)
        // Só atualiza se for a primeira carga (loading true) ou se o mês atual estiver vazio
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

  // --- 2. LÓGICA DO RELATÓRIO ---
  const reportData = useMemo(() => {
    const socioMap = new Map<string, string>()
    socioRules.forEach(rule => {
        socioMap.set(normalizeText(rule.nome_colaborador), rule.socio_responsavel)
    })

    const grouped: { [key: string]: { uniqueDays: Set<string>, weekDays: { [key: number]: number } } } = {}

    records.forEach(record => {
      const dateObj = new Date(record.data_hora)
      if (dateObj.getMonth() !== selectedMonth || dateObj.getFullYear() !== selectedYear) return

      // Normaliza e Trim no nome para agrupamento
      const nome = record.nome_colaborador.trim().toUpperCase()
      const dayKey = dateObj.toLocaleDateString('pt-BR')
      const weekDay = dateObj.getDay()

      if (!grouped[nome]) grouped[nome] = { uniqueDays: new Set(), weekDays: {} }
      if (!grouped[nome].uniqueDays.has(dayKey)) {
        grouped[nome].uniqueDays.add(dayKey)
        grouped[nome].weekDays[weekDay] = (grouped[nome].weekDays[weekDay] || 0) + 1
      }
    })

    const result: ReportItem[] = Object.keys(grouped).map(nome => {
      const weekDaysMap: { [key: string]: number } = {}
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      Object.entries(grouped[nome].weekDays).forEach(([i, count]) => weekDaysMap[days[Number(i)]] = count)
      
      const socioResponsavel = socioMap.get(normalizeText(nome)) || '-'

      return { 
          nome, 
          socio: socioResponsavel, 
          diasPresentes: grouped[nome].uniqueDays.size, 
          diasSemana: weekDaysMap 
      }
    })
    
    return result.sort((a, b) => {
        if (a.socio === '-' && b.socio !== '-') return 1;
        if (a.socio !== '-' && b.socio === '-') return -1;
        if (a.socio !== b.socio) return a.socio.localeCompare(b.socio);
        return b.diasPresentes - a.diasPresentes;
    })

  }, [records, socioRules, selectedMonth, selectedYear])

  // --- UTILS EXCEL ---
  const findValue = (row: any, keys: string[]) => {
    const rowKeys = Object.keys(row)
    for (const searchKey of keys) {
        const foundKey = rowKeys.find(k => normalizeText(k) === normalizeText(searchKey))
        if (foundKey) return row[foundKey]
    }
    return null
  }

  // --- 3. UPLOAD PRESENÇA (COM TRIM) ---
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
          
          // --- CORREÇÃO: TRIM ---
          if (typeof nome === 'string') nome = nome.trim()
            
          const tempoRaw = findValue(row, ['tempo', 'data', 'horario'])
          let dataFinal = new Date()
          if (typeof tempoRaw === 'string') dataFinal = new Date(tempoRaw)
          else if (typeof tempoRaw === 'number') dataFinal = new Date((tempoRaw - 25569) * 86400 * 1000)
          
          return {
            nome_colaborador: nome,
            data_hora: isNaN(dataFinal.getTime()) ? new Date() : dataFinal,
            arquivo_origem: file.name
          }
        }).filter((r:any) => r.nome_colaborador !== 'Desconhecido')

        const BATCH_SIZE = 100; const total = Math.ceil(recordsToInsert.length / BATCH_SIZE)
        for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
            await supabase.from('presenca_portaria').insert(recordsToInsert.slice(i, i + BATCH_SIZE))
            setProgress(Math.round(((i / BATCH_SIZE) + 1) / total * 100))
        }
        alert(`${recordsToInsert.length} registros de presença importados!`); fetchRecords()
      } catch (err) { alert("Erro ao importar.") } 
      finally { setUploading(false); if (presenceInputRef.current) presenceInputRef.current.value = '' }
    }
    reader.readAsBinaryString(file)
  }

  // --- 4. UPLOAD SÓCIOS (COM TRIM) ---
  const handleSocioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setProgress(0);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        
        const rulesToInsert = data.map((row: any) => {
          let socio = findValue(row, ['socio', 'sócio', 'responsavel', 'gestor', 'partner']) || 'Não Definido'
          let colab = findValue(row, ['nome', 'colaborador', 'funcionario']) || 'Desconhecido'
          
          // --- CORREÇÃO: TRIM ---
          if (typeof socio === 'string') socio = socio.trim()
          if (typeof colab === 'string') colab = colab.trim()

          const meta = findValue(row, ['meta', 'dias', 'regra']) || 3 
          return { socio_responsavel: socio, nome_colaborador: colab, meta_semanal: Number(meta) || 3 }
        }).filter((r:any) => r.nome_colaborador !== 'Desconhecido')

        if(confirm(`Substituir base de sócios por ${rulesToInsert.length} registros?`)) {
            await supabase.from('socios_regras').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('socios_regras').insert(rulesToInsert)
            alert("Atualizado!"); fetchRecords()
        }
      } catch (err) { alert("Erro ao importar.") } 
      finally { setUploading(false); if (socioInputRef.current) socioInputRef.current.value = '' }
    }
    reader.readAsBinaryString(file)
  }

  const handleClearData = async () => {
      if (viewMode === 'socios') {
          if (!confirm("Apagar regras de sócios?")) return;
          await supabase.from('socios_regras').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      } else {
          if (!confirm("Apagar histórico de presença?")) return;
          await supabase.from('presenca_portaria').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      }
      fetchRecords()
  }

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="flex flex-col h-full bg-gray-100 space-y-6">
      
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-xl font-bold text-[#112240]">Controle de Presença</h2>
                <p className="text-sm text-gray-500">
                    {viewMode === 'socios' ? 'Gestão de vínculos entre Sócios e Colaboradores.' : 'Monitoramento de acessos ao escritório.'}
                </p>
            </div>
            
            <div className="flex items-center gap-2">
                <input type="file" accept=".xlsx" ref={presenceInputRef} onChange={handlePresenceUpload} className="hidden" />
                <input type="file" accept=".xlsx" ref={socioInputRef} onChange={handleSocioUpload} className="hidden" />
                
                <button onClick={() => fetchRecords()} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Atualizar"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button>
                <button onClick={handleClearData} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Limpar Base Atual"><Trash2 className="h-5 w-5" /></button>
                
                {viewMode === 'socios' ? (
                    <button onClick={() => socioInputRef.current?.click()} disabled={uploading} className="bg-[#112240] hover:bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        {uploading ? 'Carregando...' : <><Users className="h-4 w-4" /> Importar Sócios</>}
                    </button>
                ) : (
                    <button onClick={() => presenceInputRef.current?.click()} disabled={uploading} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                         {uploading ? `Importando ${progress}%` : <><FileSpreadsheet className="h-4 w-4" /> Importar Presença</>}
                    </button>
                )}
            </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between border-t border-gray-100 pt-4 gap-4">
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('report')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'report' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <BarChart3 className="h-4 w-4" /> Relatório
                </button>
                <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <LayoutList className="h-4 w-4" /> Bruto
                </button>
                <button onClick={() => setViewMode('socios')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'socios' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Briefcase className="h-4 w-4" /> Sócios & Regras
                </button>
            </div>

            {viewMode === 'report' && (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
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

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        
        {viewMode === 'report' && (
            <div className="flex-1 overflow-auto">
                {reportData.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400"><p>Sem dados para o período.</p></div>
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
                                        {item.socio !== '-' ? (
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200 text-xs font-semibold">
                                                {item.socio}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-bold text-[#112240]">{item.diasPresentes}</span>
                                                <span className="text-xs text-gray-500">dias</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${item.diasPresentes >= 20 ? 'bg-green-500' : item.diasPresentes >= 10 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min((item.diasPresentes / 22) * 100, 100)}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map(day => (
                                                <div key={day} className={`text-xs px-2 py-1 rounded border ${item.diasSemana[day] ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                                    {day}{item.diasSemana[day] ? ` (${item.diasSemana[day]})` : ''}
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

        {viewMode === 'socios' && (
             <div className="flex-1 overflow-auto">
                 {socioRules.length === 0 ? (
                     <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                         <Users className="h-12 w-12 mb-3 opacity-20" />
                         <p>Nenhuma regra cadastrada.</p>
                         <p className="text-sm">Importe planilha com: "Sócio", "Colaborador", "Meta"</p>
                     </div>
                 ) : (
                    <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                        <tr>
                            <th className="px-6 py-4 border-b">Sócio Responsável</th>
                            <th className="px-6 py-4 border-b">Colaborador</th>
                            <th className="px-6 py-4 border-b">Meta Presencial</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {socioRules.map((rule) => (
                            <tr key={rule.id} className="hover:bg-gray-50 text-sm text-gray-700">
                                <td className="px-6 py-3 font-bold text-[#112240]">{rule.socio_responsavel}</td>
                                <td className="px-6 py-3 capitalize">{rule.nome_colaborador.toLowerCase()}</td>
                                <td className="px-6 py-3"><span className="bg-gray-100 px-2 py-1 rounded border border-gray-200 font-medium">{rule.meta_semanal}x</span></td>
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
                    {records.map((record) => {
                        const date = new Date(record.data_hora)
                        return (
                            <tr key={record.id} className="hover:bg-gray-50 text-sm text-gray-700">
                                <td className="px-6 py-3 font-medium capitalize">{record.nome_colaborador.toLowerCase()}</td>
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
