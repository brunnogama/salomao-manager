import { supabase } from '../../../lib/supabase'; // Ajustado para subir 3 níveis (services -> controladoria -> components -> src/lib)
import { Contract } from '../types'; // Ajustado para a pasta pai (controladoria)

export const contractService = {
  async getAll(): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*');

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