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

    // Tenta obter o nome do usuário (do perfil)
    let userName = email.split('@')[0]
    try {
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('nome')
          .eq('email', email)
          .maybeSingle()
        if (profile?.nome) userName = profile.nome
      }
    } catch (e) {
      // Fallback para o prefixo do email
    }

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
