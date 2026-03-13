import { useState, useEffect, useMemo } from 'react'
import { Search, Trash2, LayoutDashboard, Calendar, CalendarCheck, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { DemandasTable } from './DemandasTable'
import { DemandasFormModal } from './DemandasFormModal'
import { SearchableSelect } from '../../SearchableSelect'

export function DemandasFamilia() {
  const [demandas, setDemandas] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [itemToDelete, setItemToDelete] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Filtros
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterUnidade, setFilterUnidade] = useState('Todos')
  const [filterFornecedor, setFilterFornecedor] = useState('Todos')
  const [filterTipo, setFilterTipo] = useState('Todos')

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
    
    // Listener for external trigger
    const handleOpenDemandaModal = () => {
      setSelectedItem(null);
      setIsModalOpen(true);
    };
    
    document.addEventListener('openNovaDemanda', handleOpenDemandaModal);
    
    return () => {
      document.removeEventListener('openNovaDemanda', handleOpenDemandaModal);
    };
  }, [])

  const filteredData = useMemo(() => {
    return demandas.filter(item => {
      // Filter Exact Matches
      const statusMatch = filterStatus === 'Todos' || item.status === filterStatus;
      const unidadeMatch = filterUnidade === 'Todos' || item.unidade === filterUnidade;
      const fornecedorMatch = filterFornecedor === 'Todos' || item.fornecedor === filterFornecedor;
      const tipoMatch = filterTipo === 'Todos' || item.tipo === filterTipo;

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
  const uniqueStatus = useMemo(() => [{value: 'Todos', label: 'Status: Todos'}, ...Array.from(new Set(demandas.map(d => d.status).filter(Boolean))).sort().map(s => ({value: s, label: s}))], [demandas]);
  const uniqueUnidades = useMemo(() => [{value: 'Todos', label: 'Unidade: Todas'}, ...Array.from(new Set(demandas.map(d => d.unidade).filter(Boolean))).sort().map(s => ({value: s, label: s}))], [demandas]);
  const uniqueFornecedores = useMemo(() => [{value: 'Todos', label: 'Fornecedor: Todos'}, ...Array.from(new Set(demandas.map(d => d.fornecedor).filter(Boolean))).sort().map(s => ({value: s, label: s}))], [demandas]);
  const uniqueTipos = useMemo(() => [{value: 'Todos', label: 'Tipo: Todos'}, ...Array.from(new Set(demandas.map(d => d.tipo).filter(Boolean))).sort().map(s => ({value: s, label: s}))], [demandas]);

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

  const handleSaveData = async (formData: any) => {
    try {
      if (formData.id) {
        const { error } = await supabase
          .from('familia_salomao_demandas')
          .update(formData)
          .eq('id', formData.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('familia_salomao_demandas')
          .insert([formData])
        if (error) throw error
      }
      await fetchDados()
      setIsModalOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Erro ao salvar demanda:', error)
      alert('Erro ao salvar a demanda.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('familia_salomao_demandas')
        .delete()
        .eq('id', id)
      if (error) throw error
      await fetchDados()
      setItemToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir a demanda.')
    }
  }

  const handleEditItem = (item: any) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in zoom-in duration-300">
      {/* Toolbar / Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-slate-200 shrink-0">
        
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

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-slate-200 overflow-hidden flex-1 min-h-[400px]">
        <DemandasTable
          data={filteredData}
          onEditClick={handleEditItem}
          onDeleteClick={(item) => setItemToDelete(item)}
        />
      </div>

      <DemandasFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
        onSave={handleSaveData}
        initialData={selectedItem}
      />

      {/* Confirmação de Exclusão */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#112240] tracking-tight mb-2">Confirmar Exclusão</h3>
              <p className="text-sm text-gray-500 font-semibold leading-relaxed">
                Tem certeza que deseja remover esta demanda de <span className="text-[#112240] font-black">{itemToDelete.solicitante || 'Sem Solicitante'}</span>?
              </p>
            </div>
            <div className="flex border-t border-gray-50">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(itemToDelete.id)}
                className="flex-1 px-6 py-4 text-[9px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-all border-l border-gray-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


