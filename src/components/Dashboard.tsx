import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Users, Gift, LayoutGrid, Award } from 'lucide-react';

interface SocioData {
  name: string;
  total: number;
  brindes: { tipo: string; qtd: number }[];
}

interface DashboardStats {
  totalClients: number;
  brindeCounts: Record<string, number>;
  lastClients: any[];
  socioData: SocioData[];
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ 
    totalClients: 0, 
    brindeCounts: {}, 
    lastClients: [], 
    socioData: [] 
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
        .select('tipo_brinde, socio');

      const brindeCounts: Record<string, number> = {};
      const socioMap: Record<string, any> = {};

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
      });

      const formattedSocioData = Object.values(socioMap).map((s: any) => ({
        name: s.name,
        total: s.total,
        brindes: Object.entries(s.brindes).map(([tipo, qtd]) => ({
          tipo,
          qtd: qtd as number
        }))
      }));

      setStats({
        totalClients: allData?.length || 0,
        brindeCounts,
        lastClients: lastClients || [],
        socioData: formattedSocioData
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
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD TOTAL GERAL (NOVO) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-700 group-hover:scale-110 transition-transform">
              <Award className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Geral</p>
              <p className="text-3xl font-black text-[#112240]">{stats.totalClients}</p>
            </div>
        </div>

        {/* Cards de Tipos de Brindes */}
        {Object.entries(stats.brindeCounts).map(([tipo, qtd]) => (
          <div key={tipo} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${getBrindeColor(tipo)}15`, color: getBrindeColor(tipo) }}>
              <Gift className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{tipo}</p>
              <p className="text-3xl font-black text-[#112240]">{qtd}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Bloco Clientes por Sócio */}
        <div className="xl:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><LayoutGrid className="h-6 w-6" /></div>
            <h3 className="font-bold text-[#112240] text-xl">Clientes por Sócio</h3>
          </div>
          
          {/* GRID AJUSTADO PARA 3 COLUNAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.socioData.map((socio) => (
              <div key={socio.name} className="bg-gray-50/80 p-5 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-[#112240] text-base leading-tight pr-2">{socio.name}</h4>
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
                      />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{borderRadius: '8px', border: 'none', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                      />
                      <Bar dataKey="qtd" radius={[0, 4, 4, 0]} barSize={16}>
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

        {/* Bloco Últimos Cadastros */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col h-fit">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users className="h-6 w-6" /></div>
            <h3 className="font-bold text-[#112240] text-xl">Últimos Cadastros</h3>
          </div>
          <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[600px]">
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
  );
}
