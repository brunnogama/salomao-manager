import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Users, Gift, Award, LayoutGrid } from 'lucide-react';

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
        // Contagem global de brindes
        if (item.tipo_brinde) {
          brindeCounts[item.tipo_brinde] = (brindeCounts[item.tipo_brinde] || 0) + 1;
        }

        // Agrupamento por sócio e tipo de brinde
        if (item.socio) {
          if (!socioMap[item.socio]) {
            socioMap[item.socio] = { name: item.socio, total: 0, brindes: {} };
          }
          socioMap[item.socio].total += 1;
          const tBrinde = item.tipo_brinde || 'Não Informado';
          socioMap[item.socio].brindes[tBrinde] = (socioMap[item.socio].brindes[tBrinde] || 0) + 1;
        }
      });

      // Formata os dados para o gráfico horizontal por sócio
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

  const COLORS = ['#112240', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa'];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112240]"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-10">
      
      {/* Cards de Resumo de Brindes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(stats.brindeCounts).map(([tipo, qtd]) => (
          <div key={tipo} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tipo}</p>
              <p className="text-2xl font-black text-[#112240]">{qtd}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seção Clientes por Sócio */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-[#112240] text-lg">Clientes por Sócio</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.socioData.map((socio) => (
              <div key={socio.name} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-[#112240] text-base">{socio.name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Performance Individual</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-600">{socio.total}</span>
                    <p className="text-[8px] text-gray-400 font-bold uppercase">Total</p>
                  </div>
                </div>

                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={socio.brindes} margin={{ left: -20, right: 30 }}>
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="tipo" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        fontSize={10} 
                        width={80}
                      />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                      />
                      <Bar dataKey="qtd" radius={[0, 4, 4, 0]} barSize={20}>
                        {socio.brindes.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

        {/* Lista de Últimos Cadastros */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-fit max-h-[600px]">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-[#112240]">Últimos Cadastros</h3>
          </div>
          <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
            {stats.lastClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{client.nome}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{client.socio || 'Sem Sócio'}</p>
                </div>
                <span className="text-[9px] px-2 py-1 rounded-full font-black bg-white border border-gray-100 text-[#112240] shadow-sm">
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
