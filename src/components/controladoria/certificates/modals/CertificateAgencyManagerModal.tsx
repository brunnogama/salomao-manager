import { useState, useEffect } from 'react';
import { X, Plus, Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { toast } from 'sonner';
import { useEscKey } from '../../../../hooks/useEscKey';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

export function CertificateAgencyManagerModal({ isOpen, onClose, onUpdate }: Props) {
    const [agencies, setAgencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) fetchAgencies();
    }, [isOpen]);

    useEscKey(isOpen, onClose);

    const fetchAgencies = async () => {
        setLoading(true);
        const { data } = await supabase.from('certificate_agencies').select('*').order('name');
        if (data) setAgencies(data);
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;

        // Check if exists
        if (agencies.some(a => a.name.toLowerCase() === newName.trim().toLowerCase())) {
            toast.error('Este cartório/órgão já existe!');
            return;
        }

        setLoading(true);
        const { error } = await supabase.from('certificate_agencies').insert([{
            name: newName.trim(),
            status: 'active'
        }]);

        if (!error) {
            toast.success('Agência adicionada com sucesso!');
            setNewName('');
            fetchAgencies();
            if (onUpdate) onUpdate();
        } else {
            toast.error('Erro ao adicionar agência: ' + error.message);
        }
        setLoading(false);
    };

    const toggleStatus = async (item: any) => {
        const newStatus = item.status === 'active' ? 'inactive' : 'active';
        const { error } = await supabase.from('certificate_agencies').update({ status: newStatus }).eq('id', item.id);

        if (!error) {
            toast.success(`Status atualizado para ${newStatus === 'active' ? 'Ativo' : 'Inativo'}`);
            fetchAgencies();
            if (onUpdate) onUpdate();
        } else {
            toast.error('Erro ao atualizar status: ' + error.message);
        }
    };

    const filteredAgencies = agencies.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col max-h-[90vh]">

                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                    <h3 className="text-lg font-black text-[#0a192f] uppercase tracking-tight">Gerenciar Cartórios</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col h-full">
                    {/* Adicionar Novo */}
                    <div className="flex gap-2 mb-6 flex-shrink-0">
                        <input
                            type="text"
                            className="flex-1 bg-gray-100/50 border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                            placeholder="Ex: Receita Federal"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        />
                        <button
                            onClick={handleAdd}
                            disabled={loading || !newName.trim()}
                            className="bg-[#1e3a8a] text-white p-3 rounded-xl hover:bg-[#112240] transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Barra de Busca Interna */}
                    <div className="relative mb-4 flex-shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold uppercase tracking-widest outline-none focus:border-[#1e3a8a] transition-all"
                            placeholder="Filtrar cartórios..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {filteredAgencies.length > 0 ? (
                            filteredAgencies.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-blue-200 transition-all">
                                    <div className="overflow-hidden pr-2">
                                        <p className={`text-sm font-bold truncate ${item.status === 'inactive' ? 'text-gray-400 line-through' : 'text-gray-700'}`} title={item.name}>
                                            {item.name}
                                        </p>
                                        <p className={`text-[9px] font-black uppercase tracking-widest ${item.status === 'active' ? 'text-emerald-500' : 'text-gray-400'}`}>
                                            {item.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toggleStatus(item)}
                                        title={item.status === 'active' ? 'Inativar' : 'Ativar'}
                                        className={`p-2 rounded-lg transition-all flex-shrink-0 ${item.status === 'active' ? 'text-emerald-600 hover:bg-emerald-100' : 'text-gray-400 hover:bg-gray-200'}`}
                                    >
                                        {item.status === 'active' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center flex flex-col items-center justify-center h-full">
                                <Search className="w-8 h-8 text-gray-200 mb-2" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum cartório cadastrado</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                    <p className="text-[9px] font-black text-center text-gray-400 uppercase tracking-tighter">
                        Órgãos/Cartórios listados no Dropdown
                    </p>
                </div>
            </div>
        </div>
    );
}
