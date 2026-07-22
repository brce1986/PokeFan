import React, { useState } from 'react';
import { useApp, DEFAULT_AVATARS } from '../context/AppContext';
import { User, CreditCard, Bell, LogOut, Check, Save, Download, Trash2 } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const {
    currentUser,
    collection,
    currency,
    notifications,
    updateProfile,
    setCurrency,
    setNotifications,
    logout,
    exportCollection,
    resetCollection
  } = useApp();

  const [username, setUsername] = useState(currentUser?.username || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || DEFAULT_AVATARS[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const handleSaveProfile = () => {
    updateProfile(username, avatar);
    setIsEditingProfile(false);
    showToast('Perfil atualizado com sucesso!');
  };

  const handleExport = () => {
    const dataStr = exportCollection();
    navigator.clipboard.writeText(dataStr);
    showToast('Dados de backup copiados para a área de transferência!');
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja apagar TODAS as cartas da sua coleção? Essa ação não pode ser desfeita.')) {
      resetCollection();
      showToast('Coleção apagada com sucesso.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const uniqueSetsCount = new Set(collection.map(item => item.cardDetails.id.split('-')[0])).size;

  return (
    <div className="space-y-6 pb-6 animate-fade-in select-none">
      
      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500/20 font-bold text-xs animate-fade-in text-center max-w-sm">
          <Check size={16} className="bg-white/20 rounded-full p-0.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. SEÇÃO DE PERFIL E STATUS DO TREINADOR */}
      <section className="flex flex-col items-center bg-surface-container-lowest rounded-3xl p-6 shadow-ambient-lvl1 border border-outline-variant/10">
        <div className="relative w-24 h-24 mb-4">
          <img 
            alt="Trainer Avatar" 
            src={avatar} 
            className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
          />
          {isEditingProfile && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex flex-wrap gap-1 p-1 justify-center items-center overflow-hidden">
              {DEFAULT_AVATARS.map((av, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className="w-8 h-8 rounded-full border border-white overflow-hidden active:scale-90 transition-transform"
                >
                  <img src={av} alt="option" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {isEditingProfile ? (
          <div className="w-full max-w-xs flex gap-2 mb-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-grow bg-surface border border-outline-variant/20 rounded-xl px-3 py-1.5 text-xs text-on-surface font-semibold focus:outline-none"
            />
            <button
              onClick={handleSaveProfile}
              className="bg-primary hover:bg-primary-container text-white p-2 rounded-xl transition-all shadow-sm"
            >
              <Save size={16} />
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-extrabold text-on-surface tracking-tight flex items-center gap-1.5">
              {currentUser?.username || 'Trainer Alex'}
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="text-[10px] text-primary hover:underline font-bold"
              >
                (Editar)
              </button>
            </h2>
            <p className="text-[10px] text-on-surface-variant bg-surface-container px-3.5 py-1 rounded-full font-bold uppercase mt-1 tracking-wider">
              {currentUser?.collectorRank || 'Colecionador de Elite'}
            </p>
          </>
        )}

        <div className="flex gap-4 w-full mt-6 justify-center text-center">
          <div className="flex flex-col items-center p-3 bg-surface-container-low rounded-2xl flex-1 border border-outline-variant/5 shadow-sm">
            <span className="text-lg font-extrabold text-primary">
              {collection.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">CARTAS</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-surface-container-low rounded-2xl flex-1 border border-outline-variant/5 shadow-sm">
            <span className="text-lg font-extrabold text-tertiary">{uniqueSetsCount}</span>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">CONJUNTOS</span>
          </div>
        </div>
      </section>

      {/* 2. DETALHES DA CONTA */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 shadow-ambient-lvl1 border border-outline-variant/10 space-y-4">
        <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2">
          <User size={18} className="text-primary" />
          Detalhes da Conta
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">E-mail (Cadastro)</label>
            <input 
              type="text" 
              value={currentUser?.email || 'alex.trainer@pokevault.app'} 
              disabled 
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold text-on-surface-variant/80"
            />
          </div>
        </div>
      </section>

      {/* 3. MOEDA E CONVERSÃO */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 shadow-ambient-lvl1 border border-outline-variant/10 space-y-4">
        <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2">
          <CreditCard size={18} className="text-amber-500" />
          Moeda de Exibição
        </h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Selecione a moeda padrão para que todos os valores de mercado e lucros da coleção sejam convertidos automaticamente.
        </p>

        <div className="grid grid-cols-4 gap-2">
          {([
            { code: 'BRL', symbol: 'R$' },
            { code: 'USD', symbol: '$' },
            { code: 'EUR', symbol: '€' },
            { code: 'JPY', symbol: '¥' }
          ] as const).map(curr => (
            <button
              key={curr.code}
              onClick={() => setCurrency(curr.code)}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                currency === curr.code
                  ? 'bg-secondary-container text-on-secondary-container border-secondary shadow-md scale-105'
                  : 'bg-surface hover:bg-surface-container-low text-on-surface-variant border-outline-variant/20'
              }`}
            >
              <span className="text-base font-black">{curr.symbol}</span>
              <span className="text-[9px] font-extrabold uppercase mt-0.5">{curr.code}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 4. NOTIFICAÇÕES */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 shadow-ambient-lvl1 border border-outline-variant/10 space-y-4">
        <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2">
          <Bell size={18} className="text-tertiary" />
          Configurações de Notificações
        </h3>

        <div className="space-y-2">
          {[
            { 
              key: 'priceAlerts', 
              title: 'Alertas de Preço', 
              desc: 'Notificar quando alguma carta da minha coleção sofrer variações bruscas de preço.' 
            },
            { 
              key: 'newSets', 
              title: 'Novos Conjuntos TCG', 
              desc: 'Ser notificado quando novas coleções de TCG forem catalogadas pela Nintendo.' 
            }
          ].map(opt => (
            <div key={opt.key} className="flex items-center justify-between p-3 bg-surface rounded-2xl border border-outline-variant/10 gap-4">
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-on-surface">{opt.title}</h4>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-snug">{opt.desc}</p>
              </div>
              <label className="relative inline-flex inline-flex items-center cursor-pointer flex-shrink-0">
                <input 
                  type="checkbox"
                  checked={(notifications as any)[opt.key]}
                  onChange={() => {
                    setNotifications({
                      ...notifications,
                      [opt.key]: !(notifications as any)[opt.key]
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* 5. EXPORTAÇÃO DE BACKUPS */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 shadow-ambient-lvl1 border border-outline-variant/10 space-y-4">
        <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2">
          <Download size={18} className="text-tertiary" />
          Backup JSON
        </h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Copie os dados da sua coleção em formato JSON para salvar como um backup externo.
        </p>
        
        <button
          onClick={handleExport}
          className="w-full bg-primary hover:bg-primary-container text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Download size={14} />
          Copiar Backup JSON
        </button>
      </section>

      {/* 7. BOTÕES DE RESET E LOGOUT */}
      <section className="pt-4 flex flex-col gap-3 max-w-xs mx-auto text-center">
        <button
          onClick={logout}
          className="bg-transparent hover:bg-primary/5 text-primary border border-primary/20 font-bold py-3.5 px-6 rounded-2xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <LogOut size={16} />
          Desconectar Treinador
        </button>

        <button
          onClick={handleReset}
          className="bg-transparent hover:bg-red-50 text-red-600 border border-red-200 font-bold py-3 px-6 rounded-2xl text-[10px] active:scale-95 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
        >
          <Trash2 size={12} />
          Limpar Minha Coleção
        </button>
      </section>

    </div>
  );
};
