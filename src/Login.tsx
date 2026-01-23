import { useState } from 'react'
import { supabase } from './lib/supabase'
import { User, Lock, ArrowRight, Loader2, LayoutGrid, Eye, EyeOff } from 'lucide-react'

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
    } catch (err: any) {
      setError('Credenciais inválidas. Verifique usuário e senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-white">
      
      {/* LADO ESQUERDO - FORMULÁRIO */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 animate-fadeIn">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
             <img 
               src="/logo-salomao.png" 
               alt="Salomão Advogados" 
               className="h-20 w-auto object-contain mb-4 block" 
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 const parent = e.currentTarget.parentElement;
                 if (parent) {
                    const textNode = document.createElement('h1');
                    textNode.innerText = 'SALOMÃO ADVOGADOS';
                    textNode.className = 'text-3xl font-black text-[#112240] tracking-tighter';
                    parent.appendChild(textNode);
                 }
               }}
             />
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Input Usuário */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">
                Usuário Corporativo
              </label>
              
              {/* Container unificado corrigido: removido ring-inset e usado border/ring externo */}
              <div className="group flex rounded-lg shadow-sm border border-gray-300 focus-within:border-[#112240] focus-within:ring-1 focus-within:ring-[#112240] overflow-hidden transition-all outline-none bg-white">
                <div className="flex items-center pl-3 text-gray-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={emailPrefix}
                  onChange={(e) => setEmailPrefix(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  style={{ caretColor: '#112240' }} 
                  className="block flex-1 border-0 bg-transparent py-3 pl-2 text-gray-900 placeholder:text-gray-400 focus:ring-0 outline-none sm:text-sm sm:leading-6"
                  placeholder="usuário"
                />
                <span className="flex select-none items-center bg-gray-50 px-3 text-gray-500 sm:text-sm font-medium border-l border-gray-200 group-focus-within:bg-blue-50 group-focus-within:text-blue-900 group-focus-within:border-blue-100 transition-colors">
                  @salomaoadv.com.br
                </span>
              </div>
            </div>

            {/* Input Senha */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">
                Senha
              </label>
              
              <div className="relative rounded-lg shadow-sm border border-gray-300 focus-within:border-[#112240] focus-within:ring-1 focus-within:ring-[#112240] transition-all outline-none bg-white">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ caretColor: '#112240' }}
                  className="block w-full border-0 bg-transparent py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:ring-0 outline-none sm:text-sm sm:leading-6"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium text-center border border-red-100 animate-pulse">
                {error}
              </div>
            )}

            {/* Botão Acessar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg shadow-blue-900/20 text-sm font-bold text-white bg-[#112240] hover:bg-[#1a3a6c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#112240] transition-all disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  ACESSAR MANAGER 
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8 pt-8 border-t border-gray-100">
            © 2026 SALOMÃO ADVOGADOS • V1.5
          </p>
        </div>
      </div>

      {/* LADO DIREITO - BRANDING SALOMÃO MANAGER */}
      <div className="hidden lg:flex w-1/2 relative bg-[#112240] items-center justify-center overflow-hidden">
        
        {/* Imagem de Fundo */}
        <div 
            className="absolute inset-0 z-0 bg-cover bg-center opacity-30 mix-blend-overlay"
            style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop')" 
            }}
        ></div>
        
        {/* Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#112240]/95 via-[#112240]/80 to-[#0a1525]/90 z-10"></div>

        {/* Conteúdo de Texto */}
        <div className="relative z-20 max-w-lg p-12 text-white animate-slideInRight">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/20 backdrop-blur-sm shadow-2xl">
            <LayoutGrid className="h-7 w-7 text-blue-300" />
          </div>
          
          <h2 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight drop-shadow-lg">
            Salomão<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">Manager</span>
          </h2>
          
          <div className="w-20 h-1.5 bg-blue-500 rounded-full mb-8 shadow-lg shadow-blue-500/50"></div>
          
          <p className="text-xl text-gray-200 mb-2 font-medium">
            Gestão Administrativa Centralizada
          </p>
          <p className="text-sm text-gray-400 mb-10 leading-relaxed max-w-sm">
            Plataforma unificada para controle do escritório, patrimônio familiar e colaboradores.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default backdrop-blur-sm">
                <span className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                <div>
                    <strong className="block text-sm text-white">Brindes/strong>
                    <span className="text-xs text-gray-400">Clientes e Brindes</span>
                </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default backdrop-blur-sm">
                <span className="w-2 h-8 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                <div>
                    <strong className="block text-sm text-white">Gestão Familiar</strong>
                    <span className="text-xs text-gray-400">Patrimônio e Imóveis</span>
                </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default backdrop-blur-sm">
                <span className="w-2 h-8 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                <div>
                    <strong className="block text-sm text-white">Colaboradores</strong>
                    <span className="text-xs text-gray-400">Portal de RH e Time</span>
                </div>
            </div>
            {/* NOVO MÓDULO FINANCEIRO */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default backdrop-blur-sm">
                <span className="w-2 h-8 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                <div>
                    <strong className="block text-sm text-white">Financeiro</strong>
                    <span className="text-xs text-gray-400">Notas e Faturamento</span>
                </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}