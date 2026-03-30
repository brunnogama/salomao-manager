import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { Building2, Loader2, RefreshCw, MapPin, Layout, List, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { useColaboradores } from '../hooks/useColaboradores';
import { getSegment } from '../utils/rhChartUtils';
import { RHMapaAndar31, MapElement } from '../components/RHMapaAndar31';
import { Edit3 } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [showUnassigned, setShowUnassigned] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSeatOverrides, setLocalSeatOverrides] = useState<Record<string, string>>({});
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [mapElements, setMapElements] = useState<MapElement[]>([]);

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

  const fetchMapElements = async () => {
    try {
      const { data, error } = await supabase.from('rh_mapa_elementos').select('*');
      if (error) {
        console.warn('Tabela rh_mapa_elementos não encontrada. O mapa começará vazio.');
        return;
      }
      setMapElements(data || []);
    } catch (e) {
      console.warn('Erro ao buscar db do mapa.', e);
    }
  };

  useEffect(() => {
    fetchPostos();
    fetchMapElements();
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
        const cLocName = (c as any).locations?.name || allLocations.find(l => String(l.id) === String(c.local) || String(l.id) === String((c as any).location_id))?.name || c.local;
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
        qdeCargos = localColaboradores.filter(c => matchRole(c, ['Consultor Juridico'])).length;
      } else if (posto.cargo === 'TERCEIRIZADOS' || posto.cargo === 'TERCEIRIZADO') {
        qdeCargos = localColaboradores.filter(c => matchRole(c, ['Terceirizado', 'Consultor de Marketing'])).length;
      } else if (posto.cargo === 'ESTAG' || posto.cargo === 'ESTAGIÁRIOS') {
        qdeCargos = localColaboradores.filter(c => matchRole(c, ['Estagiario'])).length;
      } else if (posto.cargo === 'ADM*' || posto.cargo === 'ADMINISTRATIVO') {
        const excludedAdminRoles = [
          'Auxiliar de Servicos Gerais',
          'Copeira',
          'Mensageiro',
          'Motorista',
          'Portador',
          'Recepcionista',
          'Secretaria'
        ].map(r => r.toLowerCase());

        qdeCargos = localColaboradores.filter(c => {
          const isAdm = getSegment(c) === 'Administrativo';
          const rawRole = rolesMap[String(c.role)] || '';
          const safeRole = rawRole.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const isExcluded = excludedAdminRoles.some(ex => safeRole.includes(ex));
          return isAdm && !isExcluded;
        }).length;
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

  // --- MAPA LOGIC ---
  const mapCollaborators = useMemo(() => {
    return activeColaboradores.map(c => ({
      ...c,
      posto: localSeatOverrides[c.id] !== undefined ? localSeatOverrides[c.id] : c.posto
    }));
  }, [activeColaboradores, localSeatOverrides]);

  const unassignedColabs = useMemo(() => {
    return mapCollaborators.filter(c => {
      const cLocId = (c as any).location_id || c.local;
      const cLocName = (c as any).locations?.name || allLocations.find(l => String(l.id) === String(cLocId))?.name || c.local;
      return cLocName === 'Rio de Janeiro' && !c.posto;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [mapCollaborators, allLocations]);

  const filteredUnassignedColabs = useMemo(() => {
    return unassignedColabs.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.roles?.name || (c as any).role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [unassignedColabs, searchTerm]);

  const handleAssignSeat = async (colabId: string, seatId: string) => {
    setLocalSeatOverrides(prev => ({ ...prev, [colabId]: seatId }));
    const { error } = await supabase.from('collaborators').update({ posto: seatId }).eq('id', colabId);
    if (error) {
      toast.error('Erro ao salvar posto no banco');
    } else {
      toast.success('Mesa atualizada!');
    }
  };

  const handleRemoveSeat = async (colabId: string) => {
    setLocalSeatOverrides(prev => ({ ...prev, [colabId]: '' }));
    await supabase.from('collaborators').update({ posto: null }).eq('id', colabId);
    toast.success('Integrante removido da mesa!');
  };

  const handleSaveMapElements = async (elements: MapElement[]) => {
    try {
      // Deleta todos os elementos atuais (pois o builder gerencia a tela toda e repassa a nova compilação)
      await supabase.from('rh_mapa_elementos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Insere as novas posições
      if (elements.length > 0) {
        const { error: insError } = await supabase.from('rh_mapa_elementos').insert(elements);
        if (insError) throw insError;
      }
      
      setMapElements(elements);
      toast.success('Layout do mapa salvo com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar mapa. Você rodou a Query SQL da tabela rh_mapa_elementos?');
    }
  };

  const handleExportPDF = async () => {
    try {
      const element = document.getElementById('mapa-31-andar-content');
      if (!element) {
        toast.error('Mapa não encontrado para exportação');
        return;
      }
      setIsExportingPDF(true);

      // Save and temporarily remove transform for crisp crisp high-scale export
      const originalTransform = element.style.transform;
      element.style.transform = 'none';
      
      let minX = 0, minY = 0, maxX = 4000, maxY = 2000;
      if (mapElements && mapElements.length > 0) {
          minX = Math.min(...mapElements.map(el => el.x));
          minY = Math.min(...mapElements.map(el => el.y));
          maxX = Math.max(...mapElements.map(el => el.x + el.width));
          maxY = Math.max(...mapElements.map(el => el.y + el.height));
      }

      const padding = 80; // respiro nas bordas
      const captureX = Math.max(0, minX - padding);
      const captureY = Math.max(0, minY - padding);
      const captureWidth = (maxX - captureX) + padding;
      const captureHeight = (maxY - captureY) + padding;

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution for A3
        useCORS: true,
        backgroundColor: '#f8fafc', // cor de fundo do sistema slate-50 para manter o look clean
        logging: false,
        x: captureX,
        y: captureY,
        width: captureWidth,
        height: captureHeight,
      });
      
      // Restore the visual scaling for the screen
      element.style.transform = originalTransform;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasRatio = canvas.height / canvas.width;
      const pdfRatio = pdfHeight / pdfWidth;

      let finalWidth = pdfWidth;
      let finalHeight = pdfHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > pdfRatio) {
        finalWidth = pdfHeight / canvasRatio;
        offsetX = (pdfWidth - finalWidth) / 2;
      } else {
        finalHeight = pdfWidth * canvasRatio;
        offsetY = (pdfHeight - finalHeight) / 2;
      }

      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      
      pdf.addImage(imgData, 'JPEG', offsetX, offsetY, finalWidth, finalHeight, undefined, 'FAST');
      pdf.save('Mapa_31_Andar.pdf');
      toast.success('PDF exportado com sucesso!');

    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Ocorreu um erro ao gerar o PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6 pb-24 overflow-y-auto no-scrollbar">
      {/* PAGE HEADER COMPLETO - Título + Actions */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-500 shrink-0">
        {/* Left: Título e Ícone */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none flex items-center gap-3">
                Gestão de Postos Físicos
                {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Controle de painel de estações de trabalho divididas por escritório
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 xl:pb-0 w-full xl:w-auto justify-end mt-2 xl:mt-0 custom-scrollbar">
          
          {/* Locais Tabs */}
          {viewMode === 'table' && postos.length > 0 && locations.length > 0 && (
            <div className="flex items-center bg-gray-100/80 p-1 rounded-xl shrink-0 mr-1 sm:mr-2">
              {['Todos', ...locations].map(locOption => (
                <button
                  key={locOption}
                  onClick={() => setFilterLocal(locOption)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${filterLocal === locOption ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <MapPin className="h-4 w-4" /> {locOption}
                </button>
              ))}
            </div>
          )}

          {/* View Mode */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'table' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List className="h-4 w-4" /> Tabelas
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'map' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Layout className="h-4 w-4" /> Mapa
            </button>
          </div>

          {viewMode === 'map' && (
            <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-xl shrink-0 ml-2">
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${isEditMode ? 'bg-blue-600 text-white shadow-sm border border-blue-600' : 'text-gray-500 hover:text-gray-700 bg-white border border-transparent'}`}
              >
                <Edit3 className="h-4 w-4" /> Design
              </button>
              
              <button
                onClick={() => setShowUnassigned(!showUnassigned)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${!showUnassigned ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {!showUnassigned ? 'Mostrar Sem Mesa' : 'Ocultar Sem Mesa'}
              </button>
              
              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                title="Exportar Mapa em PDF A3"
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap bg-gradient-to-r from-red-600 to-red-500 text-white shadow-sm hover:from-red-700 hover:to-red-600 disabled:opacity-50"
              >
                {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} PDF
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 border-l border-gray-100 pl-4 ml-2">
            <button
              onClick={fetchPostos}
              disabled={loading}
              className="flex items-center justify-center w-10 h-10 bg-[#1e3a8a] text-white rounded-full hover:bg-blue-800 transition-all shadow-lg shadow-blue-500/30 shrink-0"
              title="Atualizar Dados"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {postos.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center flex flex-col items-center max-w-6xl mx-auto w-full">
          <Building2 className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Nenhum dado encontrado na tabela rh_postos.</p>
          <p className="text-xs text-gray-400 mt-1">Execute o script do banco de dados para popular os postos de Rio e SP.</p>
        </div>
      )}

      {/* RENDERIZAR VISÃO MAPA */}
      {viewMode === 'map' && (
        <div className="flex flex-col lg:flex-row gap-6 mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 min-h-[600px] overflow-hidden">
          {/* Lado Esquerdo: Integrantes sem mesa */}
          {showUnassigned && (
            <div className="w-full lg:w-72 shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[600px] lg:h-auto overflow-hidden animate-in slide-in-from-left duration-300">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-[#1e3a8a] uppercase tracking-wide">Sem Mesa (RJ)</h2>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-full">{filteredUnassignedColabs.length}</span>
                </div>
                <button 
                  onClick={() => setShowUnassigned(false)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-3 border-b border-gray-100 bg-white">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar nome ou cargo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/30"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const colabId = e.dataTransfer.getData('colabId');
                  if (colabId) handleRemoveSeat(colabId); // Remove do Posto ao arrastar pra lista
                }}
              >
                {filteredUnassignedColabs.length === 0 ? (
                  <div className="text-center p-6 text-gray-400 font-medium text-xs">
                    {searchTerm ? 'Nenhum resultado' : 'Todos possuem mesas designadas no RJ.'}
                  </div>
                ) : (
                  filteredUnassignedColabs.map(c => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', String(c.id));
                        e.dataTransfer.setData('colabId', String(c.id));
                      }}
                      className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                          {c.foto_url || c.photo_url ? (
                            <img src={c.foto_url || c.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-gray-400">{(c.name || '').charAt(0)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-800 truncate">{c.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{c.roles?.name || c.role}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Lado Direito: Mapa Principal */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col items-center min-w-0">
            <div className="w-full flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black text-gray-800 tracking-tight">31º Andar <span className="text-gray-400 font-medium">• Rio de Janeiro</span></h2>
                <div id="map-toolbar-portal" className="flex items-center"></div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase"><div className="w-2 h-2 rounded-full bg-[#1e3a8a]"></div>Jurídico</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase"><div className="w-2 h-2 rounded-full bg-orange-500"></div>ADM</div>
              </div>
            </div>

            <RHMapaAndar31 
              collaborators={mapCollaborators}
              mapElements={mapElements}
              isEditMode={isEditMode}
              onAssignSeat={handleAssignSeat}
              onRemoveSeat={handleRemoveSeat}
              onSaveMap={handleSaveMapElements}
            />
          </div>
        </div>
      )}

      {/* RENDERIZAR VISÃO TABELAS */}
      {viewMode === 'table' && (filterLocal === 'Todos' ? locations : locations.filter(l => l === filterLocal)).map((local) => {
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
                    <tr className="bg-[#1e3a8a] border-t-2 border-transparent">
                      <td className="py-4 px-6 font-black text-white text-lg uppercase text-right border-r border-blue-800/50">Total {local}</td>
                      <td className="py-4 px-6 font-black text-white text-xl text-center border-r border-blue-800/50">{totals.qdeCargos}</td>
                      <td className="py-4 px-6 font-black text-white text-xl text-center border-r border-blue-800/50">{totals.total}</td>
                      <td className="py-4 px-6 font-black text-white text-xl text-center border-r border-blue-800/50">{totals.ocupados}</td>
                      <td className="py-4 px-6 font-black text-white text-xl text-center border-r border-blue-800/50">{totals.disponiveis}</td>
                      <td className="py-4 px-6 bg-[#1e3a8a]"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {/* Disclaimer para Administrativos e Consultores */}
            <div className="bg-blue-50/50 border-t border-blue-100 px-6 py-3.5 text-xs text-[#1e3a8a] flex items-start gap-2">
              <span className="font-bold text-lg leading-none mt-[-2px]">*</span>
              <p className="leading-snug opacity-90">
                A contagem de <strong className="font-bold">Administrativos</strong> exclui: Auxiliar de Serviços Gerais, Copeira, Mensageiro, Motorista, Portador, Recepcionista e Secretária. <br/>A contagem de <strong className="font-bold">Consultores</strong> considera exclusivamente Consultor Jurídico (Consultor de Marketing entra em Terceirizados).
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
