import React, { useState, useEffect } from 'react';
import { X, Calendar, Save, Loader2 } from 'lucide-react';
import { useFinanceContasReceber } from '../hooks/useFinanceContasReceber';

interface FinanceModalEditarDatasProps {
    isOpen: boolean;
    onClose: () => void;
    faturaId: string;
    dataRespostaAtual?: string;
    dataRadarAtual?: string; // Usado como Prazo Fatal
}

export function FinanceModalEditarDatas({
    isOpen,
    onClose,
    faturaId,
    dataRespostaAtual,
    dataRadarAtual
}: FinanceModalEditarDatasProps) {
    const [loading, setLoading] = useState(false);
    const [dataResposta, setDataResposta] = useState('');
    const [dataFatal, setDataFatal] = useState('');
    const { atualizarDatasFatura } = useFinanceContasReceber();

    useEffect(() => {
        if (isOpen) {
            // Converter datas para formato YYYY-MM-DD para o input type="date"
            if (dataRespostaAtual) setDataResposta(dataRespostaAtual.split('T')[0]);
            if (dataRadarAtual) setDataFatal(dataRadarAtual.split('T')[0]);
        }
    }, [isOpen, dataRespostaAtual, dataRadarAtual]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Converter para ISO string mantendo a data apenas ou ajustando fuso se necessário
            // Para simplificar, vamos salvar como data + hora atual ou data + 12:00
            const isoResposta = dataResposta ? new Date(dataResposta).toISOString() : undefined;
            const isoFatal = dataFatal ? new Date(dataFatal).toISOString() : undefined;

            await atualizarDatasFatura(faturaId, isoResposta, isoFatal);
            alert('Datas atualizadas com sucesso!');
            onClose();
        } catch (error: any) {
            alert('Erro ao atualizar datas: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200">

                {/* HEADER */}
                <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1e3a8a] rounded-lg">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-[#0a192f] text-lg uppercase tracking-tight">Editar Prazos</h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-gray-100">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1">Data Resposta (Prevista)</label>
                        <input
                            type="date"
                            value={dataResposta}
                            onChange={(e) => setDataResposta(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-gray-600"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-red-600 uppercase tracking-wider ml-1">Prazo Fatal</label>
                        <input
                            type="date"
                            value={dataFatal}
                            onChange={(e) => setDataFatal(e.target.value)}
                            className="w-full px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all font-medium text-red-700"
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}
