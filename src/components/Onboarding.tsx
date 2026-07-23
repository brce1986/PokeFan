import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, UserPlus, LogIn, ChevronRight } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { login, loginAsGuest, register } = useApp();
  const [screen, setScreen] = useState<'welcome' | 'login' | 'register'>('welcome');
  
  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register States
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAvatar] = useState("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z'/></svg>");
  const [regError, setRegError] = useState('');

  // sanitizeInput NÃO se aplica a e-mail nem a nome: ele remove - e ' , o que
  // corrompe endereços como maria-silva@gmail.com e nomes como Jean-Pierre.
  // A proteção correta aqui é validar formato, não mutilar a entrada.
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanEmail = loginEmail.trim();
    if (!cleanEmail || !loginPassword) {
      setLoginError('Por favor, preencha todos os campos.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setLoginError('Digite um e-mail válido.');
      return;
    }
    const result = login(cleanEmail, loginPassword);
    const success = result instanceof Promise ? await result : result;
    if (!success) {
      setLoginError('E-mail ou senha incorretos.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    const cleanUsername = regUsername.trim();
    const cleanEmail = regEmail.trim();
    if (!cleanUsername || !cleanEmail || !regPassword) {
      setRegError('Por favor, preencha todos os campos.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setRegError('Digite um e-mail válido.');
      return;
    }
    const result = register(cleanUsername, cleanEmail, regPassword, regAvatar);
    const success = result instanceof Promise ? await result : result;
    if (!success) {
      setRegError('Não foi possível criar a conta. Verifique os dados e tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-secondary-container flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background decorations - High tech Pokédex grids */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Logo / Brand Header */}
      <div className="w-full flex justify-center mt-6 z-10">
        <div className="flex flex-col items-center gap-1">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-300"></div>
            <img 
              src="/logo_transparent.png" 
              alt="PokéFan Logo" 
              className="w-36 h-36 object-contain relative z-10 transition-transform duration-500 hover:rotate-12 hover:scale-105"
            />
          </div>
          <h1 className="font-sans text-3xl font-extrabold text-on-surface mt-2 tracking-tight flex items-center gap-1.5">
            PokéFan <span className="text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-full">TCG</span>
          </h1>
          <p className="text-xs text-on-surface-variant font-medium">Seu Pokédex de Coleção de Cartas</p>
        </div>
      </div>

      {/* Screen Changer panels */}
      <div className="w-full max-w-md z-10 my-auto py-8">
        {screen === 'welcome' && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-on-surface tracking-tight leading-snug">
                Organize, Avalie e Negocie Suas Cartas Pokémon
              </h2>
              <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
                Escanear cartas com a câmera, acompanhe o preço de mercado em tempo real e crie seu binder digital completo.
              </p>
            </div>

            <div className="glass-panel rounded-3xl p-6 shadow-ambient-lvl2 border border-white/40 space-y-4">
              <button 
                onClick={() => setScreen('login')}
                className="w-full font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md bg-primary text-white hover:bg-primary-container"
              >
                <LogIn size={20} />
                Entrar com Conta
              </button>
              
              <button 
                onClick={() => setScreen('register')}
                className="w-full bg-white hover:bg-surface-container-low border border-primary/20 font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-primary shadow-sm"
              >
                <UserPlus size={20} />
                Criar Nova Conta
              </button>

              <button 
                onClick={loginAsGuest}
                className="w-full text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1 pt-1"
              >
                Acesso Rápido de Teste (Trainer Alex)
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {screen === 'login' && (
          <div className="glass-panel rounded-3xl p-6 shadow-ambient-lvl2 border border-white/40 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-extrabold text-on-surface tracking-tight">Entrar</h2>
              <button 
                onClick={() => setScreen('welcome')}
                className="text-xs font-bold text-primary hover:underline"
              >
                Voltar
              </button>
            </div>

            {loginError && (
              <div className="p-3 text-xs bg-error-container text-on-error-container border border-error/20 rounded-xl">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  E-mail
                </label>
                <input 
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white transition-all text-on-surface font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Senha
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Sua senha secreta"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white transition-all text-on-surface font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md bg-primary text-white hover:bg-primary-container mt-6"
              >
                ENTRAR
              </button>
            </form>
          </div>
        )}

        {screen === 'register' && (
          <div className="glass-panel rounded-3xl p-6 shadow-ambient-lvl2 border border-white/40 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-extrabold text-on-surface tracking-tight">Criar Conta</h2>
              <button 
                onClick={() => setScreen('welcome')}
                className="text-xs font-bold text-primary hover:underline"
              >
                Voltar
              </button>
            </div>

            {regError && (
              <div className="p-3 text-xs bg-error-container text-on-error-container border border-error/20 rounded-xl">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Nome do Treinador
                </label>
                <input 
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="ex: Ash Ketchum"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white transition-all text-on-surface font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  E-mail
                </label>
                <input 
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ex: trainer.ash@pallet.org"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white transition-all text-on-surface font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Senha
                </label>
                <input 
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Escolha uma senha segura"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white transition-all text-on-surface font-medium"
                />
              </div>

              <button 
                type="submit"
                className="w-full font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md bg-primary text-white hover:bg-primary-container mt-6"
              >
                CRIAR MINHA CONTA
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer Terms */}
      <div className="w-full max-w-xs text-center z-10 pt-4">
        <p className="text-[10px] text-on-surface-variant/80 font-medium leading-relaxed">
          Ao continuar, você concorda com nossos <span className="underline cursor-pointer hover:text-primary">Termos de Serviço</span> e <span className="underline cursor-pointer hover:text-primary">Política de Privacidade</span>.
        </p>
      </div>
    </div>
  );
};
