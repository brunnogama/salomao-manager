import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Lock, ShieldAlert, Unlock, Shield } from 'lucide-react'
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
      setErrorMsg('PIN incorreto.')
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
      <div className="bg-gray-50 border border-gray-300 p-4 mb-4 flex items-center justify-between rounded">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded border border-gray-200">
            <Shield className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Modo Seguro Ativado</p>
            <p className="text-xs text-gray-600">Área de Autoridades - Dados Sensíveis</p>
          </div>
        </div>
        <button 
          onClick={handleLock} 
          className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 px-4 py-2 rounded border border-gray-300 transition-colors"
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
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
      <div className="mb-6">
        <div className="bg-gray-100 p-6 rounded-full border border-gray-200 inline-block">
          <ShieldAlert className="h-16 w-16 text-gray-600" />
        </div>
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
      <p className="text-gray-600 max-w-md mx-auto mb-4 text-sm">
        Seu usuário não possui credenciais para acessar esta área sensível.
      </p>
      <div className="bg-white px-4 py-2 rounded border border-gray-200 text-sm font-mono text-gray-600 mb-6">
        {email}
      </div>
      
      <div className="bg-gray-100 border border-gray-200 p-4 rounded text-sm text-gray-700 max-w-md">
        <p className="font-semibold mb-1">Como obter acesso?</p>
        <p className="text-xs text-gray-600">Solicite permissão ao Administrador do sistema.</p>
      </div>
    </div>
  )
}

function PinOverlay({ pinInput, errorMsg, onChange, onVerify }: any) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#112240] rounded-lg relative overflow-hidden">
      <div className="relative z-10 bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-200">
        <div className="mx-auto mb-6 flex justify-center">
          <div className="bg-gray-100 w-16 h-16 rounded-lg flex items-center justify-center border border-gray-200">
            <Lock className="h-8 w-8 text-gray-700" />
          </div>
        </div>
        
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-1 flex items-center justify-center gap-2">
            <Shield className="h-5 w-5 text-gray-600" />
            Área de Autoridades
          </h3>
          <p className="text-sm text-gray-600">Digite o PIN de 4 dígitos para acessar</p>
        </div>
        
        <div className="flex justify-center gap-2 mb-5">
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
              className="w-12 h-14 border border-gray-300 rounded text-center text-2xl font-bold focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all bg-white"
            />
          ))}
        </div>
        
        {errorMsg && (
          <div className="bg-gray-100 border border-gray-300 rounded p-3 mb-4">
            <p className="text-gray-900 text-center text-sm font-semibold">{errorMsg}</p>
          </div>
        )}
        
        <button 
          onClick={onVerify} 
          className="w-full bg-[#112240] hover:bg-[#1a3a6c] text-white py-3 rounded font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Unlock className="h-4 w-4" /> Liberar Acesso
        </button>
      </div>
      
      <div className="absolute bottom-6 w-full text-center">
        <p className="text-white/40 text-xs font-medium tracking-wider uppercase">Salomão Advogados • Área Restrita</p>
      </div>
    </div>
  )
}