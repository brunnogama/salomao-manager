import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Users, Briefcase } from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // Caminho corrigido para a estrutura centralizada
import { Contract } from '../../../types/controladoria'; // Caminho corrigido para a pasta types da controladoria

interface Props {
  contracts: Contract[];
  onEdit: (c: Contract) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  getStatusColor: (s: string) => string;
  getStatusLabel: (s: string) => string;
}

export function ContractCards({ contracts, onEdit, onDelete, getStatusColor, getStatusLabel }: Props) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contracts.map(c => (
         <div 
          key={c.id} 
          onClick={() => onEdit(c)} 
          className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:border-amber-200 transition-all cursor-pointer relative group overflow-hidden"
         >
            
            {/* Ações: Escondidas para Viewer */}
            {userRole !== 'viewer' && (
                <div className="absolute top-4 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 z-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(c); }} 
                    className="p-2 bg-white text-blue-500 hover:bg-blue-50 rounded-xl border border-gray-100 shadow-sm transition-all"
                    title="Editar Caso"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  {/* Excluir: Apenas Admin */}
                  {userRole === 'admin' && (
                      <button 
                        onClick={(e) => onDelete(e, c.id!)} 
                        className="p-2 bg-white text-red-500 hover:bg-red-50 rounded-xl border border-gray-100 shadow-sm transition-all"
                        title="Remover Registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                  )}
                </div>
            )}

            <div className="flex justify-between items-start mb-5">
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(c.status)}`}>
                {getStatusLabel(c.status)}
              </span>
              <span className="text-[9px] text-gray-300 font-black tracking-widest uppercase">
                {String(c.seq_id || 0).padStart(6, '0')}
              </span>
            </div>

            <div className="mb-6">
              <h3 className="font-black text-[#0a192f] text-sm mb-2 line-clamp-2 leading-tight uppercase tracking-tight" title={c.client_name}>
                {c.client_name}
              </h3>
              <div className="flex items-center gap-2 text-gray-400">
                <Users size={12} className="shrink-0 text-amber-500" />
                <p className="text-[9px] font-bold uppercase tracking-widest truncate">
                  {c.client_position || 'AUTOR'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-50 pt-5 flex justify-between items-end">
               <div className="flex flex-col">
                 <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Volumetria</span>
                 <span className="text-[10px] font-black text-[#0a192f] uppercase">{c.process_count || 0} Processos</span>
               </div>
               <div className="flex flex-col items-end text-right max-w-[60%]">
                 <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Responsável</span>
                 <div className="flex items-center gap-1.5 font-black text-[#0a192f] text-[10px]">
                   <Briefcase size={12} className="text-amber-500" />
                   <span className="truncate uppercase tracking-tighter" title={c.partner_name || 'NÃO ATRIBUÍDO'}>
                     {c.partner_name || 'PENDENTE'}
                   </span>
                 </div>
               </div>
            </div>
         </div>
      ))}
    </div>
  );
}