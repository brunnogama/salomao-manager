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
    <div className="min-h-screen flex w-full bg-white overflow-hidden">
      
      {/* LADO ESQUERDO - FORMULÁRIO */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 animate-in fade-in duration-700">
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
                    textNode.className = 'text-3xl font-black text-[#0a192f] tracking-tighter';
                    parent.appendChild(textNode);
                 }
               }}
             />
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Input Usuário */}
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase mb-3 tracking-[0.2em]">
                Usuário Corporativo
              </label>
              
              {/* Container unificado */}
              <div className="group flex rounded-xl shadow-sm border border-gray-200 focus-within:border-[#1e3a8a] focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 overflow-hidden transition-all bg-white hover:border-gray-300">
                <div className="flex items-center pl-4 text-gray-400 group-focus-within:text-[#1e3a8a] transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={emailPrefix}
                  onChange={(e) => setEmailPrefix(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  style={{ caretColor: '#1e3a8a' }} 
                  className="block flex-1 border-0 bg-transparent py-3.5 pl-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 outline-none text-sm font-medium"
                  placeholder="usuário"
                />
                <span className="flex select-none items-center bg-gray-50 px-4 text-gray-500 text-sm font-bold border-l border-gray-200 group-focus-within:bg-[#1e3a8a]/5 group-focus-within:text-[#1e3a8a] group-focus-within:border-[#1e3a8a]/20 transition-colors">
                  @salomaoadv.com.br
                </span>
              </div>
            </div>

            {/* Input Senha */}
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase mb-3 tracking-[0.2em]">
                Senha
              </label>
              
              <div className="relative rounded-xl shadow-sm border border-gray-200 focus-within:border-[#1e3a8a] focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 transition-all bg-white hover:border-gray-300">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 peer-focus:text-[#1e3a8a]">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ caretColor: '#1e3a8a' }}
                  className="peer block w-full border-0 bg-transparent py-3.5 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:ring-0 outline-none text-sm font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-[#1e3a8a] focus:outline-none cursor-pointer transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold text-center border border-red-200 animate-in fade-in duration-200">
                {error}
              </div>
            )}

            {/* Botão Acessar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg shadow-[#1e3a8a]/20 text-sm font-black text-white bg-gradient-to-r from-[#1e3a8a] to-[#112240] hover:from-[#112240] hover:to-[#0a192f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3a8a] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.98] uppercase tracking-wider"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Acessar Manager
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[9px] text-gray-400 mt-8 pt-8 border-t border-gray-100 font-black uppercase tracking-[0.2em]">
            © 2026 Salomão Advogados • V1.6
          </p>
        </div>
      </div>

      {/* LADO DIREITO - BRANDING SALOMÃO MANAGER */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a2c4e] items-center justify-center overflow-hidden">
        
        {/* Imagem de Fundo */}
        <div 
            className="absolute inset-0 z-0 bg-cover bg-center opacity-20 mix-blend-overlay"
            style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop')" 
            }}
        ></div>
        
        {/* Pattern decorativo */}
        <div className="absolute inset-0 z-5 opacity-5" style={{ 
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        {/* Conteúdo de Texto */}
        <div className="relative z-20 max-w-lg p-12 text-white animate-in slide-in-from-right duration-700">
          
          {/* Icon Badge */}
          <div className="w-16 h-16 bg-gradient-to-br from-[#1e3a8a] to-[#112240] rounded-2xl flex items-center justify-center mb-8 border-2 border-white/10 backdrop-blur-sm shadow-2xl shadow-[#1e3a8a]/50">
            <LayoutGrid className="h-8 w-8 text-white" />
          </div>
          
          {/* Title */}
          <h2 className="text-6xl font-black mb-6 leading-none tracking-tighter">
            Salomão
            <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-amber-300 to-[#d4af37]">
              Manager
            </span>
          </h2>
          
          {/* Decorative line */}
          <div className="flex items-center gap-2 mb-8">
            <div className="h-1 w-16 bg-gradient-to-r from-[#d4af37] to-transparent rounded-full shadow-lg shadow-[#d4af37]/50"></div>
            <div className="w-2 h-2 rounded-full bg-[#d4af37] shadow-lg shadow-[#d4af37]/50"></div>
          </div>
          
          {/* Subtitle */}
          <p className="text-xl text-gray-100 mb-3 font-bold tracking-tight">
            Gestão Administrativa Centralizada
          </p>
          <p className="text-sm text-gray-400 mb-10 leading-relaxed max-w-md font-medium">
            Plataforma unificada para controle do escritório, patrimônio familiar e colaboradores
          </p>

          {/* Module Cards */}
          <div className="space-y-3">
            
            {/* CRM/Brindes */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-default backdrop-blur-sm group hover:border-blue-400/30">
                <div className="w-1 h-10 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full shadow-lg shadow-blue-500/50 group-hover:h-12 transition-all"></div>
                <div>
                    <strong className="block text-sm font-black text-white tracking-tight">Brindes</strong>
                    <span className="text-[10px] text-gray-400 font-semibold">Clientes e Brindes</span>
                </div>
            </div>

            {/* Secretaria Executiva */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-default backdrop-blur-sm group hover:border-purple-400/30">
                <div className="w-1 h-10 bg-gradient-to-b from-purple-500 to-purple-400 rounded-full shadow-lg shadow-purple-500/50 group-hover:h-12 transition-all"></div>
                <div>
                    <strong className="block text-sm font-black text-white tracking-tight">Secretaria Executiva</strong>
                    <span className="text-[10px] text-gray-400 font-semibold">Demandas dos sócios</span>
                </div>
            </div>

            {/* Colaboradores */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-default backdrop-blur-sm group hover:border-green-400/30">
                <div className="w-1 h-10 bg-gradient-to-b from-green-500 to-green-400 rounded-full shadow-lg shadow-green-500/50 group-hover:h-12 transition-all"></div>
                <div>
                    <strong className="block text-sm font-black text-white tracking-tight">Colaboradores</strong>
                    <span className="text-[10px] text-gray-400 font-semibold">Portal de RH e Time</span>
                </div>
            </div>
            
            {/* Financeiro */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-default backdrop-blur-sm group hover:border-emerald-400/30">
                <div className="w-1 h-10 bg-gradient-to-b from-emerald-500 to-emerald-400 rounded-full shadow-lg shadow-emerald-500/50 group-hover:h-12 transition-all"></div>
                <div>
                    <strong className="block text-sm font-black text-white tracking-tight">Financeiro</strong>
                    <span className="text-[10px] text-gray-400 font-semibold">Notas e Faturamento</span>
                </div>
            </div>

            {/* Operacional */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-default backdrop-blur-sm group hover:border-amber-400/30">
                <div className="w-1 h-10 bg-gradient-to-b from-amber-500 to-amber-400 rounded-full shadow-lg shadow-amber-500/50 group-hover:h-12 transition-all"></div>
                <div>
                    <strong className="block text-sm font-black text-white tracking-tight">Operacional</strong>
                    <span className="text-[10px] text-gray-400 font-semibold">Gestão do Escritório</span>
                </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
