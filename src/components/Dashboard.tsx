import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Users, Gift, LayoutGrid, Award, Map, Gavel } from 'lucide-react';

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
    const color = data.payload.fill || data.color || '#3b82f6';
    
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 min-w-[140px] animate-fadeIn">
        <p className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-1 mb-2 capitalize">
          {label}
        </p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500 font-medium capitalize">
              {data.name || 'Quantidade'}:
            </span>
          </div>
          <span className="text-sm font-bold text-[#112240]">
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
    if (tipo === 'Brinde VIP') return '#a855f7'; 
    if (tipo === 'Brinde Médio') return '#22c55e'; 
    return '#94a3b8'; 
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

      // Buscar total de magistrados
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
      }));

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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#112240]"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-10">
      
      {/* CARDS DE MÉTRICAS - LINHA ÚNICA */}
      <div className="flex flex-wrap gap-4">
        
        {/* Card Total Geral (Clientes) */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3 relative overflow-hidden group flex-1 min-w-[180px]">
            <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-700">
                <Award className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Clientes</p>
                <p className="text-3xl font-black text-[#112240] leading-none mt-1">{stats.totalClients}</p>
              </div>
            </div>
        </div>

        {/* Cards de Brindes - Filtrar apenas os tipos corretos */}
        {Object.entries(stats.brindeCounts)
          .filter(([tipo]) => tipo !== 'Brinde Pequeno') // Remover tipo antigo
          .map(([tipo, qtd]) => (
          <div 
            key={tipo} 
            onClick={() => onNavigateWithFilter('clientes', { brinde: tipo })}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all flex-1 min-w-[180px]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${getBrindeColor(tipo)}15`, color: getBrindeColor(tipo) }}>
                <Gift className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide line-clamp-1">{tipo}</p>
                <p className="text-3xl font-black text-[#112240] leading-none mt-1">{qtd}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Separador Visual */}
        <div className="hidden lg:flex items-center justify-center mx-2">
          <div className="h-20 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
        </div>

        {/* Card Magistrados (Separado) */}
        <div 
          className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-xl shadow-sm border-2 border-amber-200 flex flex-col gap-3 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group relative overflow-hidden flex-1 min-w-[200px]"
          onClick={() => onNavigateWithFilter('magistrados', {})}
        >
            <div className="absolute right-0 top-0 h-full w-1 bg-amber-600"></div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 group-hover:scale-110 transition-transform">
                <Gavel className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Magistrados</p>
                <p className="text-3xl font-black text-amber-900 leading-none mt-1">{stats.totalMagistrados}</p>
              </div>
            </div>
            <div className="absolute bottom-2 right-3 text-[9px] text-amber-600/60 font-bold">
              ÁREA RESTRITA
            </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Bloco Clientes por Sócio */}
        <div className="xl:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><LayoutGrid className="h-6 w-6" /></div>
            <h3 className="font-bold text-[#112240] text-xl">Clientes por Sócio</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.socioData.map((socio) => (
              <div 
                key={socio.name} 
                className="bg-gray-50/80 p-5 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors flex flex-col h-full cursor-pointer group"
                onClick={() => onNavigateWithFilter('clientes', { socio: socio.name })}
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-[#112240] text-base leading-tight pr-2 group-hover:text-blue-700">{socio.name}</h4>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-2xl font-black text-blue-600 leading-none">{socio.total}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Total</span>
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
                        tick={{fill: '#64748b', fontWeight: 600}}
                        interval={0} 
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', radius: 4}} />
                      <Bar dataKey="qtd" radius={[0, 4, 4, 0]} barSize={16} name="Quantidade">
                        {socio.brindes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBrindeColor(entry.tipo)} />
                        ))}
                        <LabelList dataKey="qtd" position="right" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#112240' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Map className="h-6 w-6" /></div>
                    <h3 className="font-bold text-[#112240] text-xl">Por Estado</h3>
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
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} fill="#6366f1" name="Clientes">
                                <LabelList dataKey="value" position="right" style={{ fontSize: '12px', fontWeight: 'bold', fill: '#112240' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col h-fit">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users className="h-6 w-6" /></div>
                    <h3 className="font-bold text-[#112240] text-xl">Últimos</h3>
                </div>
                <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
                    {stats.lastClients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all group">
                        <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate mb-1">{client.nome}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide group-hover:text-blue-600 transition-colors">
                            {client.socio || 'Sem Sócio'}
                        </p>
                        </div>
                        <span 
                        className="text-[10px] px-3 py-1 rounded-full font-bold bg-white border border-gray-200 shadow-sm shrink-0 uppercase tracking-wider" 
                        style={{ color: getBrindeColor(client.tipo_brinde), borderColor: `${getBrindeColor(client.tipo_brinde)}30` }}
                        >
                        {client.tipo_brinde?.replace('Brinde ', '') || 'BRINDE'}
                        </span>
                    </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}