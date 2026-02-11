// brunnogama/salomao-manager/salomao-manager-3e743876de4fb5af74c8aedf5b89ce1e3913c795/src/components/controladoria/services/contractService.ts

import { supabase } from '../../../lib/supabase';
import { Contract } from '../../../types/controladoria';

export const contractService = {
  async getAll(): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        partner:partners(id, name),
        client:clients(*)
      `);

    if (error) {
      console.error('Erro ao buscar contratos:', error);
      throw error;
    }

    return data || [];
  },

  subscribe(onUpdate: () => void) {
    const subscription = supabase
      .channel('contracts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, onUpdate)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
};