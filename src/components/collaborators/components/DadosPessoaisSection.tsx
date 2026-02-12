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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Nome Completo - Mapeado para 'name' */}
        <div className="md:col-span-3">
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
        <div className="md:col-span-1">
          <SearchableSelect
            label="Gênero"
            value={formData.gender || ''}
            onChange={v => setFormData({ ...formData, gender: v })}
            options={[{ name: 'Masculino' }, { name: 'Feminino' }, { name: 'Outro' }]}
          />
        </div>

        {/* Identidade e CPF (Lado a Lado) */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Identidade (RG)
            </label>
            <input
              className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
              value={formData.rg || ''}
              onChange={e => setFormData({ ...formData, rg: e.target.value })}
              maxLength={20}
              placeholder="Ex: 12.345.678-9"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              CPF
            </label>
            <input
              className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
              value={formData.cpf || ''}
              onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
              maxLength={14}
              placeholder="000.000.000-00"
            />
          </div>
        </div>

        {/* Data de Nascimento */}
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

      {/* Dados de Emergência */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          Dados de Emergência
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Nome
            </label>
            <input
              className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
              value={formData.emergencia_nome || ''}
              onChange={e => setFormData({ ...formData, emergencia_nome: e.target.value })}
              placeholder="Nome do contato"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Telefone
            </label>
            <input
              className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
              value={formData.emergencia_telefone || ''}
              onChange={e => setFormData({ ...formData, emergencia_telefone: e.target.value })} // Simple text for now, could add mask later if requested
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="md:col-span-1">
            <SearchableSelect
              label="Grau de Parentesco"
              value={formData.emergencia_parentesco || ''}
              onChange={v => setFormData({ ...formData, emergencia_parentesco: v })}
              options={[
                { name: 'Pai' },
                { name: 'Mãe' },
                { name: 'Irmã(o)' },
                { name: 'Tio(a)' },
                { name: 'Avô(ó)' },
                { name: 'Outro' }
              ]}
              placeholder="Selecione"
            />
          </div>
        </div>
      </div>

      {/* Observações */}
      <div className="mt-6">
        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
          Observações
        </label>
        <textarea
          className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium min-h-[80px]"
          value={formData.observacoes || ''}
          onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
          placeholder="Observações gerais sobre o colaborador..."
        />
      </div>
      )
}