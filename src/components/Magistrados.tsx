import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Lock, ShieldAlert, Unlock, KeyRound, Shield } from 'lucide-react'
import { Clients } from './Clients'

export function Magistrados() {
  const [hasAccess, setHasAccess] = useState(false)
  const [isPinCorrect, setIsPinCorrect] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pinInput, setPinInput] = useState(['', '', '', ''])
  const [errorMsg, setErrorMsg] = useState('')
  const [currentUserEmail, setCurrentUserEmail] = useState('')

  useEffect(() => {
    checkPermission()
  }, [])

  const checkPermission = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.email) {
      setCurrentUserEmail(user.email)
      const { data } = await supabase.from('config_magistrados').select('emails_permitidos').single()
      const allowedList = data?.emails_permitidos || []
      setHasAccess(allowedList.includes(user.email))
    }
    setLoading(false)
  }

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newPin = [...pinInput]
    newPin[index] = value
    setPinInput(newPin)
    if (value && index < 3) {
      document.getElementById(`pin-${index + 1}`)?.focus()
    }
  }

  const verifyPin = async () => {
    setErrorMsg('')
    const enteredPin = pinInput.join('')
    const { data } = await supabase.from('config_magistrados').select('pin_acesso').single()
    
    if (data && data.pin_acesso === enteredPin) {
      setIsPinCorrect(true)
    } else {
      setErrorMsg('PIN Incorreto.')
      setPinInput(['', '', '', ''])
      document.getElementById('pin-0')?.focus()
    }
  }

  const handleLock = () => {
    setPinInput(['', '', '', ''])
    setErrorMsg('')
    setIsPinCorrect(false)
    setTimeout(() => document.getElementById('pin-0')?.focus(), 100)
  }

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112240]"></div>
    </div>
  )

  if (!hasAccess) return <AccessDenied email={currentUserEmail} />

  if (!isPinCorrect) {
    return (
      <PinOverlay 
        pinInput={pinInput} 
        errorMsg={errorMsg} 
        onChange={handlePinChange} 
        onVerify={verifyPin} 
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 p-4 mb-4 flex items-center justify-between rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Shield className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">Modo Seguro Ativado</p>
            <p className="text-xs text-amber-700">Área de Autoridades - Dados Sensíveis</p>
          </div>
        </div>
        <button 
          onClick={handleLock} 
          className="flex items-center gap-2 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-lg transition-all"
        >
          <Lock className="h-4 w-4" />
          Bloquear
        </button>
      </div>
      <Clients tableName="magistrados" />
    </div>
  )
}

function AccessDenied({ email }: { email: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 p-8 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-red-500 opacity-10 rounded-full blur-2xl animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-red-100 to-red-200 p-8 rounded-full mb-6 shadow-lg">
          <ShieldAlert className="h-20 w-20 text-red-600" />
        </div>
      </div>
      
      <h2 className="text-3xl font-black text-[#112240] mb-3">Acesso Restrito</h2>
      <p className="text-gray-600 max-w-md mx-auto mb-2 leading-relaxed">
        Seu usuário não possui credenciais para acessar esta área sensível.
      </p>
      <div className="bg-white px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-mono text-gray-500 mb-6">
        {email}
      </div>
      
      <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl text-sm text-blue-800 max-w-md">
        <p className="font-bold mb-1">💡 Como obter acesso?</p>
        <p className="text-xs">Solicite permissão ao Administrador do sistema.</p>
      </div>
    </div>
  )
}

function PinOverlay({ pinInput, errorMsg, onChange, onVerify }: any) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#112240] to-slate-800 rounded-2xl relative overflow-hidden animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      <div className="relative z-10 bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 animate-in zoom-in-95 duration-500">
        <div className="mx-auto mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform">
              <Lock className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h3 className="text-2xl font-black text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Área de Autoridades
          </h3>
          <p className="text-sm text-gray-500">Digite o PIN de 4 dígitos para acessar</p>
        </div>
        
        <div className="flex justify-center gap-3 mb-6">
          {pinInput.map((digit: string, idx: number) => (
            <input 
              key={idx} 
              id={`pin-${idx}`} 
              type="password" 
              maxLength={1} 
              value={digit}
              onChange={(e) => onChange(idx, e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' && idx === 3) onVerify();
                if (e.key === 'Backspace' && !digit && idx > 0) document.getElementById(`pin-${idx - 1}`)?.focus()
              }}
              className="w-14 h-16 border-2 border-gray-300 rounded-xl text-center text-3xl font-black focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-gray-50 shadow-sm hover:border-gray-400"
            />
          ))}
        </div>
        
        {errorMsg && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4 animate-in shake">
            <p className="text-red-600 text-center text-sm font-bold">{errorMsg}</p>
          </div>
        )}
        
        <button 
          onClick={onVerify} 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
        >
          <Unlock className="h-5 w-5" /> Liberar Acesso
        </button>
      </div>
      
      <div className="absolute bottom-6 w-full text-center">
        <p className="text-blue-300/60 text-xs font-medium tracking-wider uppercase">Salomão Advogados • Área Restrita</p>
      </div>
    </div>
  )
}