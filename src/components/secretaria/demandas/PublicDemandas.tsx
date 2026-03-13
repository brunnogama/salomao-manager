import { Search, LayoutDashboard, Calendar, CalendarCheck, Briefcase } from 'lucide-react'
import { DemandasTable } from './DemandasTable'

export function PublicDemandas() {
  const [demandas, setDemandas] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

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
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.demanda?.toLowerCase().includes(term) ||
        item.solicitante?.toLowerCase().includes(term) ||
        item.equipamento?.toLowerCase().includes(term) ||
        item.fornecedor?.toLowerCase().includes(term)
      )
    })
  }, [demandas, searchTerm])

  const kpis = useMemo(() => {
    let abertas = 0;
    let semana = 0;
    let mes = 0;
    let concluidasSemana = 0;
    let concluidasMes = 0;

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
    });

    return { abertas, semana, mes, concluidasSemana, concluidasMes };
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
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
          <div className="bg-white p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-[#1e3a8a]/10 flex flex-col hover:border-[#1e3a8a]/30 transition-all mx-1 my-1 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50/50 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Demandas Abertas</p>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-3xl font-black text-[#1e3a8a] leading-none">{kpis.abertas}</p>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-[#1e3a8a]/10 flex flex-col hover:border-[#1e3a8a]/30 transition-all mx-1 my-1 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-50/50 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Solic. da Semana</p>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-3xl font-black text-[#1e3a8a] leading-none">{kpis.semana}</p>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-indigo-500" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-green-500/10 flex flex-col hover:border-green-500/30 transition-all mx-1 my-1 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-50/50 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Concluídas na Semana</p>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-3xl font-black text-green-600 leading-none">{kpis.concluidasSemana}</p>
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-[#1e3a8a]/10 flex flex-col hover:border-[#1e3a8a]/30 transition-all mx-1 my-1 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-50/50 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Solic. do Mês</p>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-3xl font-black text-[#1e3a8a] leading-none">{kpis.mes}</p>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-emerald-500/10 flex flex-col hover:border-emerald-500/30 transition-all mx-1 my-1 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50/50 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Concluídas no Mês</p>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-3xl font-black text-emerald-600 leading-none">{kpis.concluidasMes}</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 shrink-0">
          <div className="relative group/search w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within/search:text-[#001D4A] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar demandas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-sm placeholder-slate-400 font-medium focus:bg-white focus:border-[#001D4A]/50 focus:ring-4 focus:ring-[#001D4A]/10 transition-all duration-300 shadow-sm outline-none"
            />
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
