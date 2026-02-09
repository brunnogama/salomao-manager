import React from 'react';
import { Search, FileSpreadsheet, List as ListIcon, LayoutGrid, ArrowDownAZ, Calendar, Filter, User, ChevronDown } from 'lucide-react';
import { Partner } from '../../../types/controladoria'; // Caminho corrigido para a estrutura da controladoria

interface Props {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  partnerFilter: string;
  setPartnerFilter: (v: string) => void;
  partners: Partner[];
  sortOrder: 'name' | 'date';
  setSortOrder: (v: 'name' | 'date') => void;
  viewMode: 'list' | 'card';
  setViewMode: (v: 'list' | 'card') => void;
  onExport: () => void;
}

export function ContractFilters({
  searchTerm, setSearchTerm, statusFilter, setStatusFilter,
  partnerFilter, setPartnerFilter, partners, sortOrder, setSortOrder,
  viewMode, setViewMode, onExport
}: Props) {
  return (
    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
      
      {/* Área de Busca e Filtros - Estilo Manager */}
      <div className="flex flex-col sm:flex-row flex-1 gap-3 w-full">
        
        {/* Busca Animada Expandível Adaptada */}
        <div className="relative flex-1 min-w-[200px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 group-focus-within:text-[#0a192f] transition-colors" />
          <input 
            type="text" 
            placeholder="BUSCAR POR CLIENTE OU ID..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:border-[#0a192f] focus:bg-white outline-none text-[10px] font-black uppercase tracking-widest text-[#0a192f] placeholder:text-gray-300 transition-all shadow-inner"
          />
        </div>

        {/* Filtro Status */}
        <div className="relative min-w-[170px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <select 
                className="w-full pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0a192f] outline-none focus:border-[#0a192f] appearance-none cursor-pointer hover:bg-gray-100 transition-all"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="">STATUS</option>
                <option value="analysis">SOB ANÁLISE</option>
                <option value="proposal">PROPOSTA ENVIADA</option>
                <option value="active">CONTRATO FECHADO</option>
                <option value="rejected">REJEITADO</option>
                <option value="probono">PROBONO</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>

        {/* Filtro Sócios */}
        <div className="relative min-w-[170px]">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <select 
                className="w-full pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0a192f] outline-none focus:border-[#0a192f] appearance-none cursor-pointer hover:bg-gray-100 transition-all"
                value={partnerFilter} 
                onChange={(e) => setPartnerFilter(e.target.value)}
            >
                <option value="">SÓCIOS</option>
                {partners.map(p => (<option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>

      </div>

      {/* Área de Ações e Visualização */}
      <div className="flex items-center gap-3 md:border-l md:pl-6 border-gray-100 w-full md:w-auto justify-end">
        
        {/* Ordenação */}
        <div className="flex bg-gray-50/50 rounded-xl p-1 border border-gray-200 h-[44px] items-center">
          <button 
            onClick={() => setSortOrder('name')} 
            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter transition-all h-full ${sortOrder === 'name' ? 'bg-white shadow-md text-[#0a192f]' : 'text-gray-400 hover:text-gray-600'}`}
            title="Ordenar por Nome"
          >
            <ArrowDownAZ className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">A-Z</span>
          </button>
          <button 
            onClick={() => setSortOrder('date')} 
            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter transition-all h-full ${sortOrder === 'date' ? 'bg-white shadow-md text-[#0a192f]' : 'text-gray-400 hover:text-gray-600'}`}
            title="Ordenar por Data"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DATA</span>
          </button>
        </div>

        {/* Visualização */}
        <div className="flex bg-gray-50/50 rounded-xl p-1 border border-gray-200 h-[44px] items-center">
          <button 
            onClick={() => setViewMode('list')} 
            className={`p-2 rounded-lg transition-all h-full flex items-center ${viewMode === 'list' ? 'bg-white shadow-md text-[#0a192f]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('card')} 
            className={`p-2 rounded-lg transition-all h-full flex items-center ${viewMode === 'card' ? 'bg-white shadow-sm text-[#0a192f]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        {/* Exportar - Estilo Emerald Manager */}
        <button 
            onClick={onExport} 
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition-all text-[10px] font-black uppercase tracking-widest h-[44px] shadow-sm active:scale-95"
            title="Gerar Planilha Excel"
        >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden lg:inline">EXPORTAR XLS</span>
        </button>

      </div>
    </div>
  );
}