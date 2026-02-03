import { useState } from 'react';
import { Users, CheckCircle, UserMinus, UserX, Plus, Search, Grid, LogOut, UserCircle } from 'lucide-react';
import { useColaboradores } from '../hooks/useColaboradores';
import { ColaboradoresList } from '../components/ColaboradoresList';
import { StatCard } from '../components/ColaboradorUI';
import { SearchableSelect } from '../../crm/SearchableSelect';
import { toTitleCase } from '../utils/colaboradoresUtils';
import { Colaborador } from '../../../types/colaborador';

// Nota: Importar os componentes de Form e Modal de detalhes que seriam criados seguindo a mesma lógica.

export function Colaboradores({ userName = 'Usuário', onModuleHome, onLogout }: any) {
  const { colaboradores, deleteColaborador } = useColaboradores();
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);

  const filtered = colaboradores.filter(c => 
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf?.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-4">
      {/* HEADER */}
      <header className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Colaboradores</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gestão de cadastro completo</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"><Grid className="h-5 w-5" /></button>}
          {onLogout && <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><LogOut className="h-5 w-5" /></button>}
        </div>
      </header>

      {viewMode === 'list' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total" value={colaboradores.length} icon={Users} color="blue" />
            <StatCard title="Ativos" value={colaboradores.filter(c => c.status === 'Ativo').length} icon={CheckCircle} color="green" />
            <StatCard title="Desligados" value={colaboradores.filter(c => c.status === 'Desligado').length} icon={UserMinus} color="red" />
            <StatCard title="Inativos" value={colaboradores.filter(c => c.status === 'Inativo').length} icon={UserX} color="gray" />
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <button 
              onClick={() => setViewMode('form')} 
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> Novo
            </button>
          </div>

          <ColaboradoresList 
            colaboradores={filtered} 
            onEdit={(c) => { /* handle edit */ }} 
            onDelete={deleteColaborador}
            onSelect={setSelectedColaborador}
          />
        </>
      )}
      
      {/* Renderizar Formulário ou Modais aqui conforme necessário */}
    </div>
  );
}