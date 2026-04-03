import re

with open("src/components/controladoria/clients/ClientFormModal.tsx", "r") as f:
    content = f.read()

# Replace <input ...> with <input disabled={isReadOnly} ...> (if not already disabled)
content = re.sub(r'<input([\s\n]+)(?!.*(?:type="checkbox"|disabled))', r'<input disabled={isReadOnly}\1', content)

# Checkboxes separately
content = re.sub(r'<input([\s\n]+type="checkbox")', r'<input disabled={isReadOnly}\1', content)

# Replace <CustomSelect ...> with <CustomSelect disabled={isReadOnly} ...>
content = re.sub(r'<CustomSelect\b(?!.*?disabled=)', r'<CustomSelect disabled={isReadOnly}', content)

# Replace <textarea ...> with <textarea disabled={isReadOnly} ...>
content = re.sub(r'<textarea\b(?!.*?disabled=)', r'<textarea disabled={isReadOnly}', content)

# Replace buttons that modify data
# <button onClick={handleCNPJSearch}
content = re.sub(r'<button\s+onClick=\{handleCNPJSearch\}', r'<button disabled={isReadOnly || searching} onClick={handleCNPJSearch}', content)

# Hide "Múltiplos Sócios/Empresas" button if readonly? Actually this button seems to not exist for clients, wait.
# Replace Cancel/Save buttons
save_buttons_block = """          {/* Footer */}
          <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="w-4 h-4" /> Salvar Registro</>
              )}
            </button>
          </div>"""

new_save_buttons_block = """          {/* Footer */}
          <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            {isReadOnly ? (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Fechar
                </button>
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Editar Cliente
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Salvar Registro</>
                  )}
                </button>
              </>
            )}
          </div>"""

content = content.replace(save_buttons_block, new_save_buttons_block)

# Remove contacts "Add" button if readonly
add_contact_str = """                      <button
                        onClick={handleAddContact}
                        className="text-[10px] font-black uppercase tracking-widest text-[#1e3a8a] flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Adicionar Contato
                      </button>"""
new_add_contact = """                      {!isReadOnly && (
                        <button
                          onClick={handleAddContact}
                          className="text-[10px] font-black uppercase tracking-widest text-[#1e3a8a] flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Adicionar Contato
                        </button>
                      )}"""
content = content.replace(add_contact_str, new_add_contact)

# Remove contact delete button if readonly
del_contact_str = """<button onClick={() => handleRemoveContact(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">"""
new_del_contact = """{!isReadOnly && <button onClick={() => handleRemoveContact(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">"""
content = content.replace(del_contact_str, new_del_contact)

# Replace <button> closing tag for that delete button conditionally? Better use regex for the whole button.
content = re.sub(r'(<button\s+onClick=\{\(\)\s*=>\s*handleRemoveContact[^>]+>.*?<\/button>)', r'{!isReadOnly && \1}', content, flags=re.DOTALL)


with open("src/components/controladoria/clients/ClientFormModal.tsx", "w") as f:
    f.write(content)
