import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Users, Gift, LayoutGrid, TrendingUp } from 'lucide-react';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112240]"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-4 custom-scrollbar space-y-8 pb-10 animate-fadeIn">
      
      {/* Cards de Resumo com Efeito Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(stats.brindeCounts).map(([tipo, qtd]) => (
          <div key={tipo} className="relative group overflow-hidden bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 flex items-center gap-4 transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-100/50 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
            <div className="p-3 rounded-2xl shadow-inner" style={{ backgroundColor: `${getBrindeColor(tipo)}15`, color: getBrindeColor(tipo) }}>
              <Gift className="h-6 w-6" />
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1">{tipo}</p>
              <p className="text-3xl font-black text-[#112240] tracking-tight">{qtd}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bloco Clientes por Sócio */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-lg p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-white/60">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
                <LayoutGrid className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-[#112240] text-xl tracking-tight">Clientes por Sócio</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
              <TrendingUp className="h-3 w-3" />
              ATIVIDADE TOTAL: {stats.totalClients}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.socioData.map((socio) => (
              <div key={socio.name} className="group bg-white/50 p-6 rounded-2xl border border-gray-100 transition-all hover:border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-blue-900/[0.03]">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-[#112240] text-base group-hover:text-blue-700 transition-colors">{socio.name}</h4>
                  <div className="px-3 py-1 bg-white shadow-sm rounded-lg border border-gray-50">
                    <span className="text-lg font-black text-[#112240]">{socio.total}</span>
                  </div>
                </div>

                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={socio.brindes} margin={{ left: -30, right: 35 }}>
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="tipo" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        fontSize={10} 
                        width={85}
                        tick={{fill: '#94a3b8', fontWeight: 600}}
                      />
                      <Tooltip 
                        cursor={{fill: 'rgba(0,0,0,0.02)', radius: 4}}
                        contentStyle={{borderRadius: '12px', border: 'none', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                      />
                      <Bar dataKey="qtd" radius={[0, 10, 10, 0]} barSize={14}>
                        {socio.brindes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBrindeColor(entry.tipo)} />
                        ))}
                        <LabelList dataKey="qtd" position="right" style={{ fontSize: '10px', fontWeight: '800', fill: '#64748b' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bloco Últimos Cadastros com UX Premium */}
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-white/60 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-[#112240] text-xl tracking-tight">Recentes</h3>
          </div>
          <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[500px]">
            {stats.lastClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center font-bold text-gray-400 text-xs border border-gray-100">
                    {client.nome?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{client.nome}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{client.socio || 'Sem Sócio'}</p>
                  </div>
                </div>
                <div 
                  className="w-2 h-2 rounded-full shadow-[0_0_8px_currentcolor]" 
                  style={{ backgroundColor: getBrindeColor(client.tipo_brinde), color: getBrindeColor(client.tipo_brinde) }} 
                  title={client.tipo_brinde}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
