import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Loader2, TrendingUp, FileText, DollarSign, Users } from 'lucide-react';

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
      <div className="flex flex-col justify-center items-center h-full gap-4 min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[#1e3a8a] animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-salomao-blue">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral da Controladoria Jurídica</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Casos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total de Casos</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.totalContracts}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-full text-blue-500">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Contratos Ativos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Contratos Ativos</p>
              <h3 className="text-3xl font-bold text-green-600 mt-1">{stats.activeContracts}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-full text-green-500">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total de Clientes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total de Clientes</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.totalClients}</h3>
            </div>
            <div className="bg-purple-50 p-3 rounded-full text-purple-500">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Receita Total */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Receita (Pró-Labore)</p>
              <h3 className="text-3xl font-bold text-salomao-gold mt-1">
                {stats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
            </div>
            <div className="bg-yellow-50 p-3 rounded-full text-salomao-gold">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem de Boas-vindas */}
      <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
        <h2 className="text-2xl font-bold text-salomao-blue mb-2">
          Bem-vindo, {userName}!
        </h2>
        <p className="text-gray-600">
          Navegue pelos menus laterais para acessar as funcionalidades do sistema de Controladoria Jurídica.
        </p>
      </div>
    </div>
  );
}