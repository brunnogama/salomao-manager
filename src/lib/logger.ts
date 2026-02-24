import { supabase } from './supabase'

export async function logAction(action: string, module: string, details: string, page?: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const email = session?.user?.email || 'Sistema'

    // Tenta obter o IP do cliente
    let ip = 'Desconhecido'
    try {
      const resp = await fetch('https://api.ipify.org?format=json')
      const data = await resp.json()
      ip = data.ip
    } catch (e) {
      console.warn('Não foi possível obter o IP do cliente')
    }

    // Tenta obter o nome do usuário (do prefixo do email)
    // Não consultamos 'nome' no banco pois a coluna não existe
    let userName = email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')

    // Consolida as informações no campo details para garantir compatibilidade com o banco
    // Mas o formato JSON permitirá que a UI extraia os dados individualmente
    const enhancedDetails = JSON.stringify({
      info: details,
      ip: ip,
      user_name: userName,
      page: page || module
    })

    await supabase.from('logs').insert({
      user_email: email,
      action,
      module,
      details: enhancedDetails
    })
  } catch (error) {
    console.error('Falha ao registrar log:', error)
  }
}
