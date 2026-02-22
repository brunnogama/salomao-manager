import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  Legend
} from 'recharts';
import {
  Users,
  Gift,
  LayoutGrid,
  Award,
  Map,
  Gavel,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  totalMagistrados: number;
  brindeCounts: Record<string, number>;
  lastClients: any[];
  socioData: any[]; // Extended for charts
  partnerGiftData: any[]; // New: Gifts per Partner
  giftByUFData: any[]; // New: Gifts per UF
}

interface DashboardProps {
  onNavigateWithFilter: (page: string, filters: { socio?: string; brinde?: string }) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
        <p className="font-bold text-[#0a192f] text-xs mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function Dashboard({
  onNavigateWithFilter
}: DashboardProps) {
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
    try {
      setLoading(true);

      const { data: clients, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          uf,
          tipo_brinde,
          created_at,
          partner:partners(name),
          client_contacts(count)
        `);

      if (error) throw error;

      let totalClients = 0;
      const brindeCounts: Record<string, number> = {};
      const partnerStats: Record<string, { clients: number, contacts: number, gifts: Record<string, number> }> = {};
      const ufGiftStats: Record<string, Record<string, number>> = {};

      ['Brinde VIP', 'Brinde Médio', 'Outros'].forEach(t => brindeCounts[t] = 0);

      clients?.forEach(client => {
        totalClients++;

        let type = client.tipo_brinde;
        if (type === 'Brinde Pequeno' || type === 'Outro') type = 'Outros';

        if (type && type !== 'Não recebe') {
          brindeCounts[type] = (brindeCounts[type] || 0) + 1;
        }

        const partnerName = client.partner?.name || 'Sem Sócio';
        if (!partnerStats[partnerName]) {
          partnerStats[partnerName] = { clients: 0, contacts: 0, gifts: {} };
          ['Brinde VIP', 'Brinde Médio', 'Outros'].forEach(t => partnerStats[partnerName].gifts[t] = 0);
        }
        partnerStats[partnerName].clients++;
        const contactCount = client.client_contacts?.[0]?.count || 0;
        partnerStats[partnerName].contacts += contactCount;

        if (type && type !== 'Não recebe') {
          partnerStats[partnerName].gifts[type] = (partnerStats[partnerName].gifts[type] || 0) + 1;
        }

        const uf = client.uf ? client.uf.toUpperCase().trim() : 'ND';
        if (!ufGiftStats[uf]) {
          ufGiftStats[uf] = {};
          ['Brinde VIP', 'Brinde Médio', 'Outros'].forEach(t => ufGiftStats[uf][t] = 0);
        }
        if (type && type !== 'Não recebe') {
          ufGiftStats[uf][type] = (ufGiftStats[uf][type] || 0) + 1;
        }
      });

      const { count: magistradosCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .ilike('cargo', '%Magistrado%');

      const socioData = Object.entries(partnerStats).map(([name, data]) => ({
        name,
        Clientes: data.clients,
        Contatos: data.contacts
      })).sort((a, b) => b.Clientes - a.Clientes);

      const partnerGiftData = Object.entries(partnerStats).map(([name, data]) => ({
        name,
        ...data.gifts
      })).sort((a, b) => (b['Brinde VIP'] + b['Brinde Médio']) - (a['Brinde VIP'] + a['Brinde Médio']));

      const giftByUFData = Object.entries(ufGiftStats).map(([name, gifts]) => ({
        name,
        Total: Object.values(gifts).reduce((a, b) => a + b, 0),
        ...gifts
      })).sort((a, b) => b.Total - a.Total);

      const lastClients = [...(clients || [])]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setStats({
        totalClients,
        totalMagistrados: magistradosCount || 0,
        brindeCounts,
        lastClients,
        socioData,
        stateData: [],
        partnerGiftData,
        giftByUFData
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    <div className="flex flex-col h-full space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100">

      {/* PAGE HEADER - Identêntico ao arquivo de Clientes */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <LayoutGrid className="h-6 w-6 md:h-7 md:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Dashboard Clientes
            </h1>
            <p className="text-xs md:text-sm font-semibold text-gray-500 mt-1 md:mt-0.5">
              Visão geral de clientes, brindes e magistrados
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto mt-2 md:mt-0">
          <button
            onClick={() => fetchDashboardData()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 hover:border-[#1e3a8a]/30 text-gray-600 hover:text-[#1e3a8a] rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm hover:shadow-md active:scale-95"
            title="Atualizar Dados"
          >
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-10">

        {/* 1. GIFT CARDS ROW */}
        <div className="flex flex-wrap gap-4">
          {['Brinde VIP', 'Brinde Médio', 'Outros'].map((tipo) => {
            const qtd = stats.brindeCounts[tipo] || 0;
            return (
              <div
                key={tipo}
                onClick={() => onNavigateWithFilter('clientes', { brinde: tipo })}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-3 cursor-pointer hover:border-[#1e3a8a]/30 hover:shadow-md transition-all flex-1 min-w-[200px] active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br shadow-lg" style={{ background: getBrindeColor(tipo) }}>
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] line-clamp-1">{tipo}</p>
                    <p className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none mt-1">{qtd}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. CHARTS ROW 1: Clients/Contacts per Partner & Gifts per Partner */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Chart: Clients & Contacts per Partner */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0a192f]">Clientes e Contatos por Sócio</h3>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.socioData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} interval={0} angle={-45} textAnchor="end" height={60} />
                  <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend />
                  <Bar dataKey="Clientes" fill="#1e3a8a" radius={[4, 4, 0, 0]} name="Clientes" />
                  <Bar dataKey="Contatos" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Contatos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart: Gifts per Partner */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0a192f]">Brindes por Sócio</h3>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.partnerGiftData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} interval={0} angle={-45} textAnchor="end" height={60} />
                  <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend />
                  <Bar dataKey="Brinde VIP" stackId="a" fill="#1e3a8a" />
                  <Bar dataKey="Brinde Médio" stackId="a" fill="#059669" />
                  <Bar dataKey="Outros" stackId="a" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 3. CHARTS ROW 2: Gifts per UF (Full Width) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-800">
              <Map className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0a192f]">Total de Brindes por UF</h3>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.giftByUFData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} />
                <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend />
                <Bar dataKey="Brinde VIP" stackId="a" fill="#1e3a8a" />
                <Bar dataKey="Brinde Médio" stackId="a" fill="#059669" />
                <Bar dataKey="Outros" stackId="a" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}