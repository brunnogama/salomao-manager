import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Loader2, 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Users, 
  Plane, 
  UserCircle, 
  LogOut, 
  Grid,
  LayoutDashboard
} from 'lucide-react';

interface Props {
  userName: string;
  onModuleHome: () => void;
  onLogout: () => void;
}

export function Dashboard({ userName, onModuleHome, onLogout }: Props) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    totalClients: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    
    try {
      // Buscar contratos
      const { data: contracts } = await supabase
        .from('contracts')
        .select('*');

      // Buscar clientes
      const { data: clients } = await supabase
        .from('clients')
        .select('id');

      // Calcular estatísticas
      const totalContracts = contracts?.length || 0;
      const activeContracts = contracts?.filter(c => c.status === 'active').length || 0;
      const totalClients = clients?.length || 0;
      
      // Calcular receita total (pro_labore de contratos ativos)
      const totalRevenue = contracts
        ?.filter(c => c.status === 'active')
        .reduce((acc, c) => acc + (parseFloat(c.pro_labore) || 0), 0) || 0;

      setStats({
        totalContracts,
        activeContracts,
        totalClients,
        totalRevenue
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 gap-4">
        <Loader2 className="w-10 h-10 text-[#1e3a8a] animate-spin" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">
      
      {/* 1. Header - Salomão Design System */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <LayoutDashboard className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Dashboard</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Controladoria Jurídica</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-[#1e3a8a]">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button onClick={onModuleHome} className="p-2 text-gray-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors">
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Cards de Estatísticas - Salomão Design System */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Casos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Casos</p>
            <p className="text-2xl font-black text-blue-900 mt-1">{stats.totalContracts}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Contratos Ativos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-emerald-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contratos Ativos</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{stats.activeContracts}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
          </div>
        </div>

        {/* Total de Clientes */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-indigo-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Clientes</p>
            <p className="text-2xl font-black text-indigo-900 mt-1">{stats.totalClients}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        {/* Receita Total */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-amber-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Receita (Pró-Labore)</p>
            <p className="text-2xl font-black text-amber-900 mt-1">
              {stats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl">
            <DollarSign className="h-6 w-6 text-amber-600" />
          </div>
        </div>
      </div>

      {/* 3. Mensagem de Boas-vindas */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1 bg-[#1e3a8a]"></div>
        <h2 className="text-2xl font-black text-[#0a192f] mb-2 uppercase tracking-tight">
          Bem-vindo ao Sistema, {userName}!
        </h2>
        <p className="text-sm font-semibold text-gray-500 max-w-2xl">
          Sua visão geral da Controladoria Jurídica está atualizada. Utilize o menu lateral para gerenciar clientes, contratos e fluxos de trabalho.
        </p>
      </div>
    </div>
  );
}