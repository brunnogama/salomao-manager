import { Search, List as ListIcon, LayoutGrid, ArrowDownAZ, Calendar, Filter, User } from 'lucide-react';
import { Partner } from '../../../types/controladoria';
import { FilterSelect } from '../ui/FilterSelect';

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

}

export function ContractFilters({
  searchTerm, setSearchTerm, statusFilter, setStatusFilter,
  partnerFilter, setPartnerFilter, partners, sortOrder, setSortOrder,
  viewMode, setViewMode
}: Props) {
  const statusOptions = [
    { label: 'Todos Status', value: '' },
    { label: 'Sob Análise', value: 'analysis' },
    { label: 'Proposta Enviada', value: 'proposal' },
    { label: 'Contrato Fechado', value: 'active' },
    { label: 'Rejeitado', value: 'rejected' },
    { label: 'Probono', value: 'probono' }
  ];

  const partnerOptions = [
    { label: 'Todos Sócios', value: '' },
    ...partners.map(p => ({ label: p.name, value: p.id }))
  ];

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
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-salomao-blue outline-none text-sm font-medium"
          />
        </div>

        {/* Filtro Status */}
        <FilterSelect
          icon={Filter}
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="Status"
        />

        {/* Filtro Sócios */}
        <FilterSelect
          icon={User}
          value={partnerFilter}
          onChange={setPartnerFilter}
          options={partnerOptions}
          placeholder="Sócios"
        />

      </div>

      {/* Área de Ações e Visualização */}
      <div className="flex items-center gap-2 border-l pl-4 border-gray-200 w-full md:w-auto justify-end">

        {/* Ordenação */}
        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
          <button
            onClick={() => setSortOrder('name')}
            className={`p-1.5 rounded flex items-center gap-1 text-xs font-medium transition-all ${sortOrder === 'name' ? 'bg-white shadow text-salomao-blue' : 'text-gray-500 hover:text-gray-700'}`}
            title="Ordenar por Nome"
          >
            <ArrowDownAZ className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSortOrder('date')}
            className={`p-1.5 rounded flex items-center gap-1 text-xs font-medium transition-all ${sortOrder === 'date' ? 'bg-white shadow text-salomao-blue' : 'text-gray-500 hover:text-gray-700'}`}
            title="Ordenar por Data"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        {/* Visualização */}
        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-salomao-blue' : 'text-gray-400 hover:text-gray-600'}`}><ListIcon className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('card')} className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-white shadow text-salomao-blue' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-4 h-4" /></button>
        </div>

      </div>
    </div>
  );
}