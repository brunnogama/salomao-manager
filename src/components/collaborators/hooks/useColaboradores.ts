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
    try {
      // Fetches collaborators and related tables in parallel to avoid join errors
      const [
        colabRes,
        rolesRes,
        teamsRes,
        locsRes,
        partnersRes,
        leadersRes
      ] = await Promise.all([
        supabase.from('collaborators').select('*').order('name'),
        supabase.from('roles').select('id, name'),
        supabase.from('teams').select('id, name'),
        supabase.from('locations').select('id, name'),
        supabase.from('partners').select('id, name'),
        supabase.from('collaborators').select('id, name') // For leaders
      ])

      if (colabRes.error) {
        console.error('Error fetching collaborators:', colabRes.error)
        throw colabRes.error
      }

      if (colabRes.data) {
        // Create Lookups
        const createMap = (list: any[]) => new Map(list?.map(i => [String(i.id), i.name]) || [])

        const rolesMap = createMap(rolesRes.data || [])
        const teamsMap = createMap(teamsRes.data || [])
        const locsMap = createMap(locsRes.data || [])
        const partnersMap = createMap(partnersRes.data || [])
        const leadersMap = createMap(leadersRes.data || [])

        // Helper to try to resolve partner if partner_id is missing but 'socio' field exists
        const getPartnerNameFromLegacy = (c: any, map: Map<string, string>) => {
          if (c.partner_id && map.has(String(c.partner_id))) return map.get(String(c.partner_id))
          return c.socio || c.partner // Fallback to textual fields if any
        }

        const enrichedData = colabRes.data.map(c => ({
          ...c,
          roles: { name: rolesMap.get(String(c.role)) || c.role },
          role: rolesMap.get(String(c.role)) || c.role, // Populate role name directly too

          teams: { name: teamsMap.get(String(c.equipe)) || c.equipe },

          locations: { name: locsMap.get(String(c.local)) || c.local },
          local: locsMap.get(String(c.local)) || c.local, // Populate local name directly too

          partner: { name: partnersMap.get(String(c.partner_id)) || getPartnerNameFromLegacy(c, partnersMap) },

          leader: { name: leadersMap.get(String(c.leader_id)) }
        }))

        setColaboradores(enrichedData)
      }
    } catch (error) {
      console.error('Failed to load collaborators:', error)
    } finally {
      setLoading(false)
    }
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
