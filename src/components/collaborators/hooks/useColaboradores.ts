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
    const [
      colabRes,
      rolesRes,
      teamsRes,
      locsRes
    ] = await Promise.all([
      supabase.from('collaborators').select(`
        *,
        partner:partners(id, name),
        leader:collaborators!collaborators_leader_id_fkey(id, name)
      `).order('name'),
      supabase.from('roles').select('id, name'),
      supabase.from('teams').select('id, name'),
      supabase.from('locations').select('id, name')
    ])

    if (colabRes.data) {
      const rolesMap = new Map(rolesRes.data?.map(r => [String(r.id), r.name]) || [])
      const teamsMap = new Map(teamsRes.data?.map(t => [String(t.id), t.name]) || [])
      const locsMap = new Map(locsRes.data?.map(l => [String(l.id), l.name]) || [])

      const enrichedData = colabRes.data.map(c => ({
        ...c,
        roles: { name: rolesMap.get(String(c.role)) || c.role },
        teams: { name: teamsMap.get(String(c.equipe)) || c.equipe },
        locations: { name: locsMap.get(String(c.local)) || c.local }
      }))

      setColaboradores(enrichedData)
    }
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