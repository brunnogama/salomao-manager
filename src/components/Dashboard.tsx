import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Users, Gift, LayoutGrid } from 'lucide-react';

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
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-10">
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(stats.brindeCounts).map(([tipo, qtd]) => (
          <div key={tipo} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${getBrindeColor(tipo)}15`, color: getBrindeColor(tipo) }}>
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tipo}</p>
              <p className="text-xl font-black text-[#112240]">{qtd}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bloco Clientes por Sócio com UX Unificada */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <LayoutGrid className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-[#112240] text-lg">Clientes por Sócio</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.socioData.map((socio) => (
              <div key={socio.name} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-[#112240] text-sm truncate">{socio.name}</h4>
                  <div className="text-right flex items-baseline gap-1">
                    <span className="text-lg font-black text-blue-600">{socio.total}</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase">Total</span>
                  </div>
                </div>

                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={socio.brindes} margin={{ left: -30, right: 30 }}>
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="tipo" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        fontSize={9} 
                        width={80}
                        tick={{fill: '#64748b', fontWeight: 500}}
                      />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{borderRadius: '8px', border: 'none', fontSize: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                      />
                      <Bar dataKey="qtd" radius={[0, 4, 4, 0]} barSize={12}>
                        {socio.brindes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBrindeColor(entry.tipo)} />
                        ))}
                        <LabelList dataKey="qtd" position="right" style={{ fontSize: '9px', fontWeight: 'bold', fill: '#112240' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bloco Últimos Cadastros */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-fit">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-[#112240] text-lg">Últimos Cadastros</h3>
          </div>
          <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 max-h-[500px]">
            {stats.lastClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-2.5 bg-gray-50/50 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{client.nome}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{client.socio || 'Sem Sócio'}</p>
                </div>
                <span className="text-[8px] px-2 py-0.5 rounded-full font-black bg-white border border-gray-100 shadow-xs" style={{ color: getBrindeColor(client.tipo_brinde) }}>
                  {client.tipo_brinde?.split(' ')[1] || 'BRINDE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
