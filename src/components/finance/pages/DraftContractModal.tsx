import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Loader2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { maskMoney, maskHon } from '../../controladoria/utils/masks';
import { useEscKey } from '../../../hooks/useEscKey';
import { CustomSelect } from '../../controladoria/ui/CustomSelect';

interface DraftContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: { id: string; name: string; cnpj: string } | null;
  onSave: () => void;
}

export function DraftContractModal({ isOpen, onClose, client, onSave }: DraftContractModalProps) {
  const [honNumber, setHonNumber] = useState('');
  const [honorarioType, setHonorarioType] = useState('pro_labore');
  const [valor, setValor] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEscKey(isOpen && !isSaving, onClose);

  if (!isOpen || !client) return null;

  const handleSave = async () => {
    if (!honNumber) {
      toast.error('Informe o número HON.');
      return;
    }
    if (!valor || valor <= 0) {
      toast.error('Informe um valor de honorário válido.');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Salvando rascunho de contrato...');

    try {
      // 1. Create the contract as "rascunho"
      const contractPayload = {
        client_id: client.id,
        client_name: client.name,
        cnpj: client.cnpj,
        hon_number: honNumber,
        reference: `RASCUNHO - ${client.name}`,
        status: 'rascunho',
      };

      const { data: newContract, error: contractError } = await supabase
        .from('contracts')
        .insert(contractPayload)
        .select()
        .single();

      if (contractError) throw contractError;

      const contractId = newContract.id;

      // 2. Upload GED if exists
      if (file) {
        const filePath = `contracts/${contractId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('ged-documentos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: docError } = await supabase.from('contract_documents').insert({
          contract_id: contractId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: 'contract',
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        });

        if (docError) throw docError;
      }

      // 3. Create the pending financial installment
      let newDisplayId = null;
      if (newContract.display_id) {
        newDisplayId = `${newContract.display_id}.01`;
      }

      const installmentPayload = {
        contract_id: contractId,
        display_id: newDisplayId,
        type: honorarioType,
        amount: valor,
        installment_number: 1,
        total_installments: 1,
        due_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        clause: 'Honorário Avulso (Rascunho)'
      };

      const { error: installmentError } = await supabase
        .from('financial_installments')
        .insert([installmentPayload]);

      if (installmentError) throw installmentError;

      toast.success('Rascunho de contrato criado com sucesso!', { id: toastId });
      onSave();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao salvar: ${error.message}`, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0a192f] tracking-tight">Rascunho de Contrato</h2>
            <p className="text-sm font-semibold text-gray-500 mt-1">Cadastro rápido para emissão de NF de contratos não registrados no sistema</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
             <div>
               <p className="text-sm font-bold text-blue-900">Atenção</p>
               <p className="text-[13px] text-blue-800/80 mt-1">Este contrato será salvo com o status de <strong>Rascunho</strong> e aparecerá no topo da aba Casos da Controladoria, aguardando preenchimento completo.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tomador (Cliente)</label>
                <input 
                  type="text" 
                  value={client.name} 
                  disabled 
                  className="w-full bg-gray-100 border border-gray-200 text-gray-500 text-sm font-bold rounded-xl px-4 py-2.5 outline-none cursor-not-allowed" 
                />
             </div>

             <div className="flex flex-col gap-1">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Número HON*</label>
                <input 
                  type="text" 
                  value={honNumber}
                  onChange={e => setHonNumber(maskHon(e.target.value))}
                  placeholder="Ex: 0000000/0"
                  className="w-full bg-white border border-gray-200 text-gray-800 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-50 transition-all shadow-sm" 
                />
             </div>

             <div className="flex flex-col gap-1">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Tipo de Honorário*</label>
                <CustomSelect
                  value={honorarioType}
                  onChange={(val) => setHonorarioType(val)}
                  options={[
                    { label: 'Pró-labore', value: 'pro_labore' },
                    { label: 'Êxito', value: 'success_fee' },
                    { label: 'Êxito Final', value: 'final_success_fee' },
                    { label: 'Êxito Intermediário', value: 'intermediate_fee' },
                    { label: 'Fixo Mensal', value: 'fixed_monthly_fee' },
                    { label: 'Outros Honorários', value: 'other_fees' }
                  ]}
                  placeholder="Selecione o tipo..."
                />
             </div>

             <div className="flex flex-col gap-1">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Valor do Honorário*</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={valor || valor === 0 ? maskMoney((valor * 100).toFixed(0)) : ''}
                    onChange={(e) => {
                       const rawValue = e.target.value.replace(/\D/g, '');
                       setValor(Number(rawValue) / 100);
                    }}
                    placeholder="0,00"
                    className="w-full bg-white border border-gray-200 text-[#1e3a8a] text-sm font-black rounded-xl px-4 py-2.5 outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-50 transition-all shadow-sm" 
                  />
                </div>
             </div>

             <div className="flex flex-col gap-1 relative">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Anexar Contrato PDF (GED)</label>
                <input 
                  type="file" 
                  accept="application/pdf"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gray-50 border border-dashed border-gray-300 text-gray-600 hover:text-[#1e3a8a] hover:border-[#1e3a8a] hover:bg-blue-50 text-sm font-bold rounded-xl px-4 py-2.5 outline-none transition-all shadow-sm flex items-center justify-center gap-2 group"
                >
                  <Upload className="w-4 h-4 text-gray-400 group-hover:text-[#1e3a8a]" />
                  {file ? <span className="truncate max-w-[150px]">{file.name}</span> : <span>Selecionar Arquivo PDF</span>}
                </button>
             </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#1e3a8a] to-[#0a192f] text-white hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Criar Contrato
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
