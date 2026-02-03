import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Colaborador, GEDDocument } from '../../../types/colaborador';
import { toTitleCase } from '../utils/colaboradoresUtils';

export function useColaboradores() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(false);
  const [gedDocs, setGedDocs] = useState<GEDDocument[]>([]);
  const [uploadingGed, setUploadingGed] = useState(false);

  const fetchColaboradores = async () => {
    setLoading(true);
    const { data } = await supabase.from('colaboradores').select('*').order('nome');
    if (data) setColaboradores(data);
    setLoading(false);
  };

  const fetchGedDocs = async (colabId: number) => {
    const { data } = await supabase.from('ged_colaboradores')
      .select('*')
      .eq('colaborador_id', colabId)
      .order('created_at', { ascending: false });
    if (data) setGedDocs(data);
  };

  const deleteColaborador = async (id: number, fotoUrl?: string) => {
    if (!confirm('Excluir?')) return;
    if (fotoUrl) {
      const path = fotoUrl.split('/fotos-colaboradores/')[1];
      if (path) await supabase.storage.from('fotos-colaboradores').remove([`colaboradores/${path}`]);
    }
    await supabase.from('colaboradores').delete().eq('id', id);
    fetchColaboradores();
  };

  useEffect(() => {
    fetchColaboradores();
  }, []);

  return {
    colaboradores,
    loading,
    gedDocs,
    uploadingGed,
    fetchColaboradores,
    fetchGedDocs,
    deleteColaborador,
    setGedDocs,
    setUploadingGed
  };
}