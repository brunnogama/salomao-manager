// src/components/collaborators/components/InformacoesProfissionaisSection.tsx
import { GraduationCap } from 'lucide-react'
import { Colaborador } from '../../../types/colaborador'
import { SearchableSelect } from '../../crm/SearchableSelect'

const ESTADOS_BRASIL_UF = [
  { sigla: 'AC', nome: 'AC' }, { sigla: 'AL', nome: 'AL' }, { sigla: 'AP', nome: 'AP' },
  { sigla: 'AM', nome: 'AM' }, { sigla: 'BA', nome: 'BA' }, { sigla: 'CE', nome: 'CE' },
  { sigla: 'DF', nome: 'DF' }, { sigla: 'ES', nome: 'ES' }, { sigla: 'GO', nome: 'GO' },
  { sigla: 'MA', nome: 'MA' }, { sigla: 'MT', nome: 'MT' }, { sigla: 'MS', nome: 'MS' },
  { sigla: 'MG', nome: 'MG' }, { sigla: 'PA', nome: 'PA' }, { sigla: 'PB', nome: 'PB' },
  { sigla: 'PR', nome: 'PR' }, { sigla: 'PE', nome: 'PE' }, { sigla: 'PI', nome: 'PI' },
  { sigla: 'RJ', nome: 'RJ' }, { sigla: 'RN', nome: 'RN' }, { sigla: 'RS', nome: 'RS' },
  { sigla: 'RO', nome: 'RO' }, { sigla: 'RR', nome: 'RR' }, { sigla: 'SC', nome: 'SC' },
  { sigla: 'SP', nome: 'SP' }, { sigla: 'SE', nome: 'SE' }, { sigla: 'TO', nome: 'TO' }
]

interface InformacoesProfissionaisSectionProps {
  formData: Partial<Colaborador>
  setFormData: (data: Partial<Colaborador>) => void
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
        <GraduationCap className="h-4 w-4" /> Informações Profissionais
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Número OAB */}
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

        {/* UF OAB */}
        <SearchableSelect 
          label="UF OAB" 
          value={formData.oab_uf || ''} 
          onChange={v => setFormData({ ...formData, oab_uf: v })} 
          options={ESTADOS_BRASIL_UF.map(e => ({ name: e.nome }))} 
          placeholder="Selecione..."
        />

        {/* Vencimento OAB */}
        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Vencimento OAB
          </label>
          <input 
            className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" 
            value={formData.oab_vencimento || ''} 
            onChange={e => setFormData({ ...formData, oab_vencimento: maskDate(e.target.value) })} 
            maxLength={10} 
            placeholder="DD/MM/AAAA" 
          />
        </div>
      </div>
    </section>
  )
}