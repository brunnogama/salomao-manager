// src/components/crm/Dashboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Users, Gift, LayoutGrid, Award, Map, Gavel, RefreshCw } from 'lucide-react';

interface SocioData {
  name: string;
  total: number;
  brindes: { tipo: string; qtd: number }[];
}

interface StateData {
  name: string;
  value: number;
}

interface DashboardStats {
  totalClients: number;
  totalMagistrados: number;
  brindeCounts: Record<string, number>;
  lastClients: any[];
  socioData: SocioData[];
  stateData: StateData[];
}

interface DashboardProps {
  onNavigateWithFilter: (page: string, filters: { socio?: string; brinde?: string }) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const color = data.payload.fill || data.color || '#1e3a8a';
    
    return (
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-lg min-w-[120px]">
        <p className="text-[9px] font-black text-[#0a192f] uppercase tracking-[0.2em] border-b border-gray-100 pb-1 mb-2">
          {label}
        </p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-600 font-semibold capitalize">
              {data.name || 'Quantidade'}:
            </span>
          </div>
          <span className="text-sm font-black text-[#0a192f]">
            {data.value}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function Dashboard({ onNavigateWithFilter }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({ 
    totalClients: 0,
    totalMagistrados: 0,
    brindeCounts: {}, 
    lastClients: [], 
    socioData: [],
    stateData: []
  });
  const [loading, setLoading] = useState(true);

  const getBrindeColor = (tipo: string) => {
    if (tipo === 'Brinde VIP') return '#1e3a8a';
    if (tipo === 'Brinde Médio') return '#3b82f6';
    return '#60a5fa';
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: lastClients } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: allData } = await supabase
        .from('clientes')
        .select('tipo_brinde, socio, estado');

      const { data: magistradosData } = await supabase
        .from('magistrados')
        .select('id');

      const brindeCounts: Record<string, number> = {};
      const socioMap: Record<string, any> = {};
      const stateMap: Record<string, number> = {};

      allData?.forEach(item => {
        if (item.tipo_brinde) {
          brindeCounts[item.tipo_brinde] = (brindeCounts[item.tipo_brinde] || 0) + 1;
        }

        if (item.socio) {
          if (!socioMap[item.socio]) {
            socioMap[item.socio] = { name: item.socio, total: 0, brindes: {} };
          }
          socioMap[item.socio].total += 1;
          const tBrinde = item.tipo_brinde || 'Outro';
          socioMap[item.socio].brindes[tBrinde] = (socioMap[item.socio].brindes[tBrinde] || 0) + 1;
        }

        const estado = item.estado ? item.estado.toUpperCase().trim() : 'ND';
        stateMap[estado] = (stateMap[estado] || 0) + 1;
      });

      const formattedSocioData = Object.values(socioMap).map((s: any) => ({
        name: s.name,
        total: s.total,
        brindes: Object.entries(s.brindes).map(([tipo, qtd]) => ({
          tipo,
          qtd: qtd as number
        }))
      })).sort((a: any, b: any) => b.total - a.total);

      const formattedStateData = Object.entries(stateMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setStats({
        totalClients: allData?.length || 0,
        totalMagistrados: magistradosData?.length || 0,
        brindeCounts,
        lastClients: lastClients || [],
        socioData: formattedSocioData,
        stateData: formattedStateData
      });
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a8a]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* PAGE HEADER COMPLETO - Título + User Info */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {/* Left: Título e Ícone */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <LayoutGrid className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Dashboard CRM
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Visão geral de clientes, brindes e magistrados
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => fetchDashboardData()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-10">
      
        {/* CARDS DE MÉTRICAS - Design System */}
        <div className="flex flex-wrap gap-4">
          
          {/* Card Total Geral (Clientes) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-3 flex-1 min-w-[180px] transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Clientes</p>
                  <p className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none mt-1">{stats.totalClients}</p>
                </div>
              </div>
          </div>

          {/* Cards de Brindes */}
          {Object.entries(stats.brindeCounts)
            .filter(([tipo]) => tipo !== 'Brinde Pequeno')
            .map(([tipo, qtd]) => (
            <div 
              key={tipo} 
              onClick={() => onNavigateWithFilter('clientes', { brinde: tipo })}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-3 cursor-pointer hover:border-[#1e3a8a]/30 hover:shadow-md transition-all flex-1 min-w-[180px] active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] line-clamp-1">{tipo}</p>
                  <p className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none mt-1">{qtd}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Separador Visual */}
          <div className="hidden lg:flex items-center justify-center mx-2">
            <div className="h-20 w-px bg-gray-200"></div>
          </div>

          {/* Card Magistrados */}
          <div 
            className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl shadow-sm border border-gray-300 flex flex-col gap-3 cursor-pointer hover:border-[#1e3a8a]/30 hover:shadow-md transition-all flex-1 min-w-[200px] active:scale-95"
            onClick={() => onNavigateWithFilter('magistrados', {})}
          >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
                  <Gavel className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Magistrados</p>
                  <p className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none mt-1">{stats.totalMagistrados}</p>
                </div>
              </div>
              <div className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">
                ÁREA RESTRITA
              </div>
          </div>

        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Bloco Clientes por Sócio */}
          <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
                <LayoutGrid className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-[20px] font-black text-[#0a192f] tracking-tight">Clientes por Sócio</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.socioData.map((socio) => (
                <div 
                  key={socio.name} 
                  className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200 hover:border-[#1e3a8a]/30 hover:shadow-md transition-all flex flex-col h-full cursor-pointer group active:scale-95"
                  onClick={() => onNavigateWithFilter('clientes', { socio: socio.name })}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-[#0a192f] text-sm leading-tight pr-2 group-hover:text-[#1e3a8a] transition-colors">{socio.name}</h4>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">{socio.total}</span>
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Total</span>
                    </div>
                  </div>

                  <div className="h-32 w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={socio.brindes} margin={{ left: -20, right: 30, top: 5, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="tipo" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          fontSize={10} 
                          width={70}
                          tick={{fill: '#64748b', fontWeight: 700}}
                          interval={0} 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', radius: 4}} />
                        <Bar dataKey="qtd" radius={[0, 8, 8, 0]} barSize={16} name="Quantidade">
                          {socio.brindes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBrindeColor(entry.tipo)} />
                          ))}
                          <LabelList dataKey="qtd" position="right" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#1f2937' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
                        <Map className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-[20px] font-black text-[#0a192f] tracking-tight">Por Estado</h3>
                  </div>
                  <div className="h-64 w-full"> 
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.stateData} layout="vertical" margin={{ left: 0, right: 30, top: 5, bottom: 5 }}>
                              <XAxis type="number" hide />
                              <YAxis 
                                  dataKey="name" 
                                  type="category" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  fontSize={12} 
                                  width={35}   
                                  tick={{fill: '#64748b', fontWeight: 700}}
                                  interval={0} 
                              />
                              <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', radius: 4}} />
                              <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24} fill="#1e3a8a" name="Clientes">
                                  <LabelList dataKey="value" position="right" style={{ fontSize: '12px', fontWeight: 'bold', fill: '#1f2937' }} />
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-fit">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-[20px] font-black text-[#0a192f] tracking-tight">Últimos</h3>
                  </div>
                  <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
                      {stats.lastClients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-[#1e3a8a]/30 hover:shadow-sm transition-all group">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-[#0a192f] truncate mb-1">{client.nome}</p>
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">
                              {client.socio || 'Sem Sócio'}
                            </p>
                          </div>
                          <span className="text-[9px] px-2.5 py-1 rounded-lg font-black bg-white border border-gray-200 shrink-0 uppercase tracking-[0.2em] text-gray-700 group-hover:border-[#1e3a8a]/30 transition-colors">
                            {client.tipo_brinde?.replace('Brinde ', '') || 'BRINDE'}
                          </span>
                      </div>
                      ))}
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
