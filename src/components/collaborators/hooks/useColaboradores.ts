// src/hooks/useColaboradores.ts
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase' // Caminho de importação ajustado para o padrão do projeto
import { Collaborator, GEDDocument } from '../../../types/controladoria' // Caminho de importação ajustado

export function useColaboradores() {
  const [colaboradores, setColaboradores] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(false)
  const [gedDocs, setGedDocs] = useState<GEDDocument[]>([])
  const [uploadingGed, setUploadingGed] = useState(false)

  // Master lists
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([])

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
        // Set Master Lists
        setRoles(rolesRes.data || [])
        setTeams(teamsRes.data || [])
        setLocations(locsRes.data || [])
        setPartners(partnersRes.data || [])

        const rolesMap = new Map(rolesRes.data?.map(r => [String(r.id), r.name]) || [])
        const teamsMap = new Map(teamsRes.data?.map(t => [String(t.id), t.name]) || [])
        const locsMap = new Map(locsRes.data?.map(l => [String(l.id), l.name]) || [])
        const partnersMap = new Map(partnersRes.data?.map(p => [String(p.id), p.name]) || [])
        const leadersMap = new Map(leadersRes.data?.map(l => [String(l.id), l.name]) || [])

        // Helper
        const getPartnerNameFromLegacy = (c: any, map: Map<string, string>) => {
          if (c.partner_id && map.has(String(c.partner_id))) return map.get(String(c.partner_id))
          return c.socio || c.partner
        }

        const enrichedData = colabRes.data.map(c => ({
          ...c,
          roles: { name: rolesMap.get(String(c.role)) || c.role },
          // role: rolesMap.get(String(c.role)) || c.role, // REMOVED: Keep ID

          teams: { name: teamsMap.get(String(c.equipe)) || c.equipe },

          locations: { name: locsMap.get(String(c.local)) || c.local },
          // local: locsMap.get(String(c.local)) || c.local, // REMOVED: Keep ID

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
    deleteColaborador,
    // Export Master Lists
    roles,
    teams,
    locations,
    partners
  }
}
