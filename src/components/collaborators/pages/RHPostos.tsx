import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { Building2, Loader2, RefreshCw, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useColaboradores } from '../hooks/useColaboradores';
import { getSegment } from '../utils/rhChartUtils';

interface Posto {
  id: string;
  cargo: string;
  local: string;
  total: number;
  ocupados: number;
  obs: string;
  ordem: number;
  qdeCargos?: number; // Calculated field
}

export function RHPostos() {
  const [postos, setPostos] = useState<Posto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [filterLocal, setFilterLocal] = useState<string>('Todos');

  const { colaboradores, roles, locations: allLocations } = useColaboradores();

  const rolesMap = useMemo(() => {
    return roles.reduce((acc, role) => {
      acc[String(role.id)] = role.name;
      return acc;
    }, {} as Record<string, string>);
  }, [roles]);

  const activeColaboradores = useMemo(() => {
    return colaboradores.filter(c => c.status === 'active');
  }, [colaboradores]);

  const fetchPostos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rh_postos')
      .select('*')
      .order('local', { ascending: true })
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Error fetching postos:', error);
      toast.error('Erro ao buscar postos de trabalho');
    } else {
      setPostos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPostos();
  }, []);

  const handleUpdate = async (id: string, field: keyof Posto, value: any) => {
    setPostos(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));

    setSaving(prev => ({ ...prev, [id]: true }));
    const { error } = await supabase
      .from('rh_postos')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      console.error('Error updating posto:', error);
      toast.error(`Erro ao salvar atualização em ${field}`);
      fetchPostos();
    }
    
    setSaving(prev => ({ ...prev, [id]: false }));
  };

  const handleBlur = (id: string, field: keyof Posto, originalValue: any, newValue: any) => {
    let parsedValue = newValue;
    if (field === 'total' || field === 'ocupados') {
      parsedValue = parseInt(newValue) || 0;
    }
    
    if (parsedValue !== originalValue) {
      handleUpdate(id, field, parsedValue);
    }
  };

  // Processar Postos injetando qdeCargos
  const processedPostos = useMemo(() => {
    return postos.map(posto => {
      const localName = posto.local || 'Sem Escritório Vinculado';
      const localColaboradores = activeColaboradores.filter(c => {
        const cLocName = c.location?.name || allLocations.find(l => String(l.id) === String(c.location_id))?.name;
        // Tratar null/undefined para strings consistentes
        return (cLocName || 'Sem Escritório Vinculado') === localName;
      });

      let qdeCargos = 0;
      
      const matchRole = (c: any, matchNames: string[]) => {
        const rawName = rolesMap[String(c.role)] || '';
        const safeName = rawName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return matchNames.some(name => {
          const safeMatch = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return safeName.includes(safeMatch);
        });
      };

      if (posto.cargo === 'JUNIOR') {
        qdeCargos = localColaboradores.filter(c => matchRole(c, ['Advogado Junior'])).length;
      } else if (posto.cargo === 'PLENO') {
        qdeCargos = localColaboradores.filter(c => matchRole(c, ['Advogado Pleno'])).length;
      } else if (posto.cargo === 'SENIOR') {
        qdeCargos = localColaboradores.filter(c => matchRole(c, ['Advogado Senior'])).length;
      } else if (posto.cargo === 'SÓCIO') {
        qdeCargos = localColaboradores.filter(c => matchRole(c, ['Socio'])).length;
      } else if (posto.cargo === 'CONSULTOR') {
        qdeCargos = localColaboradores.filter(c => matchRole(c, ['Consultor'])).length;
      } else if (posto.cargo === 'ESTAG' || posto.cargo === 'ESTAGIÁRIOS') {
        qdeCargos = localColaboradores.filter(c => matchRole(c, ['Estagiario'])).length;
      } else if (posto.cargo === 'ADM*' || posto.cargo === 'ADMINISTRATIVO') {
        qdeCargos = localColaboradores.filter(c => getSegment(c) === 'Administrativo').length;
      }

      return {
        ...posto,
        qdeCargos
      };
    });
  }, [postos, activeColaboradores, rolesMap, allLocations]);

  // Agrupamento por local
  const groupedPostos = processedPostos.reduce((acc, posto) => {
    const local = posto.local || 'Sem Escritório Vinculado';
    if (!acc[local]) acc[local] = [];
    acc[local].push(posto);
    return acc;
  }, {} as Record<string, Posto[]>);

  // Ordenar as chaves para Rio de Janeiro ficar em 1º
  const locations = Object.keys(groupedPostos).sort((a, b) => {
    if (a === 'Rio de Janeiro') return -1;
    if (b === 'Rio de Janeiro') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-8 relative p-4 sm:p-6 pb-20 overflow-y-auto no-scrollbar">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group shrink-0">
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-50 pointer-events-none" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shadow-blue-900/20 shrink-0 transform transition-transform group-hover:scale-105">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-black text-[#0a192f] tracking-tight leading-none mb-1.5 flex items-center gap-3">
              Gestão de Postos Físicos
              {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
            </h1>
            <p className="text-sm font-semibold text-gray-500 tracking-wide">
              Controle de painel de estações de trabalho divididas por escritório
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchPostos}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-[#1e3a8a] transition-all font-bold text-sm shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </button>
      </div>

      {postos.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center flex flex-col items-center max-w-6xl mx-auto w-full">
          <Building2 className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Nenhum dado encontrado na tabela rh_postos.</p>
          <p className="text-xs text-gray-400 mt-1">Execute o script do banco de dados para popular os postos de Rio e SP.</p>
        </div>
      )}

      {/* FILTER BUTTONS */}
      {postos.length > 0 && locations.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar max-w-6xl mx-auto w-full">
          {['Todos', ...locations].map(locOption => (
            <button
              key={locOption}
              onClick={() => setFilterLocal(locOption)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                filterLocal === locOption 
                  ? 'bg-[#1e3a8a] text-white ring-2 ring-[#1e3a8a] ring-offset-2' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-[#1e3a8a]'
              }`}
            >
              {locOption}
            </button>
          ))}
        </div>
      )}

      {/* RENDERIZAR TABELAS POR LOCAL */}
      {(filterLocal === 'Todos' ? locations : locations.filter(l => l === filterLocal)).map((local) => {
        const localPostos = groupedPostos[local];
        const totals = localPostos.reduce((acc, current) => ({
          qdeCargos: acc.qdeCargos + (current.qdeCargos || 0),
          total: acc.total + (current.total || 0),
          ocupados: acc.ocupados + (current.ocupados || 0),
          disponiveis: acc.disponiveis + ((current.total || 0) - (current.ocupados || 0))
        }), { qdeCargos: 0, total: 0, ocupados: 0, disponiveis: 0 });

        return (
          <div key={local} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col mx-auto w-full max-w-6xl shrink-0 animate-in slide-in-from-bottom-4 duration-500">
            {/* Título da Tabela */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[#1e3a8a]" />
              <h2 className="text-xl font-black text-[#1e3a8a] uppercase tracking-wide">Escritório • {local}</h2>
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-white border-b-2 border-gray-200">
                    <th className="py-4 px-6 font-black text-gray-800 text-sm uppercase tracking-wider w-[15%] whitespace-nowrap text-center">Postos</th>
                    <th className="py-4 px-6 font-black text-gray-800 text-sm uppercase tracking-wider w-[15%] text-center whitespace-nowrap border-l border-gray-100">Qde Cargos</th>
                    <th className="py-4 px-6 font-black text-gray-800 text-sm uppercase tracking-wider w-[15%] text-center whitespace-nowrap border-l border-gray-100">Qde. Postos</th>
                    <th className="py-4 px-6 font-black text-gray-800 text-sm uppercase tracking-wider w-[15%] text-center whitespace-nowrap border-l border-gray-100">Ocupados</th>
                    <th className="py-4 px-6 font-black text-gray-800 text-sm uppercase tracking-wider w-[15%] text-center whitespace-nowrap border-l border-gray-100">Disponíveis</th>
                    <th className="py-4 px-6 font-black text-gray-800 text-sm uppercase tracking-wider border-l border-gray-100">OBS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {localPostos.map((posto) => {
                    const isSaving = saving[posto.id];
                    const disponiveis = (posto.total || 0) - (posto.ocupados || 0);
                    
                    let displayCargo = posto.cargo;
                    if (posto.cargo === 'JUNIOR') displayCargo = 'Juniores';
                    else if (posto.cargo === 'PLENO') displayCargo = 'Plenos';
                    else if (posto.cargo === 'SENIOR') displayCargo = 'Seniores';
                    else if (posto.cargo === 'SÓCIO') displayCargo = 'Sócios';
                    else if (posto.cargo === 'CONSULTOR') displayCargo = 'Consultores';
                    else if (posto.cargo === 'ESTAG' || posto.cargo === 'ESTAGIÁRIOS') displayCargo = 'Estagiários';
                    else if (posto.cargo === 'ADM*' || posto.cargo === 'ADMINISTRATIVO') displayCargo = 'Administrativos';

                    return (
                      <tr key={posto.id} className="hover:bg-blue-50/50 transition-colors group">
                        <td className="py-3 px-6 border-r border-gray-100/50 text-center align-middle">
                          <span className="text-base tracking-wide text-gray-700 font-bold">
                            {displayCargo}
                          </span>
                        </td>
                        <td className="py-3 px-4 border-r border-gray-100/50 text-center align-middle">
                          <span className="text-xl font-black text-[#1e3a8a]">
                            {posto.qdeCargos === 0 ? '-' : posto.qdeCargos}
                          </span>
                        </td>
                        <td className="py-3 px-4 border-r border-gray-100/50 align-middle">
                          <div className="flex items-center justify-center relative">
                            <input
                              type="number"
                              defaultValue={posto.total === 0 ? '' : posto.total}
                              onBlur={(e) => handleBlur(posto.id, 'total', posto.total, e.target.value)}
                              className="w-20 text-center font-bold text-lg text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-1 px-2 rounded-sm"
                            />
                            {isSaving && <Loader2 className="w-3 h-3 text-blue-500 animate-spin absolute -right-2 top-1/2 -translate-y-1/2" />}
                          </div>
                        </td>
                        <td className="py-3 px-4 border-r border-gray-100/50 align-middle">
                          <div className="flex items-center justify-center relative">
                            <input
                              type="number"
                              defaultValue={posto.ocupados === 0 ? '' : posto.ocupados}
                              onBlur={(e) => handleBlur(posto.id, 'ocupados', posto.ocupados, e.target.value)}
                              className="w-20 text-center font-bold text-lg text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-1 px-2 rounded-sm"
                            />
                            {isSaving && <Loader2 className="w-3 h-3 text-blue-500 animate-spin absolute -right-2 top-1/2 -translate-y-1/2" />}
                          </div>
                        </td>
                        <td className="py-3 px-6 border-r border-gray-100/50 text-center align-middle">
                          <span className={`text-xl font-black ${disponiveis < 0 ? 'text-red-500' : (posto.total === 0 && posto.ocupados === 0) ? 'text-transparent' : 'text-green-600'}`}>
                            {(posto.total === 0 && posto.ocupados === 0) ? '-' : disponiveis}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle relative">
                          <input
                            type="text"
                            defaultValue={posto.obs || ''}
                            onBlur={(e) => handleBlur(posto.id, 'obs', posto.obs, e.target.value)}
                            placeholder="Adicionar observação..."
                            className="w-full font-medium text-sm text-gray-700 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-2 px-3 rounded-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* FOOTER TOTALS */}
                {localPostos.length > 0 && (
                  <tfoot>
                    <tr className="bg-yellow-300 border-t-2 border-gray-300">
                      <td className="py-4 px-6 font-black text-red-600 text-lg uppercase text-right border-r border-yellow-400/50">Total {local}</td>
                      <td className="py-4 px-6 font-black text-red-600 text-xl text-center border-r border-yellow-400/50">{totals.qdeCargos}</td>
                      <td className="py-4 px-6 font-black text-red-600 text-xl text-center border-r border-yellow-400/50">{totals.total}</td>
                      <td className="py-4 px-6 font-black text-red-600 text-xl text-center border-r border-yellow-400/50">{totals.ocupados}</td>
                      <td className="py-4 px-6 font-black text-red-600 text-xl text-center border-r border-yellow-400/50">{totals.disponiveis}</td>
                      <td className="py-4 px-6 bg-yellow-300"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
