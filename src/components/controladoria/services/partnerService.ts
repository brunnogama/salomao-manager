import { supabase } from '../../../lib/supabase'; // Ajustado para a raiz do Manager
import { Partner } from '../types'; // Referência local aos tipos da controladoria

export const partnerService = {
  async getAll(): Promise<Partner[]> {
    const { data, error } = await supabase
      .from('partners')
      .select('*'); // Seleciona todos os campos para satisfazer a interface Partner

    if (error) {
      console.error('Erro ao buscar sócios:', error);
      throw error;
    }

    return data || [];
  }
};