// src/components/finance/contasareceber/hooks/useFinanceContasReceber.ts
import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { logAction } from '../../../../lib/logger';

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
      const faturePayload = {
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
      };

      console.log("Payload para inserção no Supabase:", faturePayload);

      const { data: faturaData, error: faturaError } = await supabase
        .from('finance_faturas')
        .insert(faturePayload)
        .select()
        .single();

      if (faturaError) throw faturaError;

      await logAction('CRIAR', 'FINANCEIRO', `Enviou fatura para ${params.cliente_nome}: ${params.assunto} (R$ ${params.valor.toFixed(2)})`, 'Financeiro');

      // 4. Enviar e-mail (Webhook Make.com)
      try {
        const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;
        if (webhookUrl && params.cliente_email) {
          const payload = {
            destinatario: params.cliente_email,
            remetente: params.remetente,
            assunto: params.assunto,
            corpo: params.corpo,
            arquivos_urls,
            valor: params.valor,
            cliente_nome: params.cliente_nome,
            fatura_id: faturaData.id
          };

          const webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!webhookResponse.ok) {
            console.warn('Erro retornado pelo Webhook Make:', webhookResponse.statusText);
          }
        } else {
          console.log("VITE_MAKE_WEBHOOK_URL não configurada no .env ou email do cliente ausente.");
        }
      } catch (webhookError) {
        console.error('Erro de rede ao chamar o Webhook:', webhookError);
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

      const fatura = faturas.find(f => f.id === id);
      await logAction('EDITAR', 'FINANCEIRO', `Confirmou pagamento da fatura: ${fatura?.cliente_nome} - ${fatura?.assunto}`, 'Financeiro');

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

      const fatura = faturas.find(f => f.id === id);
      await logAction('EDITAR', 'FINANCEIRO', `Atualizou status da fatura para ${novoStatus}: ${fatura?.cliente_nome} - ${fatura?.assunto}`, 'Financeiro');

      await loadFaturas();
      await loadFaturas();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  };

  // Excluir fatura
  const excluirFatura = async (id: string) => {
    try {
      const { error } = await supabase
        .from('finance_faturas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const fatura = faturas.find(f => f.id === id);
      await logAction('EXCLUIR', 'FINANCEIRO', `Excluiu fatura: ${fatura?.cliente_nome} - ${fatura?.assunto}`, 'Financeiro');

      await loadFaturas();
    } catch (error) {
      console.error('Erro ao excluir fatura:', error);
      throw error;
    }
  };

  // Atualizar datas (Resposta e Radar/Fatal)
  const atualizarDatasFatura = async (id: string, dataResposta?: string, dataRadar?: string) => {
    try {
      const updates: any = { updated_at: new Date().toISOString() };
      if (dataResposta) updates.data_resposta = dataResposta;
      if (dataRadar) updates.data_radar = dataRadar; // Usando data_radar como "Prazo Fatal" visualmente ou criando campo novo se necessário. 
      // Nota: O user pediu para editar "Data Resposta" e "Prazo Fatal". 
      // No código anterior, "Prazo Fatal" era calculado (+4d). Se ele quer editar, precisamos persistir isso.
      // Vou assumir que 'data_radar' será usado para armazenar essa data personalizada ou criar um campo novo seria ideal, 
      // mas para não alterar schema agora, vou usar os campos existentes de data se possível, 
      // ou apenas permitir alterar a data base de envio?
      // O user disse "editar as datas de resposta e fatal".
      // Se essas datas são calculadas baseadas no envio, talvez ele queira editar a DATA DE ENVIO?
      // Ou ele quer definir datas explícitas que sobrescrevem o cálculo?
      // Vou permitir editar `data_resposta` e `data_radar` (que era +4d no calculo visual).

      const { error } = await supabase
        .from('finance_faturas')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      const fatura = faturas.find(f => f.id === id);
      await logAction('EDITAR', 'FINANCEIRO', `Alterou datas da fatura: ${fatura?.cliente_nome} - ${fatura?.assunto}`, 'Financeiro');

      await loadFaturas();
    } catch (error) {
      console.error('Erro ao atualizar datas:', error);
      throw error;
    }
  };

  return {
    faturas,
    loading,
    enviarFatura,
    confirmarPagamento,
    atualizarStatus,
    excluirFatura,
    atualizarDatasFatura,
    recarregar: loadFaturas
  };
}