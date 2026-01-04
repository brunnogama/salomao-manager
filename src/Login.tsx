import { useState } from 'react'
import { User, Lock, ArrowRight, ChevronRight } from 'lucide-react'
import { supabase } from './lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Erro ao acessar: Verifique suas credenciais.')
    } else {
      // O App.tsx vai detectar o login automaticamente e mudar a tela
      // não precisamos redirecionar manualmente aqui
    }
    setLoading(false)
  }

  return (
    <div className="flex h-screen w-full font-sans">
      {/* LADO ESQUERDO - Formulário (Fundo Branco) */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center px-12 sm:px-24 relative">
        
        <div className="mb-16">
          <img 
            src="/logo-salomao.png" 
            alt="Salomão Advogados" 
            className="h-16 object-contain mb-2" 
          />
          {/* Espaço para subtítulo se precisar */}
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-md">
          <div className="space-y-6">
            
            {/* Input Usuário */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Usuário Corporativo
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-salomao-blue" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-salomao-blue/20 focus:border-salomao-blue transition-all"
                  placeholder="nome.sobrenome@salomaoadv.com.br"
                  required
                />
              </div>
            </div>

            {/* Input Senha */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-salomao-blue" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-salomao-blue/20 focus:border-salomao-blue transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#112240] hover:bg-[#1a3a6c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-salomao-blue transition-colors uppercase tracking-wider"
            >
              {loading ? 'Carregando...' : 'Acessar Sistema'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </div>
        </form>

        <div className="absolute bottom-8 left-0 w-full text-center">
           <p className="text-[10px] text-gray-400 tracking-widest uppercase">
             © 2026 Salomão Advogados • v1.0.0
           </p>
        </div>
      </div>

      {/* LADO DIREITO - Banner (Azul Escuro) */}
      <div className="hidden md:flex md:w-1/2 bg-[#112240] flex-col justify-center px-24 relative overflow-hidden">
        
        {/* Círculo decorativo igual ao print */}
        <div className="absolute top-1/2 left-24 -translate-y-[180%]">
             <div className="h-12 w-12 rounded-full border border-gray-600 flex items-center justify-center">
                <ArrowRight className="text-salomao-gold h-5 w-5" />
             </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white mb-2 leading-tight">
            Portal de Gestão<br/>
            Estratégica
          </h2>
          {/* Linha dourada decorativa */}
          <div className="h-1 w-16 bg-yellow-600 mb-6 mt-4"></div>

          <p className="text-gray-300 text-lg font-light leading-relaxed max-w-md">
            Centralização inteligente de CRM, Recursos Humanos e Contatos. 
            Tecnologia impulsionando a eficiência organizacional do <strong className="text-white font-semibold">Salomão Advogados</strong>.
          </p>
        </div>

        {/* Footer do lado direito */}
        <div className="absolute bottom-8 left-24">
           <p className="text-[10px] text-gray-500 tracking-widest">
             © 2026 Salomão Advogados • Portal Gestão
           </p>
        </div>
        
        {/* Gradiente sutil para dar profundidade (opcional) */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/5 to-transparent pointer-events-none"></div>
      </div>
    </div>
  )
}
