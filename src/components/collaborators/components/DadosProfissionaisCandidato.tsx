import { Briefcase } from 'lucide-react'
import { ManagedSelect } from '../../crm/ManagedSelect'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { SearchableMultiSelect } from '../../crm/SearchableMultiSelect'
import { ATUACOES_ADMINISTRATIVA, CARGOS_ADMINISTRATIVA, ATUACOES_JURIDICA, CARGOS_JURIDICA } from '../utils/cargosAtuacoesUtils'

interface DadosProfissionaisCandidatoProps {
    formData: any
    setFormData: (data: any) => void
    isViewMode?: boolean
    missingFields?: string[]
}

export function DadosProfissionaisCandidato({
    formData, setFormData, isViewMode = false, missingFields = []
}: DadosProfissionaisCandidatoProps) {
    const isMissing = (field: string) => missingFields.includes(field)
    const errorClass = 'ring-2 ring-red-500 border-red-500 bg-red-50 rounded-xl'

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
                        <label className={`block text-[9px] font-black uppercase tracking-widest mb-2 ${isMissing('area') ? 'text-red-500' : 'text-gray-400'}`}>
                            Área <span className="text-red-500 text-sm ml-0.5">*</span>
                        </label>
                        <SearchableSelect
                            value={formData.area || ''}
                            onChange={v => setFormData({ ...formData, area: v })}
                            options={[{ id: 'Administrativa', name: 'Administrativa' }, { id: 'Jurídica', name: 'Jurídica' }]}
                            disabled={isViewMode}
                            className={isMissing('area') ? errorClass : ''}
                        />
                    </div>

                    <div className="relative z-[119]">
                        <SearchableMultiSelect
                            label="Atuação"
                            value={formData.atuacao_id?.toString() || ''}
                            onChange={v => setFormData({ ...formData, atuacao_id: v || null })}
                            table="atuacoes"
                            disabled={isViewMode}
                            allowCustom={true}
                            clientFilter={(item: any) => {
                                const name = item.name || item;
                                if (formData.area === 'Jurídica') return ATUACOES_JURIDICA.includes(name);
                                if (formData.area === 'Administrativa') return ATUACOES_ADMINISTRATIVA.includes(name);
                                return true;
                            }}
                        />
                    </div>

                    <div className="relative z-[118]">
                        <label className={`block text-[9px] font-black uppercase tracking-widest mb-2 ${isMissing('role') ? 'text-red-500' : 'text-gray-400'}`}>
                            Cargo Pretendido <span className="text-red-500 text-sm ml-0.5">*</span>
                        </label>
                        <ManagedSelect
                            value={formData.role || ''}
                            onChange={v => setFormData({ ...formData, role: v })}
                            tableName="roles"
                            disabled={isViewMode}
                            className={isMissing('role') ? errorClass : ''}
                            clientFilter={(item: any) => {
                                const roleName = item.name;
                                if (formData.area === 'Jurídica') return CARGOS_JURIDICA.includes(roleName);
                                if (formData.area === 'Administrativa') return CARGOS_ADMINISTRATIVA.includes(roleName);
                                return true;
                            }}
                        />
                    </div>

                    <div className="relative z-[117]">
                        <label className={`block text-[9px] font-black uppercase tracking-widest mb-2 ${isMissing('local') ? 'text-red-500' : 'text-gray-400'}`}>
                            Local <span className="text-red-500 text-sm ml-0.5">*</span>
                        </label>
                        <ManagedSelect
                            value={formData.local || ''}
                            onChange={v => setFormData({ ...formData, local: v })}
                            tableName="locations"
                            disabled={isViewMode}
                            className={isMissing('local') ? errorClass : ''}
                        />
                    </div>
                </div>
            </div>
        </div >
    )
}
