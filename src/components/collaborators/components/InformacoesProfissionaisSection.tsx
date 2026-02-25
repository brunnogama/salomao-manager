// src/components/collaborators/components/InformacoesProfissionaisSection.tsx
import { GraduationCap } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'

const ESTADOS_BRASIL_UF = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

interface InformacoesProfissionaisSectionProps {
  formData: Partial<Collaborator>
  setFormData: (data: Partial<Collaborator>) => void
  maskDate: (value: string) => string
}

export function InformacoesProfissionaisSection({
  formData,
  setFormData,
  maskDate
}: InformacoesProfissionaisSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
        <GraduationCap className="h-4 w-4" /> Dados Profissionais
      </h3>

      {/* OAB Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Número OAB
          </label>
          <input
            className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
            value={formData.oab_numero || ''}
            onChange={e => setFormData({ ...formData, oab_numero: e.target.value })}
            placeholder="Ex: 123456"
          />
        </div>

        <SearchableSelect
          label="UF OAB"
          value={formData.oab_uf || ''}
          onChange={v => setFormData({ ...formData, oab_uf: v.toUpperCase() })}
          options={ESTADOS_BRASIL_UF.map(uf => ({ name: uf }))}
          placeholder="Selecione..."
          uppercase={true}
        />

        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Emissão OAB
          </label>
          <input
            className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
            value={formData.oab_emissao || ''}
            onChange={e => setFormData({ ...formData, oab_emissao: maskDate(e.target.value) })}
            maxLength={10}
            placeholder="DD/MM/AAAA"
          />
        </div>
      </div>

      {/* CTPS Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
              CTPS Número
            </label>
            <label className="flex items-center gap-1 cursor-pointer group">
              <input
                type="checkbox"
                className="w-3 h-3 text-[#1e3a8a] bg-gray-100 border-gray-300 rounded focus:ring-[#1e3a8a] cursor-pointer"
                onChange={(e) => {
                  if (e.target.checked && formData.cpf) {
                    setFormData({ ...formData, ctps_numero: formData.cpf.replace(/\D/g, '').slice(0, 11) })
                  }
                }}
              />
              <span className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest group-hover:text-[#112240] transition-colors">Digital</span>
            </label>
          </div>
          <input
            className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
            value={formData.ctps_numero || ''}
            onChange={e => setFormData({ ...formData, ctps_numero: e.target.value.replace(/\D/g, '') })}
            maxLength={11}
            placeholder="999999"
          />
        </div>
        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            CTPS Série
          </label>
          <input
            className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
            value={formData.ctps_serie || ''}
            onChange={e => setFormData({ ...formData, ctps_serie: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            maxLength={4}
            placeholder="0000"
          />
        </div>
        <SearchableSelect
          label="CTPS UF"
          value={formData.ctps_uf || ''}
          onChange={v => setFormData({ ...formData, ctps_uf: v.toUpperCase() })}
          options={ESTADOS_BRASIL_UF.map(uf => ({ name: uf }))}
          placeholder="UF"
          uppercase={true}
        />
      </div>

      {/* PIS/Matricula/Militar Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            PIS/PASEP
          </label>
          <input
            className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
            value={formData.pis_pasep || ''}
            onChange={e => setFormData({ ...formData, pis_pasep: e.target.value.replace(/\D/g, '').slice(0, 11) })}
            maxLength={11}
            placeholder="99999999999"
          />
        </div>

        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Matrícula e-Social
          </label>
          <input
            className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
            value={formData.matricula_esocial || ''}
            onChange={e => setFormData({ ...formData, matricula_esocial: e.target.value })}
            placeholder="Matrícula"
          />
        </div>

        {formData.gender === 'Masculino' && (
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Dispensa Militar
            </label>
            <input
              className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
              value={formData.dispensa_militar || ''}
              onChange={e => setFormData({ ...formData, dispensa_militar: e.target.value.replace(/[^\d.]/g, '') })}
              placeholder="99.999.999999.9"
            />
          </div>
        )}
      </div>
    </section>
  )
}