import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase'; // Caminho corrigido para o Manager
import { User, Lock, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para imagem dinâmica (Do código original)
  const [bgImage, setBgImage] = useState('');

  useEffect(() => {
    // Imagem Dinâmica com ID aleatório (Lógica original)
    const randomID = Math.floor(Math.random() * 1000);
    setBgImage(`https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop&sig=${randomID}`);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const email = `${username}@salomaoadv.com.br`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // ATUALIZAÇÃO: Registrar último login no perfil do usuário
      if (data.user) {
        await supabase.from('profiles').update({ 
            last_login: new Date().toISOString() 
        }).eq('id', data.user.id);
      }

      // Salva nome para exibição (Simulando comportamento original / Legacy)
      const nomeFormatado = username.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      localStorage.setItem('user_name', nomeFormatado);
      
      navigate('/dashboard');
    } catch (err: any) {
      setError('Credenciais inválidas. Verifique seu usuário e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans w-full bg-white overflow-hidden">
      
      {/* --- LADO ESQUERDO: UI MANAGER (NAVY/GOLD) --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white sm:p-12 lg:p-16 relative z-10">
        
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
          
          {/* LOGO SALOMÃO */}
          <div className="flex justify-center mb-10">
             <img 
               src="/logo-salomao.png" 
               alt="Salomão Advogados" 
               className="h-24 object-contain transition-transform duration-300 hover:scale-105" 
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 const fallback = document.getElementById('logo-fallback');
                 if(fallback) fallback.style.display = 'block';
               }}
             />
             <div id="logo-fallback" className="text-center hidden">
                <h1 className="text-4xl font-serif font-bold text-[#0a192f] tracking-wide">SALOMÃO</h1>
                <p className="text-xs text-gray-400 uppercase tracking-[0.4em] mt-1">Advogados</p>
             </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* USER INPUT */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Usuário Corporativo</label>
              <div className="relative group flex items-center bg-gray-50/50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:border-[#0a192f] focus-within:ring-4 focus-within:ring-[#0a192f]/5 transition-all duration-300">
                <div className="pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-300 group-focus-within:text-[#0a192f] transition-colors duration-300" />
                </div>
                
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 pl-3 pr-2 py-4 bg-transparent text-[#0a192f] text-sm font-bold outline-none placeholder:text-gray-300 placeholder:font-normal"
                  placeholder="nome.sobrenome"
                  required
                />
                
                <div className="pr-4 pl-3 py-4 text-[10px] text-gray-400 font-black uppercase tracking-widest select-none bg-transparent border-l border-gray-100">
                  @salomaoadv.com.br
                </div>
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Chave de Segurança</label>
              <div className="relative group bg-gray-50/50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:border-[#0a192f] focus-within:ring-4 focus-within:ring-[#0a192f]/5 transition-all duration-300">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-300 group-focus-within:text-[#0a192f] transition-colors duration-300" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-transparent text-[#0a192f] text-sm font-bold outline-none placeholder:text-gray-300 rounded-xl"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-[11px] font-black uppercase tracking-tight animate-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] text-white 
                         bg-[#0a192f] hover:bg-slate-800 
                         shadow-xl shadow-[#0a192f]/20 hover:shadow-[#0a192f]/40 hover:-translate-y-0.5
                         transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-6 active:scale-95"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  AUTENTICAR ACESSO
                  <ArrowRight className="ml-3 w-4 h-4 text-amber-500" />
                </>
              )}
            </button>

            <div className="pt-8 text-center border-t border-gray-50">
              <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.4em]">
                © 2026 Salomão Advogados • v2.5.0
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* --- LADO DIREITO: DASHBOARD PREVIEW --- */}
      <div className='hidden lg:flex lg:w-1/2 bg-[#0a192f] relative items-center justify-center overflow-hidden'>
        <div className='absolute inset-0'>
          <img
            src={bgImage}
            alt='Jurídico'
            className='w-full h-full object-cover opacity-20 mix-blend-luminosity scale-110'
          />
          <div className='absolute inset-0 bg-gradient-to-tr from-[#0a192f] via-[#0a192f]/90 to-blue-900/30'></div>
        </div>

        <div className='relative z-10 p-20 max-w-xl'>
          <div className='inline-flex items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 mb-10 backdrop-blur-md shadow-2xl'>
            <ShieldCheck className='text-amber-500 w-8 h-8' />
          </div>

          <h2 className="text-5xl font-black text-white mb-8 leading-tight uppercase tracking-tighter">
            Ecossistema <br />
            <span className="text-amber-500">Controladoria</span>
          </h2>
          <div className='h-1.5 w-24 bg-amber-500 mb-10 rounded-full'></div>
          <p className='text-slate-400 text-[13px] font-bold uppercase tracking-[0.15em] leading-loose mb-8'>
            Gestão estratégica de alta performance. 
            Segurança jurídica e integridade de dados para a excelência do{' '}
            <strong className='text-white font-black'>
              Salomão Advogados
            </strong>.
          </p>
        </div>
      </div>

    </div>
  );
}