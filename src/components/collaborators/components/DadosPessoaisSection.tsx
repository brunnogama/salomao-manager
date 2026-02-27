// src/components/collaborators/components/DadosPessoaisSection.tsx

import { User, Plus, Minus, Landmark } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'

interface DadosPessoaisSectionProps {
  formData: Partial<Collaborator>
  setFormData: (data: Partial<Collaborator>) => void
  maskCPF: (value: string) => string
  maskDate: (value: string) => string
  maskRG: (value: string) => string
  maskPhone: (value: string) => string
  isViewMode?: boolean
}

export function DadosPessoaisSection({
  formData,
  setFormData,
  maskCPF,
  maskDate,
  maskRG,
  maskPhone,
  isViewMode = false
}: DadosPessoaisSectionProps) {
  const [bancos, setBancos] = useState<{ name: string }[]>([])

  useEffect(() => {
    fetch('https://brasilapi.com.br/api/banks/v1')
      .then(res => res.json())
      .then(data => {
        const validBanks = data
          .filter((b: any) => b.name && b.code)
          .map((b: any) => ({ name: `${b.code} - ${b.name}` }))
        setBancos(validBanks)
      })
      .catch(err => console.error("Erro ao buscar bancos:", err))
  }, [])

  return (
    <section className="space-y-4">
      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
        <User className="h-4 w-4" /> Dados Pessoais e Bancários
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
              onChange={e => setFormData({ ...formData, rg: maskRG(e.target.value) })}
              maxLength={10}
              placeholder="Digite a Identidade"
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
              placeholder="Digite o CPF"
              disabled={isViewMode}
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Data de Nascimento */}
        <div className="md:col-span-1">
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

        {/* Estado Civil */}
        <div className="md:col-span-1">
          <SearchableSelect
            label="Estado Civil"
            value={formData.civil_status || ''}
            onChange={v => setFormData({ ...formData, civil_status: v })}
            options={[
              { name: 'Solteiro(a)' },
              { name: 'Casado(a)' },
              { name: 'Separado(a) Judicialmente' },
              { name: 'Divorciado(a)' },
              { name: 'Viúvo(a)' }
            ]}
            disabled={isViewMode}
          />
        </div>

        {/* Filhos e Quantidade */}
        <div className={`md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4`}>
          <div className="md:col-span-2">
            <SearchableSelect
              label="Filhos"
              value={formData.has_children ? 'Sim' : 'Não'}
              onChange={v => {
                const hasChildren = v === 'Sim';
                const count = hasChildren ? Math.max(formData.children_count || 1, 1) : 0;
                let newChildrenData = formData.children_data || [];
                if (hasChildren && newChildrenData.length === 0) {
                  newChildrenData = [{ id: crypto.randomUUID(), name: '', birth_date: '' }];
                } else if (!hasChildren) {
                  newChildrenData = [];
                }
                setFormData({ ...formData, has_children: hasChildren, children_count: count, children_data: newChildrenData });
              }}
              options={[{ name: 'Sim' }, { name: 'Não' }]}
              disabled={isViewMode}
            />
          </div>
          {formData.has_children && (
            <div className="md:col-span-2">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Quantidade
              </label>
              <div className="flex items-center h-[42px] bg-gray-100/50 border border-gray-200 rounded-xl px-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentCount = formData.children_count || 0;
                    if (currentCount > 1) {
                      const newCount = currentCount - 1;
                      const newChildrenData = (formData.children_data || []).slice(0, newCount);
                      setFormData({ ...formData, children_count: newCount, children_data: newChildrenData });
                    }
                  }}
                  disabled={!formData.has_children || isViewMode || (formData.children_count || 0) <= 1}
                  className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 disabled:opacity-50 min-w-8 flex items-center justify-center"
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
                  onClick={() => {
                    const newCount = (formData.children_count || 0) + 1;
                    const newChildrenData = [...(formData.children_data || []), { id: crypto.randomUUID(), name: '', birth_date: '' }];
                    setFormData({ ...formData, children_count: newCount, children_data: newChildrenData });
                  }}
                  disabled={!formData.has_children || isViewMode}
                  className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 disabled:opacity-50 min-w-8 flex items-center justify-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Render Children Fields dynamically */}
          {formData.has_children && formData.children_data && formData.children_data.length > 0 && (
            <div className="md:col-span-4 space-y-4 mt-2">
              {formData.children_data.map((child, index) => (
                <div key={child.id || index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Nome do Filho(a) {index + 1}
                    </label>
                    <input
                      className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                      value={child.name || ''}
                      onChange={e => {
                        const newChildrenData = [...(formData.children_data || [])];
                        newChildrenData[index] = { ...newChildrenData[index], name: e.target.value };
                        setFormData({ ...formData, children_data: newChildrenData });
                      }}
                      placeholder={`Nome do ${index + 1}º filho`}
                      disabled={isViewMode}
                      readOnly={isViewMode}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Data de Nascimento
                    </label>
                    <input
                      className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                      value={child.birth_date || ''}
                      onChange={e => {
                        const newChildrenData = [...(formData.children_data || [])];
                        newChildrenData[index] = { ...newChildrenData[index], birth_date: maskDate(e.target.value) };
                        setFormData({ ...formData, children_data: newChildrenData });
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
        </div>
      </div>

      {/* Dados Bancários */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Landmark className="h-4 w-4" /> Dados Bancários
        </h4>
        <div className="mb-4">
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Forma de Pagamento
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="forma_pagamento"
                className="w-4 h-4 text-[#1e3a8a] focus:ring-[#1e3a8a] border-gray-300"
                checked={formData.forma_pagamento === 'Agência e conta'}
                onChange={() => setFormData({ ...formData, forma_pagamento: 'Agência e conta', pix_tipo: '', pix_chave: '' })}
                disabled={isViewMode}
              />
              <span className="font-medium">Agência e conta</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="forma_pagamento"
                className="w-4 h-4 text-[#1e3a8a] focus:ring-[#1e3a8a] border-gray-300"
                checked={formData.forma_pagamento === 'PIX'}
                onChange={() => setFormData({ ...formData, forma_pagamento: 'PIX', banco_nome: '', banco_tipo_conta: '', banco_agencia: '', banco_conta: '' })}
                disabled={isViewMode}
              />
              <span className="font-medium">PIX</span>
            </label>
          </div>
        </div>

        {formData.forma_pagamento === 'Agência e conta' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
            <div className="md:col-span-1">
              <SearchableSelect
                label="Banco"
                value={formData.banco_nome || ''}
                onChange={v => setFormData({ ...formData, banco_nome: v })}
                options={bancos}
                placeholder="Selecione o banco"
                disabled={isViewMode}
              />
            </div>
            <div className="md:col-span-1">
              <SearchableSelect
                label="Tipo de Conta"
                value={formData.banco_tipo_conta || ''}
                onChange={v => setFormData({ ...formData, banco_tipo_conta: v })}
                options={[{ name: 'Conta Corrente' }, { name: 'Conta Poupança' }]}
                placeholder="Selecione"
                disabled={isViewMode}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Agência
              </label>
              <input
                className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                value={formData.banco_agencia || ''}
                onChange={e => setFormData({ ...formData, banco_agencia: e.target.value })}
                placeholder="Digite a agência"
                disabled={isViewMode}
                readOnly={isViewMode}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Conta
              </label>
              <input
                className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                value={formData.banco_conta || ''}
                onChange={e => setFormData({ ...formData, banco_conta: e.target.value })}
                placeholder="Digite a conta"
                disabled={isViewMode}
                readOnly={isViewMode}
              />
            </div>
          </div>
        )}

        {formData.forma_pagamento === 'PIX' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="md:col-span-1">
              <SearchableSelect
                label="Tipo de Chave PIX"
                value={formData.pix_tipo || ''}
                onChange={v => {
                  setFormData({ ...formData, pix_tipo: v, pix_chave: '' })
                }}
                options={[
                  { name: 'Telefone' },
                  { name: 'CPF' },
                  { name: 'E-mail' },
                  { name: 'Chave Aleatória' }
                ]}
                placeholder="Selecione o tipo"
                disabled={isViewMode}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Chave PIX
              </label>
              <input
                className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                value={formData.pix_chave || ''}
                onChange={e => {
                  let val = e.target.value
                  if (formData.pix_tipo === 'Telefone') val = maskPhone(val)
                  else if (formData.pix_tipo === 'CPF') val = maskCPF(val)
                  setFormData({ ...formData, pix_chave: val })
                }}
                maxLength={formData.pix_tipo === 'CPF' ? 14 : formData.pix_tipo === 'Telefone' ? 15 : undefined}
                placeholder="Digite a chave PIX"
                disabled={isViewMode || !formData.pix_tipo}
                readOnly={isViewMode}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dados de Emergência */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          Dados de Emergência
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Nome do Contato
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
              onChange={e => setFormData({ ...formData, emergencia_telefone: maskPhone(e.target.value) })}
              maxLength={15}
              placeholder="Digite o Telefone"
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
                { name: 'Cônjuge' },
                { name: 'Outro' }
              ]}
              placeholder="Selecione"
              disabled={isViewMode}
            />
          </div>
        </div>
      </div>
    </section>
  )
}