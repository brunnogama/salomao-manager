import { useState } from 'react'
import { Clock, Save, Loader2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Collaborator } from '../../../types/controladoria'

interface PeriodoAusenciasSectionProps {
    formData: Partial<Collaborator>
    maskDate: (v: string) => string
    isViewMode?: boolean
}

export function PeriodoAusenciasSection({ formData, maskDate, isViewMode = false }: PeriodoAusenciasSectionProps) {
    const [loading, setLoading] = useState(false)
    const [absenceStart, setAbsenceStart] = useState('')
    const [absenceEnd, setAbsenceEnd] = useState('')
    const [absenceObs, setAbsenceObs] = useState('')
    const [absenceSubtype, setAbsenceSubtype] = useState('Descanso')

    const calculateDays = (start: string, end: string) => {
        if (start.length !== 10 || end.length !== 10) return 0
        const [d1, m1, y1] = start.split('/').map(Number)
        const [d2, m2, y2] = end.split('/').map(Number)
        const date1 = new Date(y1, m1 - 1, d1)
        const date2 = new Date(y2, m2 - 1, d2)
        if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0
        const diffTime = Math.abs(date2.getTime() - date1.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        return diffDays
    }

    const getAbsenceTitle = () => {
        const type = formData.contract_type
        if (type === 'CLT' || type === 'JOVEM APRENDIZ') return 'Períodos de Férias'
        if (type === 'ESTAGIÁRIO') return 'Recesso Remunerado'
        return 'Períodos de Descanso / Recesso'
    }

    const handleSaveAbsence = async () => {
        if (!formData.id || !absenceStart || !absenceEnd) return
        setLoading(true)
        try {
            const days = calculateDays(absenceStart, absenceEnd)
            let typeLabel = 'Férias'
            if (formData.contract_type === 'ESTAGIÁRIO') typeLabel = 'Recesso Remunerado'
            if (['ADVOGADO', 'PJ'].includes(formData.contract_type || '')) {
                typeLabel = absenceSubtype
            }

            const { error } = await supabase.from('collaborator_absences').insert({
                collaborator_id: formData.id,
                type: typeLabel,
                start_date: absenceStart,
                end_date: absenceEnd,
                days_count: days,
                observation: absenceObs
            })

            if (error) throw error
            alert('Ausência registrada!')
            setAbsenceStart('')
            setAbsenceEnd('')
            setAbsenceObs('')
        } catch (e: any) {
            alert('Erro ao salvar: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 border-b border-blue-100 pb-4 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]"><Clock className="h-5 w-5" /></div>
                <h4 className="text-lg font-black text-[#0a192f]">Registrar {getAbsenceTitle()}</h4>
            </div>

            <div className="grid grid-cols-1 gap-6 max-w-3xl">
                {['ADVOGADO', 'PJ'].includes(formData.contract_type || '') && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Tipo de Ausência</label>
                        <div className="flex gap-4">
                            {['Descanso', 'Recesso fim de ano'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setAbsenceSubtype(type)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${absenceSubtype === type ? 'bg-[#1e3a8a] text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Início</label>
                        <input
                            type="text"
                            className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                            placeholder="DD/MM/AAAA"
                            maxLength={10}
                            value={absenceStart}
                            onChange={e => setAbsenceStart(maskDate(e.target.value))}
                            disabled={isViewMode}
                            readOnly={isViewMode}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fim</label>
                        <input
                            type="text"
                            className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                            placeholder="DD/MM/AAAA"
                            maxLength={10}
                            value={absenceEnd}
                            onChange={e => setAbsenceEnd(maskDate(e.target.value))}
                            disabled={isViewMode}
                            readOnly={isViewMode}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantidade de Dias</label>
                        <div className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-500">
                            {calculateDays(absenceStart, absenceEnd)} dias
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observações (Opcional)</label>
                    <textarea
                        className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm min-h-[100px] focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all resize-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder="Observações adicionais sobre o período..."
                        value={absenceObs}
                        onChange={e => setAbsenceObs(e.target.value)}
                        disabled={isViewMode}
                        readOnly={isViewMode}
                    />
                </div>

                {!isViewMode && (
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSaveAbsence}
                            disabled={loading || !absenceStart || !absenceEnd}
                            className="flex items-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-[#112240] hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Registrar Ausência
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
