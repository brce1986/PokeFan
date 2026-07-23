import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Collection } from './components/Collection';
import { Scan } from './components/Scan';
import { SearchDetails } from './components/SearchDetails';
import { TradeBinder } from './components/TradeBinder';
import { ProfileSettings } from './components/ProfileSettings';
import { 
  Home, 
  Grid2X2, 
  Scan as ScanIcon, 
  Search, 
  User 
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, awaitingPasswordReset, activeTab, setActiveTab } = useApp();

  // O link de recuperação cria uma sessão válida, então currentUser existe.
  // Sem checar awaitingPasswordReset o app entraria direto no painel e a tela
  // de trocar a senha nunca apareceria.
  if (!currentUser || awaitingPasswordReset) {
    return <Onboarding />;
  }

  // Renderizar a tela ativa com base na aba selecionada
  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'collection':
        return <Collection />;
      case 'scan':
        return <Scan />;
      case 'search':
        return <SearchDetails />;
      case 'trade':
        return <TradeBinder />;
      case 'profile':
        return <ProfileSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row pb-20 md:pb-0 font-sans">
      
      {/* 1. SIDEBAR DE NAVEGAÇÃO - MODO DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-container-lowest h-screen fixed top-0 left-0 border-r border-outline-variant/15 shadow-ambient-lvl1 z-40 p-6 justify-between select-none">
        <div className="space-y-8">
          {/* Logo e Branding */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-primary font-black tracking-tight text-xl cursor-pointer hover:opacity-90 active:scale-95 transition-all"
          >
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
              <img src="/logo_transparent.png" alt="Pokeball" className="w-6 h-6 object-contain" />
            </div>
            <span>PokéFan</span>
          </div>

          {/* Links de Navegação */}
          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'dashboard', label: 'Painel Inicial', icon: Home },
              { id: 'collection', label: 'Minha Coleção', icon: Grid2X2 },
              { id: 'scan', label: 'Escanear Carta', icon: ScanIcon },
              { id: 'search', label: 'Cartas', icon: Search },
              { id: 'profile', label: 'Treinador / Ajustes', icon: User },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-ambient-lvl2'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Informações do usuário logado na base */}
        <div 
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/10 cursor-pointer hover:bg-surface-container-high transition-colors"
        >
          <img 
            src={currentUser.avatar} 
            alt="Trainer Avatar" 
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <div className="min-w-0">
            <div className="font-extrabold text-xs text-on-surface truncate">{currentUser.username}</div>
            <div className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5 truncate">{currentUser.collectorRank}</div>
          </div>
        </div>
      </aside>

      {/* 2. TOP APP BAR - MOBILE (Fixado no topo) */}
      <header className="md:hidden flex justify-between items-center px-4 h-16 w-full bg-white border-b border-outline-variant/10 shadow-sm sticky top-0 z-40 select-none">
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 text-primary font-black text-lg cursor-pointer"
        >
          <img src="/logo_transparent.png" alt="Pokeball Logo" className="w-7 h-7 object-contain" />
          <span>PokéFan</span>
        </div>
        
        {/* Avatar rápido de redirecionamento */}
        <div 
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-2 cursor-pointer hover:opacity-85 active:scale-95 transition-all"
        >
          <img 
            src={currentUser.avatar} 
            alt="Trainer Avatar" 
            className="w-8 h-8 rounded-full object-cover border border-outline-variant/20 shadow-sm"
          />
        </div>
      </header>

      {/* 3. CONTAINER DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {renderActiveScreen()}
      </main>

      {/* 4. BARRA DE NAVEGAÇÃO FLUTUANTE - MÓVEL (Fixado na base) */}
      <nav className="md:hidden bg-white/95 backdrop-blur-xl border-t border-outline-variant/15 fixed bottom-0 left-0 w-full z-40 flex justify-around items-center py-2 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)] rounded-t-3xl select-none">
        {[
          { id: 'dashboard', label: 'Painel', icon: Home },
          { id: 'collection', label: 'Coleção', icon: Grid2X2 },
          { id: 'scan', label: 'Escanear', icon: ScanIcon, isFAB: true },
          { id: 'search', label: 'Cartas', icon: Search },
          { id: 'profile', label: 'Perfil', icon: User },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isFAB) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex flex-col items-center justify-center relative -top-4 active:scale-90 transition-transform"
              >
                <div className="bg-primary text-white p-3.5 rounded-full shadow-ambient-lvl2 border-4 border-background hover:bg-primary-container transition-all">
                  <Icon size={22} />
                </div>
                <span className="font-bold text-[9px] text-on-surface-variant tracking-wide mt-1">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-2xl active:scale-90 transition-all ${
                isActive 
                  ? 'text-primary' 
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <Icon size={18} className={isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'} />
              <span className={`font-bold text-[9px] mt-1 tracking-wide ${isActive ? 'text-primary font-black' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
export { AppContent };
