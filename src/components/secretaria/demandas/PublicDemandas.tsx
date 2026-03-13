import { useState, useEffect, useMemo } from 'react'
import { Search, LayoutDashboard, Calendar, CalendarCheck, Briefcase, Clock, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { DemandasTable } from './DemandasTable'
import { SearchableSelect } from '../../SearchableSelect'

export function PublicDemandas() {
  const [demandas, setDemandas] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Filtros
  const [filterStatus, setFilterStatus] = useState('')
  const [filterUnidade, setFilterUnidade] = useState('')
  const [filterFornecedor, setFilterFornecedor] = useState('')
  const [filterTipo, setFilterTipo] = useState('')

  const fetchDados = async () => {
    const { data, error } = await supabase
      .from('familia_salomao_demandas')
      .select('*')
      .order('data_solicitacao', { ascending: false })

    if (!error && data) {
      setDemandas(data)
    }
  }

  useEffect(() => {
    fetchDados()
  }, [])

  const filteredData = useMemo(() => {
    return demandas.filter(item => {
      // Filter Exact Matches
      const statusMatch = !filterStatus || item.status === filterStatus;
      const unidadeMatch = !filterUnidade || item.unidade === filterUnidade;
      const fornecedorMatch = !filterFornecedor || item.fornecedor === filterFornecedor;
      const tipoMatch = !filterTipo || item.tipo === filterTipo;

      if (!statusMatch || !unidadeMatch || !fornecedorMatch || !tipoMatch) return false;

      // Filter Search
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.demanda?.toLowerCase().includes(term) ||
        item.solicitante?.toLowerCase().includes(term) ||
        item.equipamento?.toLowerCase().includes(term) ||
        item.fornecedor?.toLowerCase().includes(term)
      )
    })
  }, [demandas, searchTerm, filterStatus, filterUnidade, filterFornecedor, filterTipo])

  // Extract Unique Values for Selects
  const uniqueStatus = useMemo(() => Array.from(new Set(demandas.map(d => d.status).filter(Boolean))).sort().map(s => ({value: s, label: s})), [demandas]);
  const uniqueUnidades = useMemo(() => Array.from(new Set(demandas.map(d => d.unidade).filter(Boolean))).sort().map(s => ({value: s, label: s})), [demandas]);
  const uniqueFornecedores = useMemo(() => Array.from(new Set(demandas.map(d => d.fornecedor).filter(Boolean))).sort().map(s => ({value: s, label: s})), [demandas]);
  const uniqueTipos = useMemo(() => Array.from(new Set(demandas.map(d => d.tipo).filter(Boolean))).sort().map(s => ({value: s, label: s})), [demandas]);

  const kpis = useMemo(() => {
    let abertas = 0;
    let semana = 0;
    let mes = 0;
    let concluidasSemana = 0;
    let concluidasMes = 0;
    let totalSlaDays = 0;
    let countConcluidasSla = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    demandas.forEach(d => {
      if (d.status !== 'Concluído') abertas++;
      const dataStr = d.data_solicitacao;
      if (dataStr) {
        const [year, month, day] = dataStr.split('T')[0].split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (date >= startOfWeek) {
          semana++;
          if (d.status === 'Concluído') concluidasSemana++;
        }
        if (date >= startOfMonth) {
          mes++;
          if (d.status === 'Concluído') concluidasMes++;
        }
      }
      
      if (d.status === 'Concluído' && d.data_solicitacao && d.data_conclusao) {
        const dSolic = new Date(d.data_solicitacao.split('T')[0]);
        const dConcl = new Date(d.data_conclusao.split('T')[0]);
        const diffTime = dConcl.getTime() - dSolic.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          totalSlaDays += diffDays;
          countConcluidasSla++;
        }
      }
    });

    const slaMedio = countConcluidasSla > 0 ? Math.round(totalSlaDays / countConcluidasSla) : 0;

    return { abertas, semana, mes, concluidasSemana, concluidasMes, slaMedio };
  }, [demandas]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Gestão Família - Demandas
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Portal de acompanhamento de SLAs
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-12 custom-scrollbar">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 shrink-0">
          <div className="bg-white p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-[#1e3a8a]/10 flex flex-col hover:border-[#1e3a8a]/30 transition-all mx-1 my-1 relative overflow-hidden group">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Demandas Abertas</p>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-3xl font-black text-[#1e3a8a] leading-none">{kpis.abertas}</p>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-[#1e3a8a]/10 flex flex-col hover:border-[#1e3a8a]/30 transition-all mx-1 my-1 relative overflow-hidden group">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Solic. da Semana</p>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-3xl font-black text-[#1e3a8a] leading-none">{kpis.semana}</p>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-indigo-500" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-green-500/10 flex flex-col hover:border-green-500/30 transition-all mx-1 my-1 relative overflow-hidden group">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Concluídas na Semana</p>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-3xl font-black text-green-600 leading-none">{kpis.concluidasSemana}</p>
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-[#1e3a8a]/10 flex flex-col hover:border-[#1e3a8a]/30 transition-all mx-1 my-1 relative overflow-hidden group">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Solic. do Mês</p>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-3xl font-black text-[#1e3a8a] leading-none">{kpis.mes}</p>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-emerald-500/10 flex flex-col hover:border-emerald-500/30 transition-all mx-1 my-1 relative overflow-hidden group">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Concluídas no Mês</p>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-3xl font-black text-emerald-600 leading-none">{kpis.concluidasMes}</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-amber-500/10 flex flex-col hover:border-amber-500/30 transition-all mx-1 my-1 relative overflow-hidden group">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">SLA Médio (Dias)</p>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-3xl font-black text-amber-600 leading-none">{kpis.slaMedio}</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 shrink-0">
          
          {/* Search (Esquerda) */}
          <div className="relative group/search w-full md:flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within/search:text-[#001D4A] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar demandas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-sm placeholder-slate-400 font-medium focus:bg-white focus:border-[#001D4A]/50 focus:ring-4 focus:ring-[#001D4A]/10 transition-all duration-300 shadow-sm outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center group-hover/search:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors" />
              </button>
            )}
          </div>
          
          {/* Filtros Livres (Direita) */}
          <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto shrink-0 z-40">
            <div className="w-full sm:w-[150px]">
              <SearchableSelect
                value={filterStatus}
                onChange={setFilterStatus}
                options={uniqueStatus}
                placeholder="Status"
              />
            </div>
            <div className="w-full sm:w-[150px]">
              <SearchableSelect
                value={filterUnidade}
                onChange={setFilterUnidade}
                options={uniqueUnidades}
                placeholder="Unidade"
              />
            </div>
            <div className="w-full sm:w-[150px]">
              <SearchableSelect
                value={filterFornecedor}
                onChange={setFilterFornecedor}
                options={uniqueFornecedores}
                placeholder="Fornecedor"
              />
            </div>
            <div className="w-full sm:w-[150px]">
              <SearchableSelect
                value={filterTipo}
                onChange={setFilterTipo}
                options={uniqueTipos}
                placeholder="Tipo"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-slate-200 overflow-hidden flex-1 min-h-[500px]">
          <DemandasTable
            data={filteredData}
            isPublic={true}
          />
        </div>
      </div>
    </div>
  )
}
