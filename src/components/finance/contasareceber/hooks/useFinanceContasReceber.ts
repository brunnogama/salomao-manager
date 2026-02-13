// src/components/finance/contasareceber/hooks/useFinanceContasReceber.ts
import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

export type FaturaStatus = 'aguardando_resposta' | 'radar' | 'contato_direto' | 'pago';

export interface Fatura {
  id: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_id?: string;
  valor: number;
  remetente: string;
  assunto: string;
  corpo?: string;
  data_envio: string;
  status: FaturaStatus;
  data_resposta?: string;
  data_radar?: string;
  data_contato_direto?: string;
  data_pagamento?: string;
  arquivos_urls?: string[];
  created_at: string;
  updated_at: string;
}

interface EnviarFaturaParams {
  cliente_nome: string;
  cliente_email: string;
  cliente_id?: string;
  valor: number;
  remetente: string;
  assunto: string;
  corpo?: string;
  arquivos?: File[];
}

export function useFinanceContasReceber() {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar faturas
  const loadFaturas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance_faturas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFaturas(data || []);
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaturas();

    // Configurar realtime para atualizações automáticas
    const channel = supabase
      .channel('finance_faturas_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'finance_faturas'
        },
        () => {
          loadFaturas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Enviar fatura
  const enviarFatura = async (params: EnviarFaturaParams) => {
    // VALIDAÇÃO DE SEGURANÇA: Impede o envio se o nome estiver nulo ou vazio
    if (!params.cliente_nome || params.cliente_nome.trim() === '') {
      throw new Error("O nome do cliente é obrigatório e não foi identificado.");
    }

    try {
      // 1. Definir ID do cliente (Prioridade: ID explícito > Busca por Email)
      let cliente_id = params.cliente_id || null;

      if (!cliente_id && params.cliente_email) {
        const { data: clienteData } = await supabase
          .from('clients')
          .select('id')
          .eq('email', params.cliente_email)
          .maybeSingle();

        if (clienteData) {
          cliente_id = clienteData.id;
        }
      }

      // 2. Upload de arquivos (se houver)
      let arquivos_urls: string[] = [];
      if (params.arquivos && params.arquivos.length > 0) {
        for (const arquivo of params.arquivos) {
          const fileExt = arquivo.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `faturas/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('finance-documents')
            .upload(filePath, arquivo);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('finance-documents')
              .getPublicUrl(filePath);

            arquivos_urls.push(urlData.publicUrl);
          }
        }
      }

      // 3. Inserir fatura no banco
      const { data: faturaData, error: faturaError } = await supabase
        .from('finance_faturas')
        .insert({
          cliente_nome: params.cliente_nome, // Garantido pela validação no topo
          cliente_email: params.cliente_email,
          cliente_id,
          valor: params.valor,
          remetente: params.remetente,
          assunto: params.assunto,
          corpo: params.corpo || '',
          status: 'aguardando_resposta',
          data_envio: new Date().toISOString(),
          arquivos_urls: arquivos_urls.length > 0 ? arquivos_urls : null
        })
        .select()
        .single();

      if (faturaError) throw faturaError;

      // 4. Enviar e-mail (usando função edge do Supabase ou serviço externo)
      try {
        if (params.cliente_email) {
          await supabase.functions.invoke('enviar-email-fatura', {
            body: {
              destinatario: params.cliente_email,
              remetente: params.remetente,
              assunto: params.assunto,
              corpo: params.corpo,
              arquivos_urls,
              fatura_id: faturaData.id
            }
          });
        }
      } catch (emailError) {
        console.warn('Erro ao enviar e-mail (função edge):', emailError);
      }

      // 5. Recarregar lista
      await loadFaturas();

      return faturaData;
    } catch (error) {
      console.error('Erro ao enviar fatura:', error);
      throw error;
    }
  };

  // Confirmar pagamento
  const confirmarPagamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('finance_faturas')
        .update({
          status: 'pago',
          data_pagamento: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await loadFaturas();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      throw error;
    }
  };

  // Atualizar status (automático via cron job ou manual)
  const atualizarStatus = async (id: string, novoStatus: FaturaStatus) => {
    try {
      const updates: any = { status: novoStatus, updated_at: new Date().toISOString() };

      if (novoStatus === 'radar') {
        updates.data_radar = new Date().toISOString();
      } else if (novoStatus === 'contato_direto') {
        updates.data_contato_direto = new Date().toISOString();
      }

      const { error } = await supabase
        .from('finance_faturas')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await loadFaturas();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  };

  return {
    faturas,
    loading,
    enviarFatura,
    confirmarPagamento,
    atualizarStatus,
    recarregar: loadFaturas
  };
}