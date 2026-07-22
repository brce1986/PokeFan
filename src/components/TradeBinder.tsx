import React, { useState } from 'react';
import { useApp, type CollectionItem } from '../context/AppContext';
import { Share2, Copy, Send, Check, X, RefreshCw, QrCode } from 'lucide-react';

export const TradeBinder: React.FC = () => {
  const { collection, formatPrice, setActiveTab } = useApp();
  const [selectedTradeItem, setSelectedTradeItem] = useState<CollectionItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtrar cartas duplicadas (Qtd > 1) que podem ser trocadas
  const duplicates = collection.filter(item => item.quantity > 1);

  const handleShareSocial = (platform: string) => {
    if (!selectedTradeItem) return;
    
    const cardName = selectedTradeItem.cardDetails.name;
    const condition = selectedTradeItem.condition;
    const value = formatPrice(
      selectedTradeItem.cardDetails.tcgplayer?.prices?.holofoil?.market || 
      selectedTradeItem.cardDetails.tcgplayer?.prices?.normal?.market || 
      10
    );

    const shareMessage = `⚡ DISPONÍVEL PARA TROCA no PokéFan! ⚡\n👉 ${cardName} (${selectedTradeItem.variant === 'holo' ? 'Holográfica' : 'Normal'})\n🔹 Condição: ${condition}\n🔹 Valor: ${value}\nInteressados me chamem no privado!`;
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(shareMessage);
      setToastMessage('Link de troca copiado!');
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      // Simular abertura de aba
      setToastMessage(`Compartilhado no ${platform} com sucesso!`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-6 animate-fade-in select-none">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500/20 font-bold text-xs animate-fade-in">
          <Check size={16} className="bg-white/20 rounded-full p-0.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col">
        <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">Pasta de Trocas</h2>
        <p className="text-xs text-on-surface-variant font-medium mt-0.5">Cartas repetidas disponíveis para negociação</p>
      </div>

      {duplicates.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient-lvl1 border border-outline-variant/10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center mx-auto border border-secondary-container/20">
            <RefreshCw size={28} className="text-secondary-container" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-on-surface">Nenhuma Duplicata Encontrada</h3>
            <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
              Sua pasta de trocas mostra automaticamente as cartas com quantidade maior que 1.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('scan')}
            className="bg-primary hover:bg-primary-container text-white rounded-2xl py-3 px-6 font-bold text-xs shadow-md active:scale-95 transition-all inline-flex items-center gap-2"
          >
            Escanear Novas Cartas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {duplicates.map(item => {
            const price = item.cardDetails.tcgplayer?.prices?.holofoil?.market || item.cardDetails.tcgplayer?.prices?.normal?.market || 10;
            // Número de duplicatas disponíveis para troca (Qtd total - 1 que fica na coleção principal)
            const tradeQty = item.quantity - 1;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedTradeItem(item)}
                className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-2.5 shadow-ambient-lvl1 hover:shadow-md hover:border-primary/25 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] relative"
              >
                {/* Badge de Disponibilidade para Troca */}
                <div className="absolute top-2 right-2 bg-secondary text-on-secondary font-sans text-[10px] font-black px-2 py-0.5 rounded-full border border-white/10 shadow-sm z-10">
                  Trocar x{tradeQty}
                </div>

                <div className="relative w-full aspect-[63/88] rounded-xl bg-surface-container overflow-hidden mb-2 shadow-sm">
                  <img 
                    src={item.cardDetails.images.small} 
                    alt={item.cardDetails.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[8px] px-1.5 py-0.5 rounded font-extrabold">
                    {item.condition}
                  </div>
                </div>

                <div className="px-1">
                  <h4 className="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors leading-tight">
                    {item.cardDetails.name}
                  </h4>
                  <div className="flex justify-between items-center mt-2 pt-1 border-t border-outline-variant/5">
                    <span className="font-extrabold text-[11px] text-on-surface">
                      {formatPrice(price)}
                    </span>
                    <span className="text-[8px] font-black text-on-surface-variant uppercase">
                      Repetidas: {item.quantity}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. STUNNING SHAREABLE "TRADE CARD" MODAL */}
      {selectedTradeItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-white/20 relative flex flex-col">
            
            {/* Botão de Fechar */}
            <button 
              onClick={() => setSelectedTradeItem(null)}
              className="absolute top-3 right-3 z-30 bg-black/60 hover:bg-black/80 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>

            {/* Cabeçalho do Cartão de Troca - Visual Estilo Yellow Edition do PokéFan */}
            <div className="bg-secondary-container p-4 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
              
              <div className="bg-primary text-white text-[10px] font-black tracking-widest px-4 py-1 rounded-full shadow-md uppercase mb-2 animate-bounce">
                DISPONÍVEL PARA TROCA
              </div>
              <h3 className="font-black text-lg text-on-surface leading-tight">PokéFan Trade Card</h3>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Negocie em segurança</p>
            </div>

            {/* Arte da Carta e Especificações do Card de Troca */}
            <div className="p-5 flex flex-col items-center space-y-4">
              
              {/* Moldura Holográfica do Card de Troca */}
              <div className="relative w-44 aspect-[63/88] rounded-xl overflow-hidden shadow-[0_15px_30px_rgba(60,77,203,0.25)] border-4 border-surface-container-lowest animate-float bg-neutral-900">
                <img 
                  src={selectedTradeItem.cardDetails.images.large} 
                  alt={selectedTradeItem.cardDetails.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Informações de Negociação */}
              <div className="w-full text-center space-y-1">
                <h4 className="text-base font-extrabold text-on-surface">{selectedTradeItem.cardDetails.name}</h4>
                <p className="text-xs font-bold text-on-surface-variant">{selectedTradeItem.cardDetails.supertype} • #{selectedTradeItem.cardDetails.number}</p>
                
                <div className="flex justify-center gap-2 pt-2">
                  <span className="bg-primary text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm">
                    Condição: {selectedTradeItem.condition}
                  </span>
                  <span className="bg-secondary-container text-on-secondary-container text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm border border-secondary-fixed-dim/20">
                    Estoque: {selectedTradeItem.quantity - 1} p/ Troca
                  </span>
                </div>
              </div>

              {/* Tabela de Preço e Autenticidade QR */}
              <div className="w-full bg-surface-container-low border border-outline-variant/10 p-3 rounded-2xl flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Valor de Referência</span>
                  <span className="text-base font-black text-emerald-600">
                    {formatPrice(
                      selectedTradeItem.cardDetails.tcgplayer?.prices?.holofoil?.market || 
                      selectedTradeItem.cardDetails.tcgplayer?.prices?.normal?.market || 
                      10
                    )}
                  </span>
                </div>
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-outline-variant/20 p-1 flex-shrink-0">
                  <QrCode className="text-on-surface-variant w-full h-full" />
                </div>
              </div>
            </div>

            {/* Painel de Compartilhamento Social */}
            <div className="bg-surface-container-low p-4 border-t border-outline-variant/15 flex flex-col gap-3">
              <span className="text-[9px] font-extrabold text-on-surface-variant uppercase text-center tracking-wider">
                Enviar para Redes Sociais
              </span>
              
              <div className="flex justify-around gap-2">
                <button
                  onClick={() => handleShareSocial('WhatsApp')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-3 shadow-md transition-all hover:scale-105 active:scale-95"
                  title="WhatsApp"
                >
                  <Send size={18} />
                </button>
                <button
                  onClick={() => handleShareSocial('X / Twitter')}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-full p-3 shadow-md transition-all hover:scale-105 active:scale-95"
                  title="Twitter / X"
                >
                  <Share2 size={18} />
                </button>
                <button
                  onClick={() => handleShareSocial('copy')}
                  className="bg-primary hover:bg-primary-container text-white rounded-full p-3 shadow-md transition-all hover:scale-105 active:scale-95"
                  title="Copiar Link de Negociação"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
