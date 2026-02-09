import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Users, Briefcase } from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // Caminho corrigido para subir 3 níveis
import { Contract } from '../types'; // Caminho corrigido para a pasta pai (controladoria)

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {contracts.map(c => (
         <div 
          key={c.id} 
          onClick={() => onEdit(c)} 
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#0a192f]/20 transition-all cursor-pointer relative group"
         >
            
            {/* Ações: Escondidas para Viewer */}
            {userRole !== 'viewer' && (
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(c); }} 
                    className="p-2 bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-gray-100 shadow-sm transition-all"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  {/* Excluir: Apenas Admin */}
                  {userRole === 'admin' && (
                      <button 
                        onClick={(e) => onDelete(e, c.id!)} 
                        className="p-2 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-100 shadow-sm transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                  )}
                </div>
            )}

            <div className="flex justify-between items-start mb-5">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${getStatusColor(c.status)}`}>
                {getStatusLabel(c.status)}
              </span>
            </div>

            <div className="mb-6">
              <h3 className="font-black text-[#0a192f] text-lg mb-1 line-clamp-2 leading-tight uppercase tracking-tight" title={c.client_name}>
                {c.client_name}
              </h3>
              <div className="flex items-center gap-1.5 text-gray-400">
                <Users size={12} className="shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-widest truncate">
                  {c.client_position || 'Posição não informada'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-50 pt-5 flex justify-between items-center">
               <div className="flex flex-col">
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Volumetria</span>
                 <span className="text-xs font-bold text-gray-700">{c.process_count} Processos</span>
               </div>
               <div className="flex flex-col items-end text-right max-w-[50%]">
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Responsável</span>
                 <div className="flex items-center gap-1.5 font-bold text-[#0a192f] text-xs">
                   <Briefcase size={12} className="text-amber-500" />
                   <span className="truncate uppercase tracking-tighter" title={c.partner_name}>{c.partner_name}</span>
                 </div>
               </div>
            </div>
         </div>
      ))}
    </div>
  );
}