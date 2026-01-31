import { useState } from 'react'
import { supabase } from './lib/supabase'
import { Lock, Loader2, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error
      
      setMessage('Senha atualizada com sucesso! Você já pode utilizar o sistema.')
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-white items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
            <KeyRound className="h-8 w-8 text-[#1e3a8a]" />
          </div>
          <h2 className="text-2xl font-black text-[#0a192f] uppercase tracking-tight">Nova Senha</h2>
          <p className="text-sm text-gray-500 font-medium mt-2">Defina sua nova credencial de acesso</p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase mb-3 tracking-[0.2em]">
              Nova Senha Corporativa
            </label>
            <div className="relative rounded-xl shadow-sm border border-gray-200 focus-within:border-[#1e3a8a] focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 transition-all bg-white hover:border-gray-300">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full border-0 bg-transparent py-3.5 pl-12 pr-12 text-gray-900 focus:ring-0 outline-none text-sm font-medium"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-[#1e3a8a]"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="p-4 rounded-xl bg-green-50 text-green-600 text-xs font-bold border border-green-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!message}
            className="w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-lg text-sm font-black text-white bg-[#1e3a8a] hover:bg-[#112240] transition-all disabled:opacity-50 uppercase tracking-wider"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Redefinir Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
