// src/components/collaborators/components/DadosPessoaisSection.tsx
import { User } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'

interface DadosPessoaisSectionProps {
  formData: Partial<Collaborator>
  setFormData: (data: Partial<Collaborator>) => void
  maskCPF: (value: string) => string
  maskDate: (value: string) => string
}

export function DadosPessoaisSection({ 
  formData, 
  setFormData, 
  maskCPF, 
  maskDate 
}: DadosPessoaisSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
        <User className="h-4 w-4" /> Dados Pessoais
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nome Completo - Mapeado para 'name' */}
        <div className="md:col-span-2">
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Nome Completo
          </label>
          <input 
            className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" 
            value={formData.name || ''} 
            onChange={e => setFormData({ ...formData, name: e.target.value })} 
          />
        </div>

        {/* Gênero - Mapeado para 'gender' */}
        <SearchableSelect 
          label="Gênero" 
          value={formData.gender || ''} 
          onChange={v => setFormData({ ...formData, gender: v })} 
          options={[{ name: 'Masculino' }, { name: 'Feminino' }, { name: 'Outro' }]} 
        />

        {/* CPF */}
        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            CPF
          </label>
          <input 
            className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" 
            value={formData.cpf || ''} 
            onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })} 
            maxLength={14} 
          />
        </div>

        {/* Data de Nascimento - Mapeado para 'birthday' */}
        <div className="md:col-span-2">
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Data Nascimento
          </label>
          <input 
            className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" 
            value={formData.birthday || ''} 
            onChange={e => setFormData({ ...formData, birthday: maskDate(e.target.value) })} 
            maxLength={10} 
            placeholder="DD/MM/AAAA" 
          />
        </div>
      </div>
    </section>
  )
}