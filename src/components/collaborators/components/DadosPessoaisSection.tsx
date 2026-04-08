// src/components/collaborators/components/DadosPessoaisSection.tsx

import { User, Plus, Minus, Landmark, Linkedin, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { AuditLog } from '../../ui/AuditLog'

interface DadosPessoaisSectionProps {
  formData: Partial<Collaborator>
  setFormData: (data: Partial<Collaborator>) => void
  maskCPF: (value: string) => string
  maskDate: (value: string) => string
  maskRG: (value: string) => string
  maskPhone: (value: string) => string
  maskCNPJ: (value: string) => string
  isViewMode?: boolean
  hideBankingAndEmergency?: boolean
  changedFields?: string[]
  missingFields?: string[]
}

export function DadosPessoaisSection({
  formData,
  setFormData,
  maskCPF,
  maskDate,
  maskRG,
  maskPhone,
  maskCNPJ,
  isViewMode = false,
  hideBankingAndEmergency = false,
  changedFields = [],
  missingFields = []
}: DadosPessoaisSectionProps) {
  const [bancos, setBancos] = useState<{ name: string }[]>([])
  const isChanged = (field: string) => changedFields.includes(field)
  const isMissing = (field: string) => missingFields.includes(field)
  const highlightClass = 'ring-2 ring-amber-400 border-amber-300 bg-amber-50/30'
  const errorClass = 'ring-2 ring-red-500 border-red-500 bg-red-50'

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
        <User className="h-4 w-4" /> Dados Pessoais
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Nome Completo - Mapeado para 'name' */}
        <div className="md:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-widest mb-2 ${isMissing('name') ? 'text-red-500' : 'text-gray-400'}`}>
            Nome Completo <span className="text-red-500 text-sm ml-0.5">*</span>
          </label>
          <input
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''} ${isMissing('name') ? errorClass : isChanged('name') ? highlightClass : ''}`}
            value={formData.name || ''}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>

        {/* Gênero - Mapeado para 'gender' */}
        <div className="md:col-span-1">
          <label className={`block text-[9px] font-black uppercase tracking-widest mb-2 ${isMissing('gender') ? 'text-red-500' : 'text-gray-400'}`}>
            Gênero <span className="text-red-500 text-sm ml-0.5">*</span>
          </label>
          <SearchableSelect
            value={formData.gender || ''}
            onChange={v => setFormData({ ...formData, gender: v })}
            options={[{ name: 'Masculino' }, { name: 'Feminino' }, { name: 'Outro' }]}
            disabled={isViewMode}
            className={`searchable-select-container ${isMissing('gender') ? 'ring-2 ring-red-500 border-red-500 bg-red-50 rounded-xl' : ''}`}
          />
        </div>

        {/* Identidade e CPF (Lado a Lado) */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Identidade (RG)
            </label>
            <input
              className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''} ${isChanged('rg') ? highlightClass : ''}`}
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
              className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''} ${isChanged('cpf') ? highlightClass : ''}`}
              value={formData.cpf || ''}
              onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
              maxLength={14}
              placeholder="Digite o CPF"
              disabled={isViewMode}
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Data de Nascimento e Telefone */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Data Nascimento
            </label>
            <input
              className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''} ${isChanged('birthday') ? highlightClass : ''}`}
              value={formData.birthday || ''}
              onChange={e => setFormData({ ...formData, birthday: maskDate(e.target.value) })}
              maxLength={10}
              placeholder="DD/MM/AAAA"
              disabled={isViewMode}
              readOnly={isViewMode}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Telefone / Celular
            </label>
            <input
              className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={formData.telefone || ''}
              onChange={e => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
              maxLength={15}
              placeholder="(00) 00000-0000"
              disabled={isViewMode}
              readOnly={isViewMode}
            />
          </div>
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

        {/* Indicado por */}
        <div className="md:col-span-3">
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Indicado por
          </label>
          <input
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            value={formData.indicado_por || ''}
            onChange={e => setFormData({ ...formData, indicado_por: e.target.value })}
            placeholder="Nome de quem indicou (opcional)"
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>

        {/* E-mail Pessoal e LinkedIn */}
        <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              E-mail Pessoal
            </label>
            <input
              type="email"
              className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''} ${isChanged('email_pessoal') ? highlightClass : ''}`}
              value={formData.email_pessoal || ''}
              onChange={e => setFormData({ ...formData, email_pessoal: e.target.value })}
              placeholder="Digite o e-mail pessoal"
              disabled={isViewMode}
              readOnly={isViewMode}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              LinkedIn
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Linkedin className="h-4 w-4 text-blue-600" />
              </div>
              {isViewMode && formData.linkedin_url ? (
                <a
                  href={formData.linkedin_url.startsWith('http') ? formData.linkedin_url : `https://${formData.linkedin_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gray-100/50 border border-gray-200 text-blue-600 text-sm rounded-xl py-2.5 pl-10 pr-3 block outline-none transition-all font-medium hover:underline flex items-center"
                >
                  {formData.linkedin_url}
                </a>
              ) : (
                <input
                  type="url"
                  className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl py-2.5 pl-10 pr-3 focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={formData.linkedin_url || ''}
                  onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/usuario"
                  disabled={isViewMode}
                  readOnly={isViewMode}
                />
              )}
            </div>
          </div>
        </div>

        {/* Filhos e Quantidade */}
        <div className={`md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4`}>
          <div className="md:col-span-2">
            <SearchableSelect
              label="Filhos"
              value={formData.has_children === true ? 'Sim' : formData.has_children === false ? 'Não' : ''}
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
              placeholder="Selecione..."
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
      {!hideBankingAndEmergency && (
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
                    { name: 'CNPJ' },
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
                    if (formData.pix_tipo === 'Telefone') {
                      val = maskPhone(val)
                    } else if (formData.pix_tipo === 'CPF') {
                      val = maskCPF(val)
                    } else if (formData.pix_tipo === 'CNPJ') {
                      val = maskCNPJ(val)
                    }
                    setFormData({ ...formData, pix_chave: val })
                  }}
                  maxLength={formData.pix_tipo === 'CNPJ' ? 18 : formData.pix_tipo === 'CPF' ? 14 : formData.pix_tipo === 'Telefone' ? 15 : undefined}
                  placeholder="Digite a chave PIX"
                  disabled={isViewMode || !formData.pix_tipo}
                  readOnly={isViewMode}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dados de Emergência */}
      {!hideBankingAndEmergency && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              Dados de Emergência
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Contatos: {formData.emergency_contacts?.length || 0}
              </span>
              {!isViewMode && (
                <button
                  type="button"
                  onClick={() => {
                    const currentContacts = formData.emergency_contacts || [];
                    setFormData({
                      ...formData,
                      emergency_contacts: [...currentContacts, { id: crypto.randomUUID(), nome: '', telefone: '', parentesco: '' }]
                    });
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] text-xs font-bold uppercase rounded-lg transition-all"
                  title="Adicionar Contato"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Contato
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {(!formData.emergency_contacts || formData.emergency_contacts.length === 0) && (
              <div className="text-center py-6 bg-gray-50 border border-gray-100 rounded-xl border-dashed">
                <p className="text-sm text-gray-500 font-medium">Nenhum contato de emergência cadastrado.</p>
              </div>
            )}

            {formData.emergency_contacts?.map((contato, index) => (
              <div key={contato.id || index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50 relative items-start">
                <div className="md:col-span-5">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Nome do Contato {index + 1}
                  </label>
                  <input
                    className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={contato.nome || ''}
                    onChange={e => {
                      const newContacts = [...(formData.emergency_contacts || [])];
                      newContacts[index] = { ...newContacts[index], nome: e.target.value };
                      setFormData({ ...formData, emergency_contacts: newContacts });
                    }}
                    placeholder="Nome do contato"
                    disabled={isViewMode}
                    readOnly={isViewMode}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Telefone
                  </label>
                  <input
                    className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={contato.telefone || ''}
                    onChange={e => {
                      const newContacts = [...(formData.emergency_contacts || [])];
                      newContacts[index] = { ...newContacts[index], telefone: maskPhone(e.target.value) };
                      setFormData({ ...formData, emergency_contacts: newContacts });
                    }}
                    maxLength={15}
                    placeholder="Digite o Telefone"
                    disabled={isViewMode}
                    readOnly={isViewMode}
                  />
                </div>
                <div className="md:col-span-3">
                  <SearchableSelect
                    label="Grau de Parentesco"
                    value={contato.parentesco || ''}
                    onChange={v => {
                      const newContacts = [...(formData.emergency_contacts || [])];
                      newContacts[index] = { ...newContacts[index], parentesco: v };
                      setFormData({ ...formData, emergency_contacts: newContacts });
                    }}
                    options={[
                      { name: 'Pai' },
                      { name: 'Mãe' },
                      { name: 'Irmã(o)' },
                      { name: 'Tio(a)' },
                      { name: 'Avô(ó)' },
                      { name: 'Cônjuge' },
                      { name: 'Amigo(a)' },
                      { name: 'Outro' }
                    ]}
                    placeholder="Selecione"
                    disabled={isViewMode}
                  />
                </div>
                <div className="md:col-span-1 flex items-end pb-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const newContacts = [...(formData.emergency_contacts || [])];
                      newContacts.splice(index, 1);
                      setFormData({ ...formData, emergency_contacts: newContacts });
                    }}
                    disabled={isViewMode}
                    className="p-2 hover:bg-red-50 rounded-xl text-red-500 disabled:opacity-50 flex items-center justify-center transition-colors bg-red-50/50 border border-red-100 h-[42px] w-[42px]"
                    title="Excluir Contato"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isViewMode && (
        <AuditLog 
          createdAt={formData.created_at as string}
          createdBy={(formData as any).created_by_name || (formData as any).created_by}
          updatedAt={formData.updated_at as string}
          updatedBy={(formData as any).updated_by_name || (formData as any).updated_by}
        />
      )}
    </section>
  )
}