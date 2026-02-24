import { useState } from 'react'
import { supabase } from './lib/supabase'
import { logAction } from './lib/logger'
import { User, Lock, ArrowRight, Loader2, LayoutGrid, Eye, EyeOff, Scale, Mail } from 'lucide-react'
import { SYSTEM_VERSION } from './config/version'
export default function Login() {
  const [emailPrefix, setEmailPrefix] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const email = `${emailPrefix}@salomaoadv.com.br`
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      await logAction('LOGIN', 'AUTH', 'Usuário realizou login', 'Login')
    } catch (err: any) {
      setError('Credenciais inválidas. Verifique usuário e senha.')
    } finally {
      setLoading(false)
    }
  }

  const handleOutlookLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email profile',
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (err: any) {
      console.error('Erro Outlook Login:', err)
      setError('Erro ao abrir janela do Outlook.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-white overflow-hidden">

      {/* LADO ESQUERDO - FORMULÁRIO */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 animate-in fade-in duration-1000 bg-[#f8fafc] relative">

        {/* Decorative subtle background grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4=')] opacity-50 z-0"></div>

        <div className="w-full max-w-[420px] space-y-10 relative z-10">

          {/* Logo & Welcome */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative group cursor-default">
              <div className="absolute inset-0 bg-[#1e3a8a]/5 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <img
                src="/logo-salomao.png"
                alt="Salomão Advogados"
                className="h-24 w-auto object-contain mb-8 block relative z-10 drop-shadow-sm transition-transform duration-500 group-hover:scale-[1.02]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const textNode = document.createElement('h1');
                    textNode.innerText = 'SALOMÃO ADVOGADOS';
                    textNode.className = 'text-3xl font-black text-[#0a192f] tracking-tighter';
                    parent.appendChild(textNode);
                  }
                }}
              />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black text-[#0a192f] tracking-tight">Bem-vindo de volta</h1>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">

            {/* Input Usuário */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-[#0a192f]/70 uppercase tracking-widest pl-1">
                Usuário Corporativo
              </label>

              <div className="group flex rounded-2xl shadow-sm border border-gray-200/80 focus-within:border-[#1e3a8a] focus-within:ring-4 focus-within:ring-[#1e3a8a]/10 overflow-hidden transition-all duration-300 bg-white hover:border-gray-300 hover:shadow-md">
                <div className="flex items-center pl-4 text-gray-400 group-focus-within:text-[#1e3a8a] transition-colors">
                  <User className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="text"
                  required
                  value={emailPrefix}
                  onChange={(e) => setEmailPrefix(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  style={{ caretColor: '#1e3a8a' }}
                  className="block flex-1 border-0 bg-transparent py-4 pl-3 text-[#0a192f] placeholder:text-gray-300 focus:ring-0 outline-none text-sm font-bold tracking-wide"
                  placeholder="Seu usuário"
                />
                <span className="flex select-none items-center bg-gray-50/50 px-4 text-gray-400 text-xs font-bold border-l border-gray-100 group-focus-within:bg-[#1e3a8a]/[0.02] group-focus-within:text-[#1e3a8a]/70 group-focus-within:border-[#1e3a8a]/20 transition-colors">
                  @salomaoadv.com.br
                </span>
              </div>
            </div>

            {/* Input Senha */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-end pl-1 pr-2">
                <label className="block text-[10px] font-black text-[#0a192f]/70 uppercase tracking-widest">
                  Senha
                </label>
                {/* Optional Forgot Password Link */}
                <a href="#" className="text-[10px] font-bold text-[#1e3a8a] hover:text-[#d4af37] transition-colors">Esqueceu?</a>
              </div>

              <div className="relative rounded-2xl shadow-sm border border-gray-200/80 focus-within:border-[#1e3a8a] focus-within:ring-4 focus-within:ring-[#1e3a8a]/10 transition-all duration-300 bg-white hover:border-gray-300 hover:shadow-md group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-[#1e3a8a] transition-colors">
                  <Lock className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ caretColor: '#1e3a8a' }}
                  className="peer block w-full border-0 bg-transparent py-4 pl-12 pr-12 text-[#0a192f] placeholder:text-gray-300 focus:ring-0 outline-none text-sm font-bold tracking-wide"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-[#1e3a8a] focus:outline-none cursor-pointer transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" strokeWidth={2} /> : <Eye className="h-5 w-5" strokeWidth={2} />}
                </button>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-bold text-center border border-red-100 animate-in fade-in zoom-in-95 duration-200 shadow-sm flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                {error}
              </div>
            )}

            {/* Divisor */}
            <div className="pt-2"></div>

            {/* Botão Acessar */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full flex justify-center items-center py-4 px-6 rounded-2xl text-sm font-black text-white bg-[#0a192f] hover:bg-[#112240] focus:outline-none focus:ring-4 focus:ring-[#0a192f]/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.98] uppercase tracking-widest overflow-hidden shadow-xl shadow-[#0a192f]/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#d4af37]" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Acessar Manager</span>
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" strokeWidth={3} />
                  </div>
                </div>
              )}
            </button>

            {/* Divisor Outlook */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200/60"></div>
              <span className="flex-shrink mx-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">ou</span>
              <div className="flex-grow border-t border-gray-200/60"></div>
            </div>

            {/* Botão Outlook */}
            <button
              type="button"
              onClick={handleOutlookLogin}
              disabled={loading}
              className="relative w-full flex justify-center items-center py-4 px-6 rounded-2xl text-xs font-black text-[#0a192f] bg-white border border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.98] uppercase tracking-widest shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#0078d4]" />
                <span>Entrar com a conta Salomão</span>
              </div>
            </button>
          </form>

          <div className="text-center pt-8 border-t border-gray-200/60 flex flex-col items-center gap-2">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
              © 2026 Salomão Advogados
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
              <span className="text-[10px] text-gray-500 font-bold tracking-widest">V{SYSTEM_VERSION}</span>
            </div>
          </div>
        </div>
      </div>

      {/* LADO DIREITO - BRANDING SALOMÃO MANAGER */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0a0a0a] items-center justify-center overflow-hidden">

        {/* Imagem de Fundo (Abstract Dark) */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=2029&auto=format&fit=crop')"
          }}
        ></div>

        {/* Gradientes e Overlay */}
        <div className="absolute inset-0 z-1 bg-gradient-to-br from-[#0a192f]/90 via-[#0a0a0a]/95 to-[#1a2c4e]/90"></div>
        <div className="absolute -top-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-[#1e3a8a]/20 blur-[120px] z-2"></div>
        <div className="absolute -bottom-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-[#d4af37]/10 blur-[100px] z-2"></div>

        {/* Pattern decorativo sutil */}
        <div className="absolute inset-0 z-5 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }}></div>

        {/* Conteúdo de Texto */}
        <div className="relative z-20 max-w-xl p-14 text-white animate-in slide-in-from-right duration-1000 slide-in-from-right-10">

          {/* Header Superior */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-xl shadow-2xl relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <LayoutGrid className="h-6 w-6 text-white/90 relative z-10 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[0.3em] text-[#d4af37] uppercase mb-1">Sistema Integrado</p>
              <div className="h-[1px] w-12 bg-gradient-to-r from-[#d4af37]/50 to-transparent"></div>
            </div>
          </div>

          {/* Title Area */}
          <div className="mb-14">
            <h2 className="text-5xl lg:text-6xl font-black mb-4 leading-[1.1] tracking-tighter">
              Salomão
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                Manager.
              </span>
            </h2>
            <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-sm">
              Plataforma unificada para controle do escritório, secretaria executiva e colaboradores.
            </p>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-2 gap-3 relative">
            {/* Glow effect for grid */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/5 blur-3xl rounded-[100%] pointer-events-none opacity-20 z-0"></div>

            {/* CRM/Brindes */}
            <div className="relative z-10 flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 backdrop-blur-md group hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border border-blue-500/20 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all shrink-0">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              </div>
              <div>
                <strong className="block text-sm font-bold text-white tracking-wide mb-1">Clientes</strong>
                <span className="text-[11px] text-gray-500 font-medium leading-tight block">Gestão de Clientes</span>
              </div>
            </div>

            {/* Secretaria Executiva */}
            <div className="relative z-10 flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 backdrop-blur-md group hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center border border-purple-500/20 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all shrink-0">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              </div>
              <div>
                <strong className="block text-sm font-bold text-white tracking-wide mb-1">Executiva</strong>
                <span className="text-[11px] text-gray-500 font-medium leading-tight block">Demandas dos sócios</span>
              </div>
            </div>

            {/* Colaboradores */}
            <div className="relative z-10 flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 backdrop-blur-md group hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center border border-green-500/20 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
              </div>
              <div>
                <strong className="block text-sm font-bold text-white tracking-wide mb-1">RH</strong>
                <span className="text-[11px] text-gray-500 font-medium leading-tight block">Portal e Time</span>
              </div>
            </div>

            {/* Financeiro */}
            <div className="relative z-10 flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 backdrop-blur-md group hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              </div>
              <div>
                <strong className="block text-sm font-bold text-white tracking-wide mb-1">Financeiro</strong>
                <span className="text-[11px] text-gray-500 font-medium leading-tight block">Notas e Faturamento</span>
              </div>
            </div>

            {/* Operacional */}
            <div className="relative z-10 flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 backdrop-blur-md group hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all shrink-0">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              </div>
              <div>
                <strong className="block text-sm font-bold text-white tracking-wide mb-1">Operacional</strong>
                <span className="text-[11px] text-gray-500 font-medium leading-tight block">Gestão do Escritório</span>
              </div>
            </div>

            {/* Controladoria */}
            <div className="relative z-10 flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 backdrop-blur-md group hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 flex items-center justify-center border border-indigo-500/20 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all shrink-0">
                <Scale className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <strong className="block text-sm font-bold text-white tracking-wide mb-1">Controladoria</strong>
                <span className="text-[11px] text-gray-500 font-medium leading-tight block">Jurídica e Prazos</span>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
