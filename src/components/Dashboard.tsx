import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  Clock, 
  TrendingUp, 
  Calendar as CalendarIcon,
  MapPin,
  Briefcase,
  Plus,
  Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Colaborador } from '../types/colaborador';

export function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    desligados: 0,
    novosMes: 0
  });
  const [recentColabs, setRecentColabs] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      
      // Busca colaboradores para estatísticas
      const { data: colabs } = await supabase
        .from('colaboradores')
        .select('*');

      if (colabs) {
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

        setStats({
          total: colabs.length,
          ativos: colabs.filter(c => c.status === 'Ativo').length,
          desligados: colabs.filter(c => c.status === 'Desligado').length,
          novosMes: colabs.filter(c => new Date(c.data_admissao) >= inicioMes).length
        });

        // Pega os 5 mais recentes
        const sorted = [...colabs].sort((a, b) => 
          new Date(b.data_admissao).getTime() - new Date(a.data_admissao).getTime()
        ).slice(0, 5);
        
        setRecentColabs(sorted);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
          <CalendarIcon className="h-4 w-4" />
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Total de Colaboradores" 
          value={stats.total} 
          icon={Users} 
          trend="+2% vs mês anterior"
          color="blue" 
        />
        <DashboardCard 
          title="Colaboradores Ativos" 
          value={stats.ativos} 
          icon={UserCheck} 
          color="green" 
        />
        <DashboardCard 
          title="Novos este Mês" 
          value={stats.novosMes} 
          icon={TrendingUp} 
          color="purple" 
        />
        <DashboardCard 
          title="Desligamentos" 
          value={stats.desligados} 
          icon={UserMinus} 
          color="red" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Admissões Recentes */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Admissões Recentes
            </h3>
            <button className="text-sm text-blue-600 font-medium hover:underline">Ver todos</button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentColabs.map((colab) => (
              <div key={colab.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-100 border flex items-center justify-center overflow-hidden shadow-sm">
                    {colab.foto_url ? (
                      <img src={colab.foto_url} alt={colab.nome} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-gray-400">{colab.nome.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{colab.nome}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {colab.cargo}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {colab.local}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase">Admitido em</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(colab.data_admissao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card Auxiliar / Atalhos */}
        <div className="bg-[#112240] rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">Ações Rápidas</h3>
            <p className="text-blue-200 text-sm mb-6">Gerencie sua equipe com eficiência.</p>
            
            <div className="space-y-3">
              <QuickAction label="Cadastrar Colaborador" icon={Plus} />
              <QuickAction label="Gerar Relatório Mensal" icon={Download} />
              <QuickAction label="Gerenciar Cargos" icon={Briefcase} />
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-blue-200">Total Equipe</p>
                <p className="text-xl font-bold">{stats.ativos} Ativos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-componentes internos para manter o Dashboard conciso
function DashboardCard({ title, value, icon: Icon, trend, color }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50'
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function QuickAction({ label, icon: Icon }: any) {
  return (
    <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group">
      <span className="text-sm font-medium">{label}</span>
      <Icon className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
    </button>
  );
}