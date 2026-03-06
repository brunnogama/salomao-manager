import { Briefcase } from 'lucide-react'
import { ManagedSelect } from '../../crm/ManagedSelect'
import { SearchableSelect } from '../../crm/SearchableSelect'

interface DadosProfissionaisCandidatoProps {
    formData: any
    setFormData: (data: any) => void
    isViewMode?: boolean
}

export function DadosProfissionaisCandidato({
    formData, setFormData, isViewMode = false
}: DadosProfissionaisCandidatoProps) {

    return (
        <div className="space-y-6">
            {/* INFORMAÇÕES GERAIS */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-2xl"></div>

                <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                    Informações da Vaga
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative z-[120]">
                        <SearchableSelect
                            label="Área"
                            value={formData.area || ''}
                            onChange={v => setFormData({ ...formData, area: v })}
                            options={[{ id: 'Administrativa', name: 'Administrativa' }, { id: 'Jurídica', name: 'Jurídica' }]}
                            disabled={isViewMode}
                        />
                    </div>

                    <div className="relative z-[119]">
                        <ManagedSelect
                            label="Atuação"
                            value={formData.atuacao || ''}
                            onChange={v => setFormData({ ...formData, atuacao: v })}
                            tableName="atuacoes"
                            disabled={isViewMode}
                        />
                    </div>

                    <div className="relative z-[118]">
                        <ManagedSelect
                            label="Cargo Pretendido"
                            value={formData.role || ''}
                            onChange={v => setFormData({ ...formData, role: v })}
                            tableName="roles"
                            disabled={isViewMode}
                        />
                    </div>

                    <div className="relative z-[117]">
                        <ManagedSelect
                            label="Local"
                            value={formData.local || ''}
                            onChange={v => setFormData({ ...formData, local: v })}
                            tableName="locations"
                            disabled={isViewMode}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
