import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Users, Briefcase } from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // Caminho corrigido para a estrutura centralizada
import { Contract } from '../types'; // Caminho corrigido para a pasta types da controladoria

interface Props {
  contracts: Contract[];
  onEdit: (c: Contract) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  getStatusColor: (s: string) => string;
  getStatusLabel: (s: string) => string;
}

export function ContractTable({ contracts, onEdit, onDelete, getStatusColor, getStatusLabel }: Props) {
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  useEffect(() => {
    checkUserRole();
  }, []);

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

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden transition-all">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#0a192f] border-b border-white/10">
            <th className="px-8 py-5 text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">Status</th>
            <th className="px-6 py-5 text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">Identificação do Cliente</th>
            <th className="px-6 py-5 text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">Banca Responsável</th>
            <th className="px-6 py-5 text-[10px] font-black text-white/70 uppercase tracking-[0.3em] text-center">Volumetria</th>
            {/* Coluna Ações: Apenas se não for Viewer */}
            {userRole !== 'viewer' && (
                <th className="px-8 py-5 text-[10px] font-black text-white/70 uppercase tracking-[0.3em] text-right">Gestão</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {contracts.length === 0 ? (
             <tr>
                <td colSpan={userRole !== 'viewer' ? 5 : 4} className="px-6 py-20 text-center bg-gray-50/30">
                    <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em]">O repositório de contratos está vazio.</p>
                </td>
             </tr>
          ) : (
            contracts.map((contract) => (
              <tr 
                key={contract.id} 
                className="hover:bg-amber-50/30 transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-amber-500" 
                onClick={() => onEdit(contract)}
              >
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(contract.status)}`}>
                    {getStatusLabel(contract.status)}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[#0a192f] uppercase tracking-tight leading-tight mb-1">{contract.client_name}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Users size={12} className="text-amber-500" /> {contract.client_position || 'AUTOR'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-[#0a192f] text-amber-500 flex items-center justify-center text-[11px] font-black shadow-lg border border-white/10">
                        {contract.partner_name?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-[#0a192f] uppercase tracking-tighter">{contract.partner_name || 'NÃO ATRIBUÍDO'}</span>
                        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.2em]">Sócio Titular</span>
                      </div>
                    </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="bg-white text-[#0a192f] px-3.5 py-1.5 rounded-xl text-[11px] font-black border border-gray-100 shadow-sm group-hover:border-amber-200 transition-all">
                    {contract.process_count || 0}
                  </span>
                </td>
                
                {/* Ações: Apenas se não for Viewer */}
                {userRole !== 'viewer' && (
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button 
                              onClick={(e) => { e.stopPropagation(); onEdit(contract); }} 
                              className="p-2.5 text-blue-500 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-100"
                              title="Editar Caso"
                          >
                              <Edit className="w-4 h-4" />
                          </button>
                          
                          {userRole === 'admin' && (
                              <button 
                                  onClick={(e) => onDelete(e, contract.id!)} 
                                  className="p-2.5 text-red-500 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100"
                                  title="Remover permanentemente"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          )}
                      </div>
                    </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}