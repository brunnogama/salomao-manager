import { useState, useMemo } from 'react'
import { Bus, Plus, X, AlertTriangle } from 'lucide-react'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { formatCurrency, parseCurrency, getWorkingDaysInCurrentMonth } from '../utils/colaboradoresUtils';

interface Transporte {
    tipo: string;
    ida_qtd: number;
    volta_qtd: number;
    ida_valores: number[];
    volta_valores: number[];
}

interface TransporteSectionProps {
    transportes: Transporte[];
    setTransportes: (transportes: Transporte[]) => void;
    isViewMode?: boolean;
}

export function TransporteSection({
    transportes = [],
    setTransportes,
    isViewMode = false
}: TransporteSectionProps) {

    const [pendingTransportType, setPendingTransportType] = useState('');
    const [showTransporteModal, setShowTransporteModal] = useState<{
        index: number;
        type: 'ida' | 'volta';
        numValue: number;
    } | null>(null);

    const handleAddTransport = () => {
        if (!pendingTransportType) return;
        if (transportes.some(t => t.tipo === pendingTransportType)) return;

        const newTransport = {
            tipo: pendingTransportType,
            ida_qtd: 0,
            volta_qtd: 0,
            ida_valores: [],
            volta_valores: []
        };

        setTransportes([...transportes, newTransport]);
        setPendingTransportType('');
    };

    const handleRemoveTransport = (indexToRemove: number) => {
        const newTransportes = transportes.filter((_, idx) => idx !== indexToRemove);
        setTransportes(newTransportes);
    };

    const handleTransporteQtdChange = (index: number, type: 'ida' | 'volta', value: string) => {
        const rawVal = parseInt(value, 10);
        const numValue = isNaN(rawVal) ? 0 : rawVal;

        if (numValue > 3) {
            setShowTransporteModal({ index, type, numValue });
            return;
        }

        applyTransporteQtd(index, type, numValue);
    };

    const applyTransporteQtd = (index: number, type: 'ida' | 'volta', numValue: number) => {
        const currentArray = [...transportes];
        const transportToUpdate = { ...currentArray[index] };

        if (type === 'ida') {
            transportToUpdate.ida_qtd = numValue;
            transportToUpdate.ida_valores = adjustValuesArray(transportToUpdate.ida_valores || [], numValue);
        } else {
            transportToUpdate.volta_qtd = numValue;
            transportToUpdate.volta_valores = adjustValuesArray(transportToUpdate.volta_valores || [], numValue);
        }

        currentArray[index] = transportToUpdate;
        setTransportes(currentArray);
    };

    const adjustValuesArray = (arr: number[], length: number) => {
        let newArray = [...arr];
        if (newArray.length > length) {
            newArray = newArray.slice(0, length);
        } else {
            while (newArray.length < length) {
                newArray.push(0);
            }
        }
        return newArray;
    };

    const handleTransporteValorChange = (index: number, type: 'ida' | 'volta', valIdx: number, value: string) => {
        const currentArray = [...transportes];
        const transportToUpdate = { ...currentArray[index] };
        const numVal = parseCurrency(value);

        if (type === 'ida') {
            const vals = [...(transportToUpdate.ida_valores || [])];
            vals[valIdx] = isNaN(numVal) ? 0 : numVal;
            transportToUpdate.ida_valores = vals;
        } else {
            const vals = [...(transportToUpdate.volta_valores || [])];
            vals[valIdx] = isNaN(numVal) ? 0 : numVal;
            transportToUpdate.volta_valores = vals;
        }

        currentArray[index] = transportToUpdate;
        setTransportes(currentArray);
    };

    const totalTransporte = transportes.reduce((acc, t) => {
        const totalIda = (t.ida_valores || []).reduce((sum, v) => sum + (v || 0), 0);
        const totalVolta = (t.volta_valores || []).reduce((sum, v) => sum + (v || 0), 0);
        return acc + totalIda + totalVolta;
    }, 0);

    const workingDays = useMemo(() => getWorkingDaysInCurrentMonth(), []);
    const monthlyTotalTransporte = totalTransporte * workingDays;

    return (
        <div className="mt-8 pt-6 border-t border-blue-100/50">
            <h4 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest flex items-center gap-2 mb-6">
                <Bus className="h-4 w-4" /> Transporte
            </h4>

            {/* Seletor de Tipo para Adicionar Novo */}
            <div className="flex flex-col gap-2 md:w-1/3 mb-6">
                <div className="relative">
                    <SearchableSelect
                        label="Adicionar Tipo de Transporte"
                        value={pendingTransportType}
                        onChange={setPendingTransportType}
                        options={[
                            { id: 'Integração Bilhete Único', name: 'Integração Bilhete Único' },
                            { id: 'Metrô', name: 'Metrô' },
                            { id: 'Ônibus', name: 'Ônibus' },
                            { id: 'Trem', name: 'Trem' },
                            { id: 'VLT', name: 'VLT' },
                            { id: 'Barcas', name: 'Barcas' },
                            { id: 'Não Optante', name: 'Não Optante' }
                        ]}
                        uppercase={false}
                        disabled={isViewMode}
                    />
                    <button
                        type="button"
                        onClick={handleAddTransport}
                        disabled={!pendingTransportType || isViewMode}
                        className="absolute right-0 bottom-1 flex items-center justify-center h-[42px] w-[50px] bg-[#1e3a8a] text-white rounded-r-xl hover:bg-[#112240] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed border-none"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Blocos de Transporte Selecionados */}
            {transportes.length > 0 && (
                <div className="space-y-6 mb-6">
                    {transportes.map((t, idx) => {
                        const totalIda = (t.ida_valores || []).reduce((acc, curr) => acc + (curr || 0), 0);
                        const totalVolta = (t.volta_valores || []).reduce((acc, curr) => acc + (curr || 0), 0);

                        return (
                            <div key={idx} className="bg-blue-50/40 p-5 rounded-xl border border-blue-100 relative animate-in zoom-in-95">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="font-black text-[#1e3a8a] flex items-center gap-2">
                                        <Bus className="h-4 w-4 text-blue-400" /> {t.tipo}
                                    </h5>
                                    {!isViewMode && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTransport(idx)}
                                            className="text-gray-400 hover:text-red-500 rounded-full focus:outline-none transition-colors border border-gray-200 bg-white p-1"
                                            title="Remover Transporte"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* IDA */}
                                    <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <div>
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Quantidade Ida</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className={`w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                value={t.ida_qtd || ''}
                                                onChange={e => handleTransporteQtdChange(idx, 'ida', e.target.value)}
                                                placeholder="Máx 3"
                                                disabled={isViewMode}
                                                readOnly={isViewMode}
                                            />
                                        </div>
                                        {/* Campos de Valor Dinâmicos para Ida */}
                                        {Array.from({ length: t.ida_qtd || 0 }).map((_, i) => (
                                            <div key={`ida_val_${i}`}>
                                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Ida #{i + 1} (R$)</label>
                                                <input
                                                    type="text"
                                                    className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    value={formatCurrency(t.ida_valores?.[i])}
                                                    onChange={e => handleTransporteValorChange(idx, 'ida', i, e.target.value)}
                                                    disabled={isViewMode}
                                                    readOnly={isViewMode}
                                                />
                                            </div>
                                        ))}
                                        {t.ida_qtd > 0 && (
                                            <div className="text-right text-xs font-bold text-[#1e3a8a]">Subtotal: {formatCurrency(totalIda)}</div>
                                        )}
                                    </div>

                                    {/* VOLTA */}
                                    <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <div>
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Quantidade Volta</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className={`w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                value={t.volta_qtd || ''}
                                                onChange={e => handleTransporteQtdChange(idx, 'volta', e.target.value)}
                                                placeholder="Máx 3"
                                                disabled={isViewMode}
                                                readOnly={isViewMode}
                                            />
                                        </div>
                                        {/* Campos de Valor Dinâmicos para Volta */}
                                        {Array.from({ length: t.volta_qtd || 0 }).map((_, i) => (
                                            <div key={`volta_val_${i}`}>
                                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Volta #{i + 1} (R$)</label>
                                                <input
                                                    type="text"
                                                    className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    value={formatCurrency(t.volta_valores?.[i])}
                                                    onChange={e => handleTransporteValorChange(idx, 'volta', i, e.target.value)}
                                                    disabled={isViewMode}
                                                    readOnly={isViewMode}
                                                />
                                            </div>
                                        ))}
                                        {t.volta_qtd > 0 && (
                                            <div className="text-right text-xs font-bold text-[#1e3a8a]">Subtotal: {formatCurrency(totalVolta)}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {totalTransporte > 0 && (
                <div className="mt-4 p-4 bg-blue-50/70 border border-blue-200 rounded-xl shadow-sm space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-blue-200/50">
                        <span className="text-sm font-bold text-[#1e3a8a]">Custo Total Diário de Transporte:</span>
                        <span className="text-base font-black text-[#1e3a8a]">{formatCurrency(totalTransporte)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-700">Estimativa Mensal (S/ Feriado):</span>
                            <span className="text-[10px] uppercase text-gray-500 font-bold mt-1">*{workingDays} dias úteis no mês atual</span>
                        </div>
                        <span className="text-lg font-black text-emerald-600">{formatCurrency(monthlyTotalTransporte)}</span>
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL for Transport Limits */}
            {showTransporteModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-amber-500" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-center text-[#0a192f] tracking-tight mb-4">
                            Limite Excedido
                        </h2>

                        <p className="text-center text-gray-600 mb-8 font-medium">
                            Atenção: O máximo sugerido de passagens por trecho é 3. Tem certeza que deseja incluir a quantidade atípica de <strong className="text-amber-600">{showTransporteModal.numValue}</strong>?
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => setShowTransporteModal(null)}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors uppercase tracking-wider text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    applyTransporteQtd(showTransporteModal.index, showTransporteModal.type, showTransporteModal.numValue);
                                    setShowTransporteModal(null);
                                }}
                                className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors uppercase tracking-wider shadow-lg shadow-amber-500/30 text-xs"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
