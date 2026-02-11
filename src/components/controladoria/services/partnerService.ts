// brunnogama/salomao-manager/salomao-manager-3e743876de4fb5af74c8aedf5b89ce1e3913c795/src/components/controladoria/services/partnerService.ts

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

    // Mapeia a coluna 'status' do banco para a propriedade 'active' da interface
    return (data || []).map(p => ({
      ...p,
      active: p.status === 'active'
    }));
  }
};