// src/components/collaborators/components/DadosPessoaisSection.tsx

import { User, Plus, Minus } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'

interface DadosPessoaisSectionProps {
  formData: Partial<Collaborator>
  setFormData: (data: Partial<Collaborator>) => void
  maskCPF: (value: string) => string
  maskDate: (value: string) => string
  isViewMode?: boolean
}

export function DadosPessoaisSection({
  formData,
  setFormData,
  maskCPF,
  maskDate,
  isViewMode = false
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
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            value={formData.name || ''}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>

        {/* Gênero - Mapeado para 'gender' */}
        <div className="md:col-span-1">
          <SearchableSelect
            label="Gênero"
            value={formData.gender || ''}
            onChange={v => setFormData({ ...formData, gender: v })}
            options={[{ name: 'Masculino' }, { name: 'Feminino' }, { name: 'Outro' }]}
            disabled={isViewMode}
          />
        </div>

        {/* Identidade e CPF (Lado a Lado) */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Identidade (RG)
            </label>
            <input
              className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={formData.rg || ''}
              onChange={e => setFormData({ ...formData, rg: e.target.value })}
              maxLength={20}
              placeholder="Ex: 12.345.678-9"
              disabled={isViewMode}
              readOnly={isViewMode}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              CPF
            </label>
            <input
              className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={formData.cpf || ''}
              onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
              maxLength={14}
              placeholder="000.000.000-00"
              disabled={isViewMode}
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Data de Nascimento */}
        <div className="md:col-span-2">
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Data Nascimento
          </label>
          <input
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            value={formData.birthday || ''}
            onChange={e => setFormData({ ...formData, birthday: maskDate(e.target.value) })}
            maxLength={10}
            placeholder="DD/MM/AAAA"
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>

        {/* Filhos e Quantidade */}
        <div className={`md:col-span-2 grid ${formData.has_children ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
          <div>
            <SearchableSelect
              label="Filhos"
              value={formData.has_children ? 'Sim' : 'Não'}
              onChange={v => setFormData({ ...formData, has_children: v === 'Sim', children_count: v === 'Sim' ? (formData.children_count || 1) : 0 })}
              options={[{ name: 'Sim' }, { name: 'Não' }]}
              disabled={isViewMode}
            />
          </div>
          {formData.has_children && (
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Quantidade
              </label>
              <div className="flex items-center h-[42px] bg-gray-100/50 border border-gray-200 rounded-xl px-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, children_count: Math.max(0, (formData.children_count || 0) - 1) })}
                  disabled={!formData.has_children || isViewMode}
                  className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 disabled:opacity-50 min-w-8"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  className="w-full bg-transparent text-center text-sm font-medium text-gray-700 outline-none"
                  value={formData.children_count || 0}
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, children_count: (formData.children_count || 0) + 1 })}
                  disabled={!formData.has_children || isViewMode}
                  className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 disabled:opacity-50 min-w-8"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
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
              className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={formData.emergencia_nome || ''}
              onChange={e => setFormData({ ...formData, emergencia_nome: e.target.value })}
              placeholder="Nome do contato"
              disabled={isViewMode}
              readOnly={isViewMode}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Telefone
            </label>
            <input
              className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={formData.emergencia_telefone || ''}
              onChange={e => setFormData({ ...formData, emergencia_telefone: e.target.value })} // Simple text for now, could add mask later if requested
              placeholder="(00) 00000-0000"
              disabled={isViewMode}
              readOnly={isViewMode}
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
              disabled={isViewMode}
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
          className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium min-h-[80px] ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
          value={formData.observacoes || ''}
          onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
          placeholder="Observações gerais sobre o colaborador..."
          disabled={isViewMode}
          readOnly={isViewMode}
        />
      </div>
    </section>
  )
}