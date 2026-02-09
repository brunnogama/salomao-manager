import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Users, Briefcase } from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // Caminho corrigido
import { Contract } from '../types'; // Caminho corrigido

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#0a192f] border-b border-white/10">
            <th className="px-6 py-4 text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Cliente / Posição</th>
            <th className="px-6 py-4 text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Responsável</th>
            <th className="px-6 py-4 text-[10px] font-black text-white/70 uppercase tracking-[0.2em] text-center">Volumetria</th>
            {/* Coluna Ações: Apenas se não for Viewer */}
            {userRole !== 'viewer' && (
                <th className="px-6 py-4 text-[10px] font-black text-white/70 uppercase tracking-[0.2em] text-right">Ações</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {contracts.length === 0 ? (
             <tr>
                <td colSpan={userRole !== 'viewer' ? 5 : 4} className="px-6 py-12 text-center">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Nenhum contrato encontrado no sistema.</p>
                </td>
             </tr>
          ) : (
            contracts.map((contract) => (
              <tr 
                key={contract.id} 
                className="hover:bg-gray-50/80 transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-[#0a192f]" 
                onClick={() => onEdit(contract)}
              >
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${getStatusColor(contract.status)}`}>
                    {getStatusLabel(contract.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-[#0a192f] uppercase tracking-tight leading-tight">{contract.client_name}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                      <Users size={10} /> {contract.client_position || '-'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0a192f] to-[#1e3a8a] text-white flex items-center justify-center text-[11px] font-black shadow-sm">
                        {contract.partner_name?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-tighter">{contract.partner_name || '-'}</span>
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Sócio Responsável</span>
                      </div>
                    </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-[11px] font-black border border-gray-200 shadow-inner">
                    {contract.process_count}
                  </span>
                </td>
                
                {/* Ações: Apenas se não for Viewer */}
                {userRole !== 'viewer' && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button 
                              onClick={(e) => { e.stopPropagation(); onEdit(contract); }} 
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100"
                              title="Editar"
                          >
                              <Edit className="w-4 h-4" />
                          </button>
                          
                          {userRole === 'admin' && (
                              <button 
                                  onClick={(e) => onDelete(e, contract.id!)} 
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                                  title="Excluir"
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