// src/hooks/useColaboradores.ts
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase' // Caminho de importação ajustado para o padrão do projeto
import { Collaborator, GEDDocument } from '../../../types/controladoria' // Caminho de importação ajustado

export function useColaboradores() {
  const [colaboradores, setColaboradores] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(false)
  const [gedDocs, setGedDocs] = useState<GEDDocument[]>([])
  const [uploadingGed, setUploadingGed] = useState(false)

  const fetchColaboradores = async () => {
    setLoading(true)
    // Atualizado para realizar join com sócios e líderes usando UUID
    const { data } = await supabase
      .from('collaborators')
      .select(`
        *,
        partner:partners(id, name),
        leader:collaborators!collaborators_leader_id_fkey(id, name)
      `)
      .order('name')

    if (data) setColaboradores(data)
    setLoading(false)
  }

  const fetchGedDocs = async (colabId: string) => {
    const { data } = await supabase
      .from('ged_colaboradores')
      .select('*')
      .eq('colaborador_id', colabId)
      .order('created_at', { ascending: false })
    if (data) setGedDocs(data)
  }

  const deleteColaborador = async (id: string, photoUrl?: string) => {
    if (!confirm('Excluir este colaborador?')) return false

    if (photoUrl) {
      const path = photoUrl.split('/fotos-colaboradores/')[1]
      if (path) await supabase.storage.from('fotos-colaboradores').remove([`colaboradores/${path}`])
    }

    await supabase.from('collaborators').delete().eq('id', id)
    await fetchColaboradores()
    return true
  }

  useEffect(() => { fetchColaboradores() }, [])

  return {
    colaboradores,
    loading,
    gedDocs,
    uploadingGed,
    setUploadingGed,
    fetchColaboradores,
    fetchGedDocs,
    deleteColaborador
  }
}