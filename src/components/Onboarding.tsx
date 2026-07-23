import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, UserPlus, LogIn, ChevronRight, MailCheck } from 'lucide-react';

/** Logotipo do Google. Lucide não traz ícones de marca. */
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.1z" />
    <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.500 46 24 46z" />
    <path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.2-2.9.7-4.2v-5.7H4.5C3 17 2 20.4 2 24s1 7 2.5 9.9l7.3-5.7z" />
    <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.5 2 8.1 6.9 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" />
  </svg>
);

export const Onboarding: React.FC = () => {
  const {
    login, loginWithGoogle, loginAsGuest, register,
    requestPasswordReset, updatePassword, awaitingPasswordReset
  } = useApp();
  const [screen, setScreen] = useState<'welcome' | 'login' | 'register' | 'confirm-email' | 'forgot' | 'forgot-sent' | 'new-password'>('welcome');
  const [busy, setBusy] = useState(false);

  // Recuperação de senha
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [newPasswordOk, setNewPasswordOk] = useState(false);

  // Chegou pelo link do e-mail de recuperação: pular direto para a troca de
  // senha, ignorando qualquer tela em que a pessoa estivesse antes.
  useEffect(() => {
    if (awaitingPasswordReset) setScreen('new-password');
  }, [awaitingPasswordReset]);

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register States
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAvatar] = useState("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z'/></svg>");
  const [regError, setRegError] = useState('');

  // Campos de identidade não passam por sanitizeInput: a proteção correta aqui
  // é validar o formato, não mutilar a entrada. Endereços como
  // maria-silva@gmail.com e nomes como Jean-Pierre precisam chegar íntegros.
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

  // Mínimo do Supabase. Subir aqui exige subir também no painel do projeto.
  const MIN_PASSWORD_LENGTH = 6;

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
    setBusy(true);
    const result = await login(cleanEmail, loginPassword);
    setBusy(false);
    if (!result.ok) {
      setLoginError(result.error || 'E-mail ou senha incorretos.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    const cleanUsername = regUsername.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanUsername || !cleanEmail || !regPassword || !regConfirmPassword) {
      setRegError('Por favor, preencha todos os campos.');
      return;
    }
    if (cleanUsername.length < 2) {
      setRegError('O nome do treinador precisa ter pelo menos 2 caracteres.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setRegError('Digite um e-mail válido.');
      return;
    }
    if (regPassword.length < MIN_PASSWORD_LENGTH) {
      setRegError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('As senhas não são iguais.');
      return;
    }

    setBusy(true);
    const result = await register(cleanUsername, cleanEmail, regPassword, regAvatar);
    setBusy(false);

    if (!result.ok) {
      setRegError(result.error || 'Não foi possível criar a conta.');
      return;
    }
    // Conta criada sem sessão: o app NÃO entra. Sem sessão, nada é salvo na
    // nuvem, e fingir um login logado era o bug que este fluxo veio corrigir.
    if (result.needsEmailConfirmation) {
      setScreen('confirm-email');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    const email = forgotEmail.trim();
    if (!isValidEmail(email)) {
      setForgotError('Digite um e-mail válido.');
      return;
    }
    setBusy(true);
    const result = await requestPasswordReset(email);
    setBusy(false);
    if (!result.ok) {
      setForgotError(result.error || 'Não foi possível enviar o e-mail.');
      return;
    }
    // Sucesso mesmo para e-mail sem conta: confirmar a existência permitiria
    // descobrir quem tem cadastro.
    setScreen('forgot-sent');
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPasswordError('');
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setNewPasswordError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setNewPasswordError('As senhas não são iguais.');
      return;
    }
    setBusy(true);
    const result = await updatePassword(newPassword);
    setBusy(false);
    if (!result.ok) {
      setNewPasswordError(result.error || 'Não foi possível alterar a senha.');
      return;
    }
    setNewPasswordOk(true);
  };

  const handleGoogle = async () => {
    setLoginError('');
    setRegError('');
    setBusy(true);
    const result = await loginWithGoogle();
    // Em caso de sucesso o navegador sai da página; só chegamos aqui se falhou.
    setBusy(false);
    if (!result.ok) {
      const msg = result.error || 'Não foi possível entrar com o Google.';
      setLoginError(msg);
      setRegError(msg);
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
              {loginError && (
                <div className="p-3 text-xs bg-error-container text-on-error-container border border-error/20 rounded-xl">
                  {loginError}
                </div>
              )}

              <button
                onClick={handleGoogle}
                disabled={busy}
                className="w-full bg-white hover:bg-surface-container-low border border-outline-variant/40 font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 text-on-surface shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <GoogleIcon size={20} />
                Continuar com Google
              </button>

              <div className="flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-outline-variant/40"></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">ou</span>
                <span className="h-px flex-1 bg-outline-variant/40"></span>
              </div>

              <button
                onClick={() => setScreen('login')}
                className="w-full font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md bg-primary text-white hover:bg-primary-container"
              >
                <LogIn size={20} />
                Entrar com E-mail
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
                type="button"
                onClick={() => { setForgotEmail(loginEmail.trim()); setForgotError(''); setScreen('forgot'); }}
                className="block w-full text-right text-[11px] font-bold text-primary hover:underline -mt-1"
              >
                Esqueci minha senha
              </button>

              <button
                type="submit"
                disabled={busy}
                className="w-full font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md bg-primary text-white hover:bg-primary-container mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? 'ENTRANDO...' : 'ENTRAR'}
              </button>

              <div className="flex items-center gap-3 pt-1" aria-hidden="true">
                <span className="h-px flex-1 bg-outline-variant/40"></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">ou</span>
                <span className="h-px flex-1 bg-outline-variant/40"></span>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="w-full bg-white hover:bg-surface-container-low border border-outline-variant/40 font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 text-on-surface shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <GoogleIcon size={18} />
                Continuar com Google
              </button>
            </form>
          </div>
        )}

        {screen === 'forgot' && (
          <div className="glass-panel rounded-3xl p-6 shadow-ambient-lvl2 border border-white/40 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-extrabold text-on-surface tracking-tight">Recuperar acesso</h2>
              <button onClick={() => setScreen('login')} className="text-xs font-bold text-primary hover:underline">
                Voltar
              </button>
            </div>

            {forgotError && (
              <div className="p-3 text-xs bg-error-container text-on-error-container border border-error/20 rounded-xl">
                {forgotError}
              </div>
            )}

            <p className="text-sm text-on-surface-variant leading-relaxed">
              Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.
            </p>

            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="voce@email.com"
                  autoComplete="email"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white transition-all text-on-surface font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-md bg-primary text-white hover:bg-primary-container disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? 'ENVIANDO...' : 'ENVIAR LINK'}
              </button>
            </form>
          </div>
        )}

        {screen === 'forgot-sent' && (
          <div className="glass-panel rounded-3xl p-6 shadow-ambient-lvl2 border border-white/40 space-y-4 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MailCheck size={30} className="text-primary" />
            </div>

            <h2 className="text-xl font-extrabold text-on-surface tracking-tight">Verifique seu e-mail</h2>

            <p className="text-sm text-on-surface-variant leading-relaxed">
              Se existir uma conta para{' '}
              <span className="font-bold text-on-surface break-all">{forgotEmail.trim()}</span>,
              o link de redefinição chegará em instantes.
            </p>

            <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-xl p-3 border border-outline-variant/30">
              Não recebeu? Confira a caixa de spam. O envio tem limite por hora — se
              tentar várias vezes seguidas, aguarde alguns minutos.
            </p>

            <button
              onClick={() => setScreen('login')}
              className="w-full font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-md bg-primary text-white hover:bg-primary-container"
            >
              VOLTAR PARA ENTRAR
            </button>
          </div>
        )}

        {screen === 'new-password' && (
          <div className="glass-panel rounded-3xl p-6 shadow-ambient-lvl2 border border-white/40 space-y-4 animate-fade-in">
            {newPasswordOk ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <MailCheck size={30} className="text-primary" />
                </div>
                <h2 className="text-xl font-extrabold text-on-surface tracking-tight">Senha alterada</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Pronto. Sua nova senha já está valendo e você pode entrar normalmente.
                </p>
                <button
                  onClick={() => { setScreen('login'); setNewPassword(''); setNewPasswordConfirm(''); }}
                  className="w-full font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-md bg-primary text-white hover:bg-primary-container"
                >
                  CONTINUAR
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-extrabold text-on-surface tracking-tight">Criar nova senha</h2>

                {newPasswordError && (
                  <div className="p-3 text-xs bg-error-container text-on-error-container border border-error/20 rounded-xl">
                    {newPasswordError}
                  </div>
                )}

                <form onSubmit={handleNewPassword} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Nova senha
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres`}
                        autoComplete="new-password"
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white transition-all text-on-surface font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        aria-label={showRegPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                      >
                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Confirmar nova senha
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      placeholder="Repita a senha"
                      autoComplete="new-password"
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white transition-all text-on-surface font-medium"
                    />
                    {newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm && (
                      <p className="mt-1.5 text-[11px] font-semibold text-error">As senhas não são iguais.</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-md bg-primary text-white hover:bg-primary-container disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {busy ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {screen === 'confirm-email' && (
          <div className="glass-panel rounded-3xl p-6 shadow-ambient-lvl2 border border-white/40 space-y-4 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MailCheck size={30} className="text-primary" />
            </div>

            <h2 className="text-xl font-extrabold text-on-surface tracking-tight">
              Confirme seu e-mail
            </h2>

            <p className="text-sm text-on-surface-variant leading-relaxed">
              Enviamos um link de confirmação para{' '}
              <span className="font-bold text-on-surface break-all">{regEmail.trim()}</span>.
              Abra o link para ativar sua conta e depois entre aqui.
            </p>

            <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-xl p-3 border border-outline-variant/30">
              Sua coleção só é salva na nuvem depois da confirmação. Sem isso, os dados
              ficam apenas neste dispositivo.
            </p>

            <button
              onClick={() => {
                setScreen('login');
                setLoginEmail(regEmail.trim());
                setRegPassword('');
                setRegConfirmPassword('');
              }}
              className="w-full font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-md bg-primary text-white hover:bg-primary-container"
            >
              JÁ CONFIRMEI, QUERO ENTRAR
            </button>

            <button
              onClick={() => setScreen('welcome')}
              className="w-full text-xs font-bold text-primary hover:underline pt-1"
            >
              Voltar ao início
            </button>
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
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres`}
                    autoComplete="new-password"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white transition-all text-on-surface font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    aria-label={showRegPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Confirmar Senha
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white transition-all text-on-surface font-medium"
                />
                {regConfirmPassword.length > 0 && regPassword !== regConfirmPassword && (
                  <p className="mt-1.5 text-[11px] font-semibold text-error">As senhas não são iguais.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md bg-primary text-white hover:bg-primary-container mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? 'CRIANDO...' : 'CRIAR MINHA CONTA'}
              </button>

              <div className="flex items-center gap-3 pt-1" aria-hidden="true">
                <span className="h-px flex-1 bg-outline-variant/40"></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">ou</span>
                <span className="h-px flex-1 bg-outline-variant/40"></span>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="w-full bg-white hover:bg-surface-container-low border border-outline-variant/40 font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 text-on-surface shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <GoogleIcon size={18} />
                Continuar com Google
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer Terms */}
      <div className="w-full max-w-xs text-center z-10 pt-4">
        <p className="text-[10px] text-on-surface-variant/80 font-medium leading-relaxed">
          Ao continuar, você concorda com nossos{' '}
          <a href="/termos.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Termos de Uso</a>
          {' '}e{' '}
          <a href="/privacidade.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  );
};
