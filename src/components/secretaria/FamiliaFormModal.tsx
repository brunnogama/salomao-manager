// Substitua o trecho do formulário no FamiliaFormModal.tsx
<form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-10 overflow-y-auto flex flex-col gap-8 text-[#112240]">
  
  {/* Seção 1: Identificação */}
  <div className="space-y-4">
    <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-2">Identificação Básica</h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Vencimento</label>
        <input type="date" name="vencimento" value={formData.vencimento} onChange={handleChange} className="w-full h-[46px] px-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" required />
      </div>
      <ManagedSelect label="Titular" name="titular" value={formData.titular} optionsList={options.titular} />
      <ManagedSelect label="Fornecedor" name="fornecedor" value={formData.fornecedor} optionsList={options.fornecedor} />
    </div>
  </div>

  {/* Seção 2: Financeiro e Classificação */}
  <div className="space-y-4">
    <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-2">Financeiro e Classificação</h4>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Valor (R$)</label>
        <input type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} className="w-full h-[46px] px-4 bg-blue-50/30 border border-blue-100 rounded-2xl text-sm font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500/20" required />
      </div>
      <ManagedSelect label="Status" name="status" value={formData.status} optionsList={options.status} />
      <ManagedSelect label="Tipo" name="tipo" value={formData.tipo} optionsList={options.tipo} />
      <ManagedSelect label="Categoria" name="categoria" value={formData.categoria} optionsList={options.categoria} />
    </div>
  </div>

  {/* Seção 3: Documentação e Rastreio */}
  <div className="space-y-4">
    <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-2">Documentação e Extras</h4>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Nota Fiscal</label><input name="nota_fiscal" value={formData.nota_fiscal} onChange={handleChange} className="w-full h-[46px] px-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none" /></div>
      <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Fatura</label><input name="fatura" value={formData.fatura} onChange={handleChange} className="w-full h-[46px] px-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none" /></div>
      <ManagedSelect label="Fator Gerador" name="fator_gerador" value={formData.fator_gerador} optionsList={options.fator_gerador} />
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Rateio</label>
        <button type="button" onClick={() => setIsRateioModalOpen(true)} className="w-full h-[46px] flex items-center justify-between px-4 bg-white border-2 border-dashed border-gray-200 text-gray-600 rounded-2xl text-sm font-semibold hover:border-blue-400 hover:text-blue-600 transition-all">
          <span className="truncate">{formData.rateio ? `${formData.rateio} (${formData.rateio_porcentagem}%)` : 'Configurar'}</span>
          <Calculator className="w-4 h-4 opacity-40" />
        </button>
      </div>
    </div>
  </div>

  {/* Seção 4: Descrição Detalhada */}
  <div className="space-y-1.5 pt-4">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Descrição do Serviço</label>
    <textarea name="descricao_servico" value={formData.descricao_servico} onChange={handleChange} rows={3} className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-[2rem] text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-medium" placeholder="Detalhes do serviço..." />
  </div>

  {/* Botões de Ação */}
  <div className="flex justify-end items-center gap-8 pt-6 mt-4 border-t border-gray-50">
    <button type="button" onClick={onClose} className="text-xs font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-[0.2em]">Cancelar</button>
    <button type="submit" className="flex items-center gap-3 px-12 py-4 bg-[#1e3a8a] text-white text-xs font-black rounded-2xl hover:bg-[#112240] shadow-xl transition-all active:scale-95 uppercase tracking-[0.2em]">
      <Save className="w-4 h-4" /> {initialData ? 'Salvar Alterações' : 'Confirmar Lançamento'}
    </button>
  </div>
</form>