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
  isViewMode?: boolean
  showOab?: boolean
}

export function InformacoesProfissionaisSection({
  formData,
  setFormData,
  maskDate,
  isViewMode = false,
  showOab = false
}: InformacoesProfissionaisSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
        <GraduationCap className="h-4 w-4" /> Dados Profissionais
      </h3>

      {/* OAB Section */}
      {showOab && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest flex items-center gap-2">
              Inscrições OAB
            </h4>
            {!isViewMode && (
              <button
                type="button"
                onClick={() => {
                  const currentOabs = formData.oabs || (formData.oab_numero ? [{ numero: formData.oab_numero, uf: formData.oab_uf || '', tipo: 'Principal', validade: formData.oab_emissao || '' }] : []);
                  setFormData({
                    ...formData,
                    oabs: [...currentOabs, { numero: '', uf: '', tipo: 'Suplementar', validade: '' }]
                  });
                }}
                className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded transition-colors"
                title="Adicionar OAB Suplementar"
              >
                + Suplementar
              </button>
            )}
          </div>

          {(formData.oabs?.length ? formData.oabs : (formData.oab_numero ? [{ numero: formData.oab_numero || '', uf: formData.oab_uf || '', tipo: 'Principal', validade: formData.oab_emissao || '' }] : [{ numero: '', uf: '', tipo: 'Principal', validade: '' }])).map((oab, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100 relative group">
              {oab.tipo === 'Principal' ? (
                <div className="absolute -top-2 -left-2 bg-[#1e3a8a] text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm z-10">
                  Principal
                </div>
              ) : (
                <div className="absolute -top-2 -left-2 bg-gray-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm z-10">
                  Suplementar
                </div>
              )}

              {/* Remove Button for supplementary OABs */}
              {!isViewMode && oab.tipo !== 'Principal' && (
                <button
                  type="button"
                  onClick={() => {
                    const newOabs = [...(formData.oabs || [])];
                    newOabs.splice(index, 1);
                    setFormData({ ...formData, oabs: newOabs });
                  }}
                  className="absolute -top-2 -right-2 bg-white text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full shadow-sm border border-gray-200 transition-all z-10"
                  title="Remover OAB Suplementar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              )}

              <div className="md:col-span-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Número
                </label>
                <input
                  className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={oab.numero || ''}
                  onChange={e => {
                    let newOabs = [...(formData.oabs || [])];
                    if (newOabs.length === 0) newOabs = [{ numero: '', uf: '', tipo: 'Principal', validade: '' }];
                    newOabs[index] = { ...newOabs[index], numero: e.target.value };
                    setFormData({ ...formData, oabs: newOabs });
                  }}
                  placeholder="Ex: 123456"
                  disabled={isViewMode}
                  readOnly={isViewMode}
                />
              </div>

              <div className="md:col-span-1">
                <SearchableSelect
                  label="UF"
                  value={oab.uf || ''}
                  onChange={v => {
                    let newOabs = [...(formData.oabs || [])];
                    if (newOabs.length === 0) newOabs = [{ numero: '', uf: '', tipo: 'Principal', validade: '' }];
                    newOabs[index] = { ...newOabs[index], uf: v.toUpperCase() };
                    setFormData({ ...formData, oabs: newOabs });
                  }}
                  options={ESTADOS_BRASIL_UF.map(uf => ({ name: uf }))}
                  placeholder="UF"
                  uppercase={true}
                  disabled={isViewMode}
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Emissão
                </label>
                <input
                  className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={oab.validade || ''}
                  onChange={e => {
                    let newOabs = [...(formData.oabs || [])];
                    if (newOabs.length === 0) newOabs = [{ numero: '', uf: '', tipo: 'Principal', validade: '' }];
                    newOabs[index] = { ...newOabs[index], validade: maskDate(e.target.value) };
                    setFormData({ ...formData, oabs: newOabs });
                  }}
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  disabled={isViewMode}
                  readOnly={isViewMode}
                />
              </div>
            </div>
          ))}
        </div>
      )}

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
                checked={!!formData.cpf && (formData.ctps_numero || formData.ctps) === formData.cpf.replace(/\D/g, '').slice(0, 11)}
                className="w-3 h-3 text-[#1e3a8a] bg-gray-100 border-gray-300 rounded focus:ring-[#1e3a8a] cursor-pointer"
                disabled={isViewMode}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (formData.cpf) {
                      setFormData({ ...formData, ctps_numero: formData.cpf.replace(/\D/g, '').slice(0, 11), ctps: formData.cpf.replace(/\D/g, '').slice(0, 11) })
                    } else {
                      alert('Preencha o CPF na aba Dados Pessoais primeiro.');
                      e.target.checked = false;
                    }
                  } else {
                    setFormData({ ...formData, ctps_numero: '', ctps: '' })
                  }
                }}
              />
              <span className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest group-hover:text-[#112240] transition-colors">Digital</span>
            </label>
          </div>
          <input
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            value={formData.ctps_numero || formData.ctps || ''}
            onChange={e => setFormData({ ...formData, ctps_numero: e.target.value.replace(/\D/g, ''), ctps: e.target.value.replace(/\D/g, '') })}
            maxLength={11}
            placeholder="999999"
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>
        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            CTPS Série
          </label>
          <input
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            value={formData.ctps_serie || ''}
            onChange={e => setFormData({ ...formData, ctps_serie: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            maxLength={4}
            placeholder="0000"
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>
        <SearchableSelect
          label="CTPS UF"
          value={formData.ctps_uf || ''}
          onChange={v => setFormData({ ...formData, ctps_uf: v.toUpperCase() })}
          options={ESTADOS_BRASIL_UF.map(uf => ({ name: uf }))}
          placeholder="UF"
          uppercase={true}
          disabled={isViewMode}
        />
      </div>

      {/* PIS/Matricula/Militar Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            PIS/PASEP
          </label>
          <input
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            value={formData.pis_pasep || ''}
            onChange={e => setFormData({ ...formData, pis_pasep: e.target.value.replace(/\D/g, '').slice(0, 11) })}
            maxLength={11}
            placeholder="99999999999"
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>

        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Matrícula e-Social
          </label>
          <input
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            value={formData.matricula_esocial || ''}
            onChange={e => setFormData({ ...formData, matricula_esocial: e.target.value })}
            placeholder="Matrícula"
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>

        {formData.gender === 'Masculino' && (
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Dispensa Militar
            </label>
            <input
              className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={formData.dispensa_militar || ''}
              onChange={e => setFormData({ ...formData, dispensa_militar: e.target.value.replace(/[^\d.]/g, '') })}
              placeholder="99.999.999999.9"
              disabled={isViewMode}
              readOnly={isViewMode}
            />
          </div>
        )}
      </div>
    </section>
  )
}