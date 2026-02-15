import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import {
  Users,
  Gift,
  LayoutGrid,
  Award,
  Map,
  Gavel,
  RefreshCw
} from 'lucide-react';

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
  // Removed unused props
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
    setLoading(true);
    try {
      const { data: lastClients } = await supabase
        .from('clients')
        .select('*, partner:partners(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: allData } = await supabase
        .from('clients')
        .select('tipo_brinde, uf, partner:partners(name)');

      const { data: magistradosData } = await supabase
        .from('magistrados')
        .select('id');

      const brindeCounts: Record<string, number> = {};
      const socioMap: Record<string, any> = {};
      const stateMap: Record<string, number> = {};

      allData?.forEach((item: any) => {
        if (item.tipo_brinde) {
          brindeCounts[item.tipo_brinde] = (brindeCounts[item.tipo_brinde] || 0) + 1;
        }

        const socioName = item.partner?.name || 'Sem Sócio';
        if (socioName) {
          if (!socioMap[socioName]) {
            socioMap[socioName] = { name: socioName, total: 0, brindes: {} };
          }
          socioMap[socioName].total += 1;
          const tBrinde = item.tipo_brinde || 'Outro';
          socioMap[socioName].brindes[tBrinde] = (socioMap[socioName].brindes[tBrinde] || 0) + 1;
        }

        const uf = item.uf ? item.uf.toUpperCase().trim() : 'ND';
        stateMap[uf] = (stateMap[uf] || 0) + 1;
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
    <div className="flex flex-col h-full space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100">

      {/* PAGE HEADER - Identêntico ao arquivo de Clientes */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <LayoutGrid className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Dashboard Clientes
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Visão geral de clientes, brindes e magistrados
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
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


      </div>
      );
}