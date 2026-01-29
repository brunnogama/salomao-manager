import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Lock, ShieldAlert, Unlock, KeyRound } from 'lucide-react'
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

  if (loading) return <div className="h-full flex items-center justify-center text-gray-400">Verificando credenciais...</div>

  // 1. Acesso Negado
  if (!hasAccess) return <AccessDenied email={currentUserEmail} />

  // 2. Tela de PIN
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

  // 3. Conteúdo Liberado
  return (
    <div className="h-full flex flex-col">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-800 text-xs font-bold">
          <KeyRound className="h-4 w-4" /> MODO SEGURO: Autoridades
        </div>
        <button onClick={handleLock} className="text-xs font-bold underline text-yellow-800 hover:text-yellow-900">Bloquear Tela</button>
      </div>
      <Clients tableName="magistrados" />
    </div>
  )
}

// Sub-componente: Acesso Negado
function AccessDenied({ email }: { email: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl border p-8 text-center animate-fadeIn">
      <div className="bg-red-100 p-6 rounded-full mb-6"><ShieldAlert className="h-16 w-16 text-red-600" /></div>
      <h2 className="text-2xl font-bold text-[#112240] mb-2">Acesso Restrito</h2>
      <p className="text-gray-500 max-w-md mx-auto mb-6">Seu usuário (<strong>{email}</strong>) não possui credenciais.</p>
      <div className="bg-white p-4 rounded-lg border text-xs text-gray-400">Solicite acesso ao Administrador.</div>
    </div>
  )
}

// Sub-componente: Tela de PIN
function PinOverlay({ pinInput, errorMsg, onChange, onVerify }: any) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#112240] to-[#1a365d] rounded-xl relative overflow-hidden animate-fadeIn">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      <div className="relative z-10 bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100">
        <div className="mx-auto mb-8 flex justify-center">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
            <Lock className="h-10 w-10 text-white" />
          </div>
        </div>
        <div className="text-center mb-8">
          <h3 className="text-2xl font-black text-gray-900 mb-2">Área de Autoridades</h3>
          <p className="text-sm text-gray-500">Digite o PIN de 4 dígitos para acessar</p>
        </div>
        <div className="flex justify-center gap-3 mb-6">
          {pinInput.map((digit: string, idx: number) => (
            <input 
              key={idx} id={`pin-${idx}`} type="password" maxLength={1} value={digit}
              onChange={(e) => onChange(idx, e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' && idx === 3) onVerify();
                if (e.key === 'Backspace' && !digit && idx > 0) document.getElementById(`pin-${idx - 1}`)?.focus()
              }}
              className="w-14 h-16 border-2 border-gray-200 rounded-xl text-center text-3xl font-black focus:border-blue-500 outline-none transition-all bg-gray-50 shadow-sm"
            />
          ))}
        </div>
        {errorMsg && <p className="text-red-600 text-center text-sm font-bold mb-4 animate-shake">{errorMsg}</p>}
        <button onClick={onVerify} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg">
          <Unlock className="h-5 w-5" /> Liberar Acesso
        </button>
      </div>
      <div className="absolute bottom-6 w-full text-center">
        <p className="text-blue-300/60 text-xs font-medium tracking-wider uppercase">Salomão Advogados • Área Restrita</p>
      </div>
    </div>
  )
}