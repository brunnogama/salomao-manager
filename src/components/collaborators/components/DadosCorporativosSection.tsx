import { useState, useMemo } from 'react'
import { Briefcase, Calendar, Clock } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { ManagedSelect } from '../../crm/ManagedSelect'
import { differenceInMonths, differenceInYears } from 'date-fns'

interface DadosCorporativosSectionProps {
  formData: Partial<Collaborator>
  setFormData: (data: Partial<Collaborator>) => void
  maskDate: (value: string) => string
}

export function DadosCorporativosSection({
  formData,
  setFormData,
  maskDate
}: DadosCorporativosSectionProps) {
  const [activeTab, setActiveTab] = useState<'contratacao' | 'desligamento'>('contratacao')

  // Calculate duration if dates are available
  const duration = useMemo(() => {
    if (!formData.hire_date || !formData.termination_date) return null
    if (formData.hire_date.length !== 10 || formData.termination_date.length !== 10) return null

    try {
      // Assuming dd/mm/yyyy format from input mask
      const [hDay, hMonth, hYear] = formData.hire_date.split('/').map(Number)
      const [tDay, tMonth, tYear] = formData.termination_date.split('/').map(Number)

      const start = new Date(hYear, hMonth - 1, hDay)
      const end = new Date(tYear, tMonth - 1, tDay)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

      const years = differenceInYears(end, start)
      const months = differenceInMonths(end, start) % 12

      return { years, months }
    } catch (e) {
      return null
    }
  }, [formData.hire_date, formData.termination_date])

  return (
    <section className="space-y-6">
      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
        <Briefcase className="h-4 w-4" /> Dados Corporativos
      </h3>

      {/* 1. Rateio moved below into the main grid */}

      {/* TABS */}
      <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('contratacao')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${activeTab === 'contratacao'
            ? 'bg-white text-[#1e3a8a] shadow-sm'
            : 'text-gray-400 hover:text-gray-600'
            }`}
        >
          Contratação
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('desligamento')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${activeTab === 'desligamento'
            ? 'bg-white text-red-700 shadow-sm'
            : 'text-gray-400 hover:text-gray-600'
            }`}
        >
          Desligamento
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'contratacao' ? (
          /* CONTRATAÇÃO TAB */
          <div className="bg-blue-50/30 p-6 rounded-xl space-y-6 border border-blue-100/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SearchableSelect
                label="Status"
                value={formData.status || 'active'}
                onChange={(v) => {
                  const newStatus = v as 'active' | 'inactive';
                  setFormData({ ...formData, status: newStatus });
                  if (newStatus === 'inactive') setActiveTab('desligamento');
                }}
                options={[{ name: 'Ativo', id: 'active' }, { name: 'Inativo', id: 'inactive' }]}
                uppercase={false}
              />

              <ManagedSelect
                label="Rateio"
                value={formData.rateio_id || ''}
                onChange={v => setFormData({ ...formData, rateio_id: v })}
                tableName="rateios"
                placeholder="Selecione..."
              />

              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Admissão</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    className="w-full pl-9 bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
                    value={formData.hire_date || ''}
                    onChange={e => setFormData({ ...formData, hire_date: maskDate(e.target.value) })}
                    maxLength={10}
                    placeholder="DD/MM/AAAA"
                  />
                </div>
              </div>

              <ManagedSelect
                label="Motivo da Contratação"
                value={formData.hiring_reason_id || ''}
                onChange={v => setFormData({ ...formData, hiring_reason_id: v })}
                tableName="hiring_reasons"
              />

              {/* Row 2 */}
              <div className="md:col-span-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">E-mail Corporativo</label>
                <input
                  className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>

              <ManagedSelect
                label="Sócio Responsável"
                value={formData.partner_id || ''}
                onChange={v => setFormData({ ...formData, partner_id: v })}
                tableName="partners"
              />

              <ManagedSelect
                label="Líder Direto"
                value={formData.leader_id || ''}
                onChange={v => setFormData({ ...formData, leader_id: v })}
                tableName="collaborators"
              />

              {/* Row 3 */}
              <SearchableSelect
                label="Área"
                value={formData.area || ''}
                onChange={(v) => setFormData({ ...formData, area: v as any })}
                options={[
                  { id: 'Administrativa', name: 'Administrativa' },
                  { id: 'Jurídica', name: 'Jurídica' }
                ]}
                uppercase={false}
              />


              <ManagedSelect
                label="Equipe"
                value={formData.equipe || ''}
                onChange={v => setFormData({ ...formData, equipe: v })}
                tableName="teams"
              />

              <ManagedSelect
                label="Cargo"
                value={formData.role || ''}
                onChange={v => setFormData({ ...formData, role: v })}
                tableName="roles"
              />

              <SearchableSelect
                label="Tipo da Contratação"
                value={formData.contract_type || ''}
                onChange={(v) => setFormData({ ...formData, contract_type: v })}
                options={[
                  { id: 'ADVOGADO', name: 'ADVOGADO' },
                  { id: 'CLT', name: 'CLT' },
                  { id: 'ESTAGIÁRIO', name: 'ESTAGIÁRIO' },
                  { id: 'JOVEM APRENDIZ', name: 'JOVEM APRENDIZ' },
                  { id: 'PJ', name: 'PJ' }
                ]}
                uppercase={false}
              />

              {/* Row 4 */}
              <ManagedSelect
                label="Local"
                value={formData.local || ''}
                onChange={v => setFormData({ ...formData, local: v })}
                tableName="locations"
              />

              <ManagedSelect
                label="Centro de Custo"
                value={formData.centro_custo || ''}
                onChange={v => setFormData({ ...formData, centro_custo: v })}
                tableName="cost_centers"
              />
            </div>
          </div>
        ) : (
          /* DESLIGAMENTO TAB */
          <div className="space-y-6">
            <div className="bg-red-50/30 p-6 rounded-xl space-y-6 border border-red-100/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Data Desligamento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      className="w-full pl-9 bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
                      value={formData.termination_date || ''}
                      onChange={e => setFormData({ ...formData, termination_date: maskDate(e.target.value) })}
                      maxLength={10}
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                </div>

                <ManagedSelect
                  label="Iniciativa do Desligamento"
                  value={formData.termination_initiative_id || ''}
                  onChange={v => {
                    setFormData({
                      ...formData,
                      termination_initiative_id: v,
                      termination_reason_id: '',
                    })
                  }}
                  tableName="termination_initiatives"
                />

                <ManagedSelect
                  label="Tipo do Desligamento"
                  value={formData.termination_type_id || ''}
                  onChange={v => setFormData({ ...formData, termination_type_id: v })}
                  tableName="termination_types"
                />

                <ManagedSelect
                  label="Motivo"
                  value={formData.termination_reason_id || ''}
                  onChange={v => setFormData({ ...formData, termination_reason_id: v })}
                  tableName="termination_reasons"
                  filter={formData.termination_initiative_id ? {
                    column: 'initiative_id',
                    value: formData.termination_initiative_id
                  } : undefined}
                  extraInsertFields={formData.termination_initiative_id ? {
                    initiative_id: formData.termination_initiative_id
                  } : undefined}
                  disabled={!formData.termination_initiative_id}
                  placeholder={!formData.termination_initiative_id ? "Selecione a Iniciativa primeiro..." : "Selecione o Motivo..."}
                />
              </div>
            </div>

            {/* TIMELINE */}
            {formData.termination_date && duration && (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in zoom-in-95 duration-500 mt-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Linha do Tempo
                </h4>

                <div className="relative px-4 pb-2">
                  {/* Line Background */}
                  <div className="absolute top-2.5 left-0 w-full h-0.5 bg-gray-200 rounded-full" />

                  {/* Duration Badge (Centered) */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm z-10">
                    <p className="text-[10px] font-black uppercase text-gray-500 whitespace-nowrap">
                      {duration.years > 0 && `${duration.years} ano${duration.years > 1 ? 's' : ''}`}
                      {duration.years > 0 && duration.months > 0 && ' e '}
                      {duration.months > 0 && `${duration.months} m${duration.months > 1 ? 'eses' : 'ês'}`}
                      {duration.years === 0 && duration.months === 0 && 'Recente'}
                    </p>
                  </div>

                  <div className="flex justify-between relative z-0">
                    {/* Start Point */}
                    <div className="flex flex-col items-start gap-4">
                      <div className="w-5 h-5 rounded-full bg-[#1e3a8a] ring-4 ring-white relative z-10 shadow-sm" />
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Admissão</p>
                        <p className="text-sm font-bold text-[#1e3a8a]">{formData.hire_date}</p>
                      </div>
                    </div>

                    {/* End Point */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="w-5 h-5 rounded-full bg-red-500 ring-4 ring-white relative z-10 shadow-sm" />
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Desligamento</p>
                        <p className="text-sm font-bold text-red-600">{formData.termination_date}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
