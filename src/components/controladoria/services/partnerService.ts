import { supabase } from '../../../lib/supabase';
import { Partner } from '../../../types/controladoria';

export const partnerService = {
  async getAll(): Promise<Partner[]> {
    const { data, error } = await supabase
      .from('partners')
      .select('*');

    if (error) {
      console.error('Erro ao buscar sócios:', error);
      throw error;
    }

    return data || [];
  }
};
