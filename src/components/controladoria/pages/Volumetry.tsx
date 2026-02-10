import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { BarChart3, Users, Scale, FileText, Layers, Shield } from 'lucide-react';
import { Contract, Partner } from '../types'; // Rota corrigida para a pasta pages
import { ContractFilters } from '../contracts/ContractFilters'; 
import * as XLSX from 'xlsx';

interface VolumetryProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

// CORREÇÃO: Nome da função alterado de Volumetria para Volumetry para bater com o import do App.tsx
export function Volumetry({ userName, onModuleHome, onLogout }: VolumetryProps) {
  // --- ROLE STATE ---
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'name' | 'date'>('date');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card'); 

  useEffect(() => {
    checkUserRole();
    fetchData();
  }, []);

  // --- ROLE CHECK ---
  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile) {
            setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
        }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          *,
          partner:partners(name),
          processes:contract_processes(*)
        `);

      if (contractsError) throw contractsError;

      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .eq('active', true);

      if (partnersError) throw partnersError;

      if (contractsData) {
        const formattedContracts = contractsData.map((c: any) => ({
          ...c,
          partner_name: c.partner?.name || 'Sem Sócio',
          process_count: c.processes?.length || 0
        }));
        setContracts(formattedContracts);
      }

      if (partnersData) setPartners(partnersData);

    } catch (error) {
      console.error('Erro ao carregar volumetria:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.cnpj && contract.cnpj.includes(searchTerm));
    
    const matchesStatus = statusFilter ? contract.status === statusFilter : true;
    const matchesPartner = partnerFilter ? contract.partner_id === partnerFilter : true;

    return matchesSearch && matchesStatus && matchesPartner;
  });

  const metricsByPartner = partners.map(partner => {
    const partnerContracts = filteredContracts.filter(c => c.partner_id === partner.id);
    const contractCount = partnerContracts.length;
    const processCount = partnerContracts.reduce((acc, curr) => acc + (curr.process_count || 0), 0);

    return {
      id: partner.id,
      name: partner.name,
      contractCount,
      processCount,
    };
  }).sort((a, b) => b.contractCount - a.contractCount);

  const totalContracts = filteredContracts.length;
  const totalProcesses = filteredContracts.reduce((acc, c) => acc + (c.process_count || 0), 0);

  const handleExport = () => {
    const exportData = metricsByPartner.map(m => ({
        'Sócio': m.name,
        'Qtd. Contratos': m.contractCount,
        'Qtd. Processos': m.processCount
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Volumetria");
    XLSX.writeFile(wb, `Volumetria_Banca_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  return (
    <div className="p-8 animate-in fade-in duration-500 bg-[#f8fafc] min-h-screen">
      <div className="mb-10">
        <h1 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.4em] flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-[#0a192f] text-white shadow-lg">
            <BarChart3 className="w-6 h-6 text-amber-500" />
          </div>
          Métricas de Volumetria
        </h1>
        <div className="flex items-center gap-3 mt-4 ml-[60px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Análise de ocupação e densidade processual por unidade de negócio.</p>
            {userRole && (
                <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase border flex items-center gap-1.5 ${
                    userRole === 'admin' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                        : 'bg-gray-50 text-gray-500 border-gray-100'
                }`}>
                    <Shield className="w-3 h-3" />
                    {userRole === 'admin' ? 'Administrador' : userRole === 'editor' ? 'Editor' : 'Visualizador'}
                </span>
            )}
        </div>
      </div>

      <div className="mb-8">
        <ContractFilters
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          partnerFilter={partnerFilter} setPartnerFilter={setPartnerFilter}
          partners={partners}
          sortOrder={sortOrder} setSortOrder={setSortOrder}
          viewMode={viewMode} setViewMode={setViewMode} 
          onExport={handleExport}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-xl">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Escopo de Contratos</p>
            <p className="text-4xl font-black text-[#0a192f] mt-2 tracking-tighter">{totalContracts}</p>
          </div>
          <div className="bg-blue-50 p-5 rounded-2xl text-blue-600 shadow-inner">
            <FileText className="w-7 h-7" />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-xl">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Massa Processual</p>
            <p className="text-4xl font-black text-amber-600 mt-2 tracking-tighter">{totalProcesses}</p>
          </div>
          <div className="bg-amber-50 p-5 rounded-2xl text-amber-500 shadow-inner">
            <Scale className="w-7 h-7" />
          </div>
        </div>
        <div className="bg-[#0a192f] p-8 rounded-[2.5rem] shadow-2xl flex items-center justify-between transition-all border border-white/10">
          <div>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Células Estratégicas</p>
            <p className="text-4xl font-black text-white mt-2 tracking-tighter">{partners.length}</p>
          </div>
          <div className="bg-white/10 p-5 rounded-2xl text-amber-500">
            <Users className="w-7 h-7" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0a192f]">
          <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-4">
            <Layers className="w-5 h-5 text-amber-500" /> Matriz de Distribuição por Sócio
          </h2>
        </div>
        
        {loading ? (
            <div className="p-32 text-center flex flex-col items-center gap-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sincronizando BI...</p>
            </div>
        ) : metricsByPartner.length === 0 ? (
            <div className="p-32 text-center bg-gray-50/50">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhum registro para os filtros aplicados.</p>
            </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="p-8 pl-10">Unidade de Negócio</th>
                  <th className="p-8 text-center">Portfolio</th>
                  <th className="p-8 text-center">Densidade</th>
                  <th className="p-8 pr-10">Market Share Interno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {metricsByPartner.map((partner) => {
                  const percentage = totalContracts > 0 ? ((partner.contractCount / totalContracts) * 100).toFixed(1) : "0";
                  
                  return (
                    <tr key={partner.id} className="hover:bg-amber-50/20 transition-all group">
                      <td className="p-8 pl-10">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-[#0a192f] text-amber-500 flex items-center justify-center font-black text-sm shadow-xl border border-white/10 group-hover:scale-110 transition-transform">
                            {partner.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-black text-[#0a192f] uppercase tracking-tighter">{partner.name}</span>
                        </div>
                      </td>
                      <td className="p-8 text-center">
                        <span className="bg-[#0a192f] text-white px-4 py-1.5 rounded-xl text-[11px] font-black border border-[#0a192f] shadow-lg">
                          {partner.contractCount}
                        </span>
                      </td>
                      <td className="p-8 text-center">
                        <span className="bg-amber-50 text-amber-700 px-4 py-1.5 rounded-xl text-[11px] font-black border border-amber-200">
                          {partner.processCount} <span className="text-[8px] opacity-50 ml-1">ITENS</span>
                        </span>
                      </td>
                      <td className="p-8 pr-10">
                        <div className="flex items-center gap-6">
                          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden max-w-[250px] shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] font-black text-[#0a192f] w-14">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}