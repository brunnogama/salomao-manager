import React from 'react';
import { Search, FileSpreadsheet, List as ListIcon, LayoutGrid, ArrowDownAZ, Calendar, Filter, User } from 'lucide-react';
import { Partner } from '../types'; // Caminho corrigido para a estrutura da controladoria

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
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
      
      {/* Área de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row flex-1 gap-3 w-full">
        
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por cliente..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0a192f] focus:border-[#0a192f] outline-none text-sm font-medium transition-all"
          />
        </div>

        {/* Filtro Status */}
        <div className="relative min-w-[160px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select 
                className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-wider bg-gray-50 outline-none focus:ring-2 focus:ring-[#0a192f] appearance-none cursor-pointer hover:bg-gray-100 transition-colors text-gray-700"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="">Status</option>
                <option value="analysis">Sob Análise</option>
                <option value="proposal">Proposta Enviada</option>
                <option value="active">Contrato Fechado</option>
                <option value="rejected">Rejeitado</option>
                <option value="probono">Probono</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>

        {/* Filtro Sócios */}
        <div className="relative min-w-[160px]">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select 
                className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-wider bg-gray-50 outline-none focus:ring-2 focus:ring-[#0a192f] appearance-none cursor-pointer hover:bg-gray-100 transition-colors text-gray-700"
                value={partnerFilter} 
                onChange={(e) => setPartnerFilter(e.target.value)}
            >
                <option value="">Sócios</option>
                {partners.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>

      </div>

      {/* Área de Ações e Visualização */}
      <div className="flex items-center gap-2 md:border-l md:pl-4 border-gray-200 w-full md:w-auto justify-end">
        
        {/* Ordenação */}
        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
          <button 
            onClick={() => setSortOrder('name')} 
            className={`p-1.5 rounded-md flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter transition-all ${sortOrder === 'name' ? 'bg-white shadow-sm text-[#0a192f]' : 'text-gray-400 hover:text-gray-600'}`}
            title="Ordenar por Nome"
          >
            <ArrowDownAZ className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setSortOrder('date')} 
            className={`p-1.5 rounded-md flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter transition-all ${sortOrder === 'date' ? 'bg-white shadow-sm text-[#0a192f]' : 'text-gray-400 hover:text-gray-600'}`}
            title="Ordenar por Data"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        {/* Visualização */}
        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#0a192f]' : 'text-gray-400 hover:text-gray-600'}`}><ListIcon className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-[#0a192f]' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-4 h-4" /></button>
        </div>

        {/* Exportar */}
        <button 
            onClick={onExport} 
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-all text-xs font-black uppercase tracking-widest shadow-md active:scale-95"
            title="Exportar para Excel"
        >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden lg:inline">XLS</span>
        </button>

      </div>
    </div>
  );
}