import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  BarChart3,
  Users,
  Scale,
  FileText,
  Layers,
  Download
} from 'lucide-react';
import { Contract, Partner } from '../../../types/controladoria';
import { ContractFilters } from '../contracts/ContractFilters';
import * as XLSX from 'xlsx';

export function Volumetry() {


  const [contracts, setContracts] = useState<Contract[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros (Iguais aos de Contratos)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'name' | 'date'>('date');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');

  useEffect(() => {

    fetchData();
  }, []);



  const fetchData = async () => {
    setLoading(true);
    try {
      // Busca contratos com os relacionamentos necessários: parceiro e processos
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          *,
          partner:partners(name),
          processes:contract_processes(*)
        `);

      if (contractsError) throw contractsError;

      // Busca sócios ativos
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .eq('active', true);

      if (partnersError) throw partnersError;

      if (contractsData) {
        // Formata os dados para incluir contagens e nomes
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

  // Lógica de Filtragem (Idêntica à de Contratos)
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch =
      contract.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.cnpj && contract.cnpj.includes(searchTerm));

    const matchesStatus = statusFilter ? contract.status === statusFilter : true;
    const matchesPartner = partnerFilter ? contract.partner_id === partnerFilter : true;

    return matchesSearch && matchesStatus && matchesPartner;
  });

  // Lógica de Agrupamento por Sócio
  const metricsByPartner = partners.map(partner => {
    // Filtra os contratos (já filtrados pelos inputs) que pertencem a este sócio
    const partnerContracts = filteredContracts.filter(c => c.partner_id === partner.id);

    const contractCount = partnerContracts.length;
    // Soma a quantidade de processos de todos os contratos desse sócio
    const processCount = partnerContracts.reduce((acc, curr) => acc + (curr.process_count || 0), 0);

    return {
      id: partner.id,
      name: partner.name,
      contractCount,
      processCount,
    };
  }).sort((a, b) => b.contractCount - a.contractCount); // Ordena por quem tem mais contratos

  // Totais Gerais (Baseado nos filtros atuais)
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
    XLSX.writeFile(wb, "Volumetria_Socios.xlsx");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6 overflow-hidden">

      {/* 1. Header - Salomão Design System */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Volumetria</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Análise Quantitativa por Sócio</p>
          </div>
        </div>


        <div className="flex items-center gap-3 shrink-0">
          <button onClick={handleExport} className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all text-[9px] font-black uppercase tracking-[0.2em] shadow-sm active:scale-95">
            <Download className="h-4 w-4" /> Exportar XLS
          </button>
        </div>
      </div>

      {/* 2. Filtros Reutilizados */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <ContractFilters
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          partnerFilter={partnerFilter} setPartnerFilter={setPartnerFilter}
          partners={partners}
          sortOrder={sortOrder} setSortOrder={setSortOrder}
          viewMode={viewMode} setViewMode={setViewMode}

        />
      </div>

      {/* 3. Cards de Resumo - Salomão Design System */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contratos Filtrados</p>
            <p className="text-2xl font-black text-blue-900 mt-1">{totalContracts}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-indigo-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processos Judiciais</p>
            <p className="text-2xl font-black text-indigo-900 mt-1">{totalProcesses}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Scale className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-emerald-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sócios Ativos</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{partners.length}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl">
            <Users className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* 4. Lista de Volumetria por Sócio */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-black text-[#0a192f] uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1e3a8a]" /> Distribuição por Sócio
          </h2>
        </div>

        {loading ? (
          <div className="p-20 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin mx-auto mb-4" />
            Processando métricas...
          </div>
        ) : metricsByPartner.length === 0 ? (
          <div className="p-20 text-center">
            <EmptyState
              icon={BarChart3}
              title="Sem dados para os filtros"
              description="Ajuste os filtros de busca para visualizar a volumetria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sócio Responsável</th>
                  <th className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Contratos</th>
                  <th className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Processos</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Representatividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {metricsByPartner.map((partner) => {
                  const percentage = totalContracts > 0 ? ((partner.contractCount / totalContracts) * 100).toFixed(1) : "0";

                  return (
                    <tr key={partner.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center font-black text-xs border border-blue-100">
                            {partner.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-black text-[#0a192f] uppercase tracking-tight">{partner.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-blue-50 text-[#1e3a8a] px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-blue-100">
                          {partner.contractCount}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-purple-100">
                          {partner.processCount}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden max-w-[200px] border border-gray-200/50 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest w-12">{percentage}%</span>
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

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

// Rota para o componente EmptyState se necessário (mock para manter o arquivo completo)
function EmptyState({ icon: Icon, title, description }: any) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-xs text-gray-400 uppercase font-bold">{description}</p>
    </div>
  );
}