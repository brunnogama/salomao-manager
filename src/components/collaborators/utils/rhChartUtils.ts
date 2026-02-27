import { Collaborator } from '../../../types/controladoria'

export type Segment = 'Administrativo' | 'Jurídico'

export const normalizeString = (str?: string) => {
    if (!str) return ''
    return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export const getSegment = (colaborador: Collaborator): Segment => {
    const area = normalizeString(colaborador.area)
    if (area === 'administrativa' || area === 'administrativo') return 'Administrativo'
    if (area === 'juridica' || area === 'juridico') return 'Jurídico'

    const roleName = colaborador.roles?.name || String(colaborador.role || '')
    const teamName = colaborador.teams?.name || String(colaborador.equipe || '')

    const role = normalizeString(roleName)
    const team = normalizeString(teamName)

    const legalKeywords = ['advogado', 'juridico', 'estagiario de direito', 'estagiario', 'socio']

    if (legalKeywords.some(k => role.includes(k) || team.includes(k))) {
        return 'Jurídico'
    }

    return 'Administrativo'
}

export const isActiveAtDate = (c: Collaborator, date: Date | null) => {
    const hireDate = c.hire_date ? new Date(c.hire_date + 'T12:00:00') : null
    const termDate = c.termination_date ? new Date(c.termination_date + 'T12:00:00') : null

    if (!hireDate) return false
    if (date && hireDate > date) return false
    if (termDate && date && termDate <= date) return false

    return true
}

export const getYearFromDate = (dateStr?: string) => {
    if (!dateStr) return null
    return new Date(dateStr + 'T12:00:00').getFullYear()
}

export const calculateAge = (birthday?: string) => {
    if (!birthday) return null
    try {
        const birthDate = new Date(birthday + 'T12:00:00')
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    } catch (e) {
        return null
    }
}

export const calculateTenure = (hireDateStr: string, refDate: Date | null = new Date(), termDateStr?: string) => {
    const hireDate = new Date(hireDateStr + 'T12:00:00')
    const actualRefDate = termDateStr ? new Date(termDateStr + 'T12:00:00') : (refDate || new Date())
    const diffTime = Math.abs(actualRefDate.getTime() - hireDate.getTime())
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25)
    return diffYears
}

export const formatYears = (years: number | undefined | null) => {
    if (years === undefined || years === null || isNaN(years)) return '0 anos'
    if (years === 0) return '0 anos'
    if (years < 1) return '< 1 ano'
    return `${years.toFixed(1)} anos`.replace('.', ',')
}

export const wasActiveInMonth = (c: Collaborator, year: number, month: number) => {
    const hireDate = c.hire_date ? new Date(c.hire_date + 'T12:00:00') : null
    const termDate = c.termination_date ? new Date(c.termination_date + 'T12:00:00') : null

    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

    if (!hireDate) return false
    if (hireDate > endOfMonth) return false
    if (termDate && termDate < startOfMonth) return false

    return true
}
