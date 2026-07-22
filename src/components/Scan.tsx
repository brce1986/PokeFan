import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { pokemonApi, type TCGCard } from '../services/pokemonApi';
import { Scan as ScanIcon, Upload, X, Plus, Minus, Check, Camera } from 'lucide-react';
import { sanitizeFileName } from '../utils/security';

// Mapeamento dos arquivos locais para IDs de cartas reais da API
const LOCAL_FILE_MAPPINGS: Record<string, { id: string; name: string }> = {
  'SV05_EN_1.png': { id: 'sv5-1', name: 'Turtwig' },
  'SV05_EN_10.png': { id: 'sv5-10', name: 'Sawsbuck' },
  'SV05_EN_12.png': { id: 'sv5-12', name: 'Deerling' },
  'JL2G_EN_19.png': { id: 'swsh9-182', name: 'Galarian Zapdos V' },
  'JL2G_EN_26.png': { id: 'sv3pt5-6', name: 'Charizard ex' },
  'JL2G_EN_34.png': { id: 'swsh9-122', name: 'Arceus V' },
  'JL2G_EN_38.png': { id: 'sv3pt5-9', name: 'Blastoise ex' },
  'JL2G_EN_57.png': { id: 'sv5-81', name: 'Iron Crown ex' },
  'JL2G_EN_60.png': { id: 'sv5-60', name: 'Gengar ex' },
  'JL2G_EN_86.png': { id: 'sv5-120', name: 'Cinccino' },
  'JL2G_EN_91.png': { id: 'sv5-133', name: 'Koraidon ex' },
};

export const Scan: React.FC = () => {
  const { addCardToCollection, currentUser } = useApp();

  const [scanMode, setScanMode] = useState<'single' | 'page'>('single');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [detectedCard, setDetectedCard] = useState<TCGCard | null>(null);

  // Form states
  const [condition, setCondition] = useState<'NM' | 'LP' | 'MP' | 'HP' | 'DMG'>('NM');
  const [variant, setVariant] = useState<'normal' | 'holo' | 'reverse'>('normal');
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulação de Camera Feed

  // Manipular upload ou escolha de arquivo para simular escaneamento
  const handleFileScan = async (fileName: string) => {
    const cleanFileName = sanitizeFileName(fileName);
    setIsProcessing(true);
    
    // Simular o flash da câmera
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    try {
      // Obter id mapeado ou escolher aleatório de mock
      const mapped = LOCAL_FILE_MAPPINGS[cleanFileName];
      const cardId = mapped ? mapped.id : 'sv03pt5-006'; // Charizard ex se não achar

      // Chamar API para obter dados reais da carta
      const cardDetails = await pokemonApi.getCardById(cardId);
      
      // Simular delay de processamento de imagem da rede neural
      setTimeout(() => {
        setDetectedCard(cardDetails);
        setCondition('NM');
        setVariant(cardDetails.rarity?.toLowerCase().includes('rare') || cardDetails.subtypes?.includes('V') ? 'holo' : 'normal');
        setQuantity(1);
        setIsProcessing(false);
        setShowSheet(true);
      }, 1500);

    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handleRandomScan = () => {
    const keys = Object.keys(LOCAL_FILE_MAPPINGS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    handleFileScan(randomKey);
  };

  const handleSaveCard = () => {
    if (!detectedCard) return;
    addCardToCollection(detectedCard, quantity, condition, variant);
    setShowSheet(false);
    
    // Mostrar Toast de Sucesso
    setToastMessage(`${detectedCard.name} salva com sucesso!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-4 pb-6 animate-fade-in flex flex-col items-center select-none w-full max-w-sm mx-auto relative">
      
      {/* HEADER BAR (PokéFan + Profile Avatar) */}
      <div className="w-full flex items-center justify-between px-1 pb-3 border-b border-outline-variant/10">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white animate-spin-slow">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 2c0-4.08 3.05-7.44 7-7.93v3.93c-1.72.45-3 2-3 3.85s1.28 3.4 3 3.85v3.93c-3.95-.49-7-3.85-7-7.93zm10 7.93v-3.93c1.72-.45 3-2 3-3.85s-1.28-3.4-3-3.85V4.07c3.95.49 7 3.85 7 7.93s-3.05 7.44-7 7.93z" />
            </svg>
          </div>
          <span className="text-base font-black tracking-tight text-primary">PokéFan</span>
        </div>
        
        <div className="w-8 h-8 rounded-full border border-outline-variant/20 overflow-hidden bg-neutral-100 shadow-sm">
          <img 
            src={currentUser?.avatar || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z'/></svg>"} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* SUCCESS TOAST MESSAGE */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500/20 font-bold text-xs animate-fade-in text-center max-w-xs">
          <Check size={16} className="bg-white/20 rounded-full p-0.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TÍTULO E FEEDBACK */}
      <div className="text-center pt-1">
        <h2 className="text-xl font-extrabold text-on-surface tracking-tight">Escanear Carta</h2>
        <p className="text-xs text-on-surface-variant font-medium mt-0.5">Mire na carta ou selecione um arquivo local</p>
      </div>

      {/* Seletor de Modo */}
      <div className="bg-surface-container-low p-0.5 rounded-full shadow-inner flex items-center border border-outline-variant/10">
        <button 
          onClick={() => setScanMode('single')}
          className={`px-5 py-1.5 rounded-full text-[10px] font-black transition-all uppercase ${
            scanMode === 'single' ? 'bg-primary text-white shadow-md scale-105' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          Carta Única
        </button>
        <button 
          onClick={() => setScanMode('page')}
          className={`px-5 py-1.5 rounded-full text-[10px] font-black transition-all uppercase ${
            scanMode === 'page' ? 'bg-primary text-white shadow-md scale-105' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          Página de Pasta
        </button>
      </div>

      {/* 1. GRANDE VISOR DE CAMERA FEED ESTILO POKÉDEX */}
      <div className="relative w-full max-w-[340px] aspect-[63/88] bg-black rounded-[36px] overflow-hidden shadow-2xl border-[5px] border-white flex flex-col justify-center items-center">
        
        {/* FAUX CAMERA BACKGROUND */}
        <div className="absolute inset-0 z-0 bg-neutral-900 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full relative opacity-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/95 z-10" />
            <img 
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60" 
              alt="Camera Background" 
              className="w-full h-full object-cover blur-sm"
            />
          </div>
        </div>

        {/* DYNAMIC SCANNING RETICLE OVERLAY */}
        {!showSheet && !isProcessing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
            {/* Linha Vermelha Laser de Varredura */}
            <div className="absolute left-0 w-full h-0.5 bg-red-600 shadow-[0_0_12px_4px_rgba(234,0,15,0.8)] animate-scan z-20"></div>
            
            {/* Cantoneiras de Mira Vermelhas (Brackets) */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-[5px] border-l-[5px] border-red-600 rounded-tl-xl bracket-pulse"></div>
            <div className="absolute top-6 right-6 w-8 h-8 border-t-[5px] border-r-[5px] border-red-600 rounded-tr-xl bracket-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute bottom-28 left-6 w-8 h-8 border-b-[5px] border-l-[5px] border-red-600 rounded-bl-xl bracket-pulse" style={{ animationDelay: '0.6s' }}></div>
            <div className="absolute bottom-28 right-6 w-8 h-8 border-b-[5px] border-r-[5px] border-red-600 rounded-br-xl bracket-pulse" style={{ animationDelay: '0.4s' }}></div>
            
            {/* Retícula de Mira Central */}
            <div className="absolute w-12 h-12 border-2 border-dashed border-red-600/40 rounded-2xl flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-red-600/60 rounded-full"></div>
            </div>
          </div>
        )}

        {/* CONTROLLER ACTIONS OVERLAY INSIDE THE VIEWPORT */}
        {!showSheet && !isProcessing && (
          <div className="absolute bottom-6 inset-x-0 z-20 flex flex-col items-center gap-3">
            
            {/* Botões de Ação de Captura */}
            <div className="flex items-center justify-center gap-8 w-full relative px-6">
              
              {/* Botão de Disparo Principal (Câmera) */}
              <button 
                onClick={handleRandomScan}
                className="w-16 h-16 rounded-full border-[4px] border-white bg-red-600 shadow-xl flex items-center justify-center active:scale-90 transition-all hover:bg-red-700 text-white"
              >
                <Camera size={24} />
              </button>

              {/* Seletor de Cartas Locais (Upload de Arquivo) */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleFileScan(e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10 rounded-full z-30"
                    defaultValue=""
                  >
                    <option value="" disabled>Escolha</option>
                    {Object.keys(LOCAL_FILE_MAPPINGS).map((fileName) => (
                      <option key={fileName} value={fileName}>
                        {fileName.replace('_EN_', ' #')}
                      </option>
                    ))}
                  </select>
                  <button 
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-neutral-600 shadow-md active:scale-95 transition-all"
                  >
                    <Upload size={18} />
                  </button>
                </div>
              </div>

            </div>

            {/* Texto de Instrução */}
            <div className="bg-black/60 px-4 py-1.5 rounded-full border border-white/5 shadow-inner">
              <span className="text-[8px] font-black text-white/90 uppercase tracking-wider">
                Capture uma imagem ou carregue um arquivo da pasta local
              </span>
            </div>
          </div>
        )}

        {/* SIMULATING RECOGNITION LOADER */}
        {isProcessing && (
          <div className="absolute inset-0 z-20 bg-black/85 flex flex-col items-center justify-center text-center p-4">
            <div className="relative w-12 h-12 mb-3 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-3 border-primary/20 border-t-primary animate-spin"></div>
              <ScanIcon className="text-primary w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-white font-bold text-xs">Analisando...</h3>
          </div>
        )}

        {/* FLASH EFFECT */}
        {showFlash && (
          <div className="absolute inset-0 bg-white z-30 opacity-100 transition-opacity duration-150 pointer-events-none"></div>
        )}
      </div>

      {/* 3. SLIDABLE CONFIRMATION BOTTOM SHEET (FIXED OVERLAY DRAWER - IMMUNE TO HEIGHT GLITCHES) */}
      {showSheet && detectedCard && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center animate-fade-in p-4">
          {/* Click-outside backdrop */}
          <div className="absolute inset-0" onClick={() => setShowSheet(false)} />
          
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] flex flex-col sheet-slide-up pb-safe max-h-[85%] overflow-y-auto z-10">
            {/* Alça do Sheet */}
            <div className="w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={() => setShowSheet(false)}>
              <div className="w-12 h-1.5 bg-surface-container-highest rounded-full" />
            </div>

            {/* Cabeçalho do Sheet */}
            <div className="px-5 py-3 flex justify-between items-center border-b border-outline-variant/15">
              <div>
                <h3 className="font-extrabold text-sm text-on-surface">Carta Detectada</h3>
                <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Confirme os detalhes da carta</p>
              </div>
              <button 
                onClick={() => setShowSheet(false)}
                className="w-7 h-7 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Conteúdo da Carta */}
            <div className="px-5 py-4 space-y-4">
              <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-3 flex gap-4 shadow-inner">
                <div className="w-16 aspect-[63/88] rounded-xl overflow-hidden border border-outline-variant/30 flex-shrink-0 shadow-sm bg-neutral-800">
                  <img src={detectedCard.images.small} alt={detectedCard.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-grow min-w-0 flex flex-col justify-center">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {detectedCard.types?.map(type => (
                      <span 
                        key={type}
                        className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-white bg-primary shadow-sm"
                      >
                        {type}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-on-secondary-container bg-secondary-container border border-on-secondary-container/10">
                      {detectedCard.rarity ? detectedCard.rarity.replace('Rare', 'Rara') : 'Comum'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-on-surface leading-tight truncate">{detectedCard.name}</h4>
                  <p className="text-[9px] text-on-surface-variant font-medium mt-0.5">Nº {detectedCard.number} • TCGplayer</p>
                  <div className="text-[10px] font-bold text-on-surface mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    Mercado: {detectedCard.tcgplayer?.prices?.holofoil?.market || detectedCard.tcgplayer?.prices?.normal?.market
                      ? `$ ${(detectedCard.tcgplayer.prices.holofoil?.market || detectedCard.tcgplayer.prices.normal?.market || 0).toFixed(2)}`
                      : '$ 10.00'}
                  </div>
                </div>
              </div>

              {/* FORMULÁRIO DE ADIÇÃO */}
              <div className="space-y-4 pt-1">
                
                {/* Seleção de Condição */}
                <div>
                  <label className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Condição da Carta
                  </label>
                  <select 
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white text-on-surface font-medium shadow-sm h-10"
                  >
                    <option value="NM">Praticamente Nova (Near Mint - NM)</option>
                    <option value="LP">Levemente Jogada (Lightly Played - LP)</option>
                    <option value="MP">Moderadamente Jogada (Moderately Played - MP)</option>
                    <option value="HP">Muito Jogada (Heavily Played - HP)</option>
                    <option value="DMG">Danificada (Damaged - DMG)</option>
                  </select>
                </div>

                {/* Seleção de Variante */}
                <div>
                  <label className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Variante / Acabamento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['normal', 'holo', 'reverse'] as const).map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVariant(v)}
                        className={`py-2 px-1 rounded-xl border text-[10px] font-black text-center uppercase tracking-wider transition-all ${
                          variant === v 
                            ? 'bg-primary text-white border-primary shadow-sm' 
                            : 'bg-surface-container-low text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
                        }`}
                      >
                        {v === 'normal' ? 'Normal' : v === 'holo' ? 'Holo' : 'Rev. Holo'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantidade e Salvar */}
                <div className="flex gap-4 items-end pt-2">
                  <div className="w-24 flex-shrink-0">
                    <label className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Qtd
                    </label>
                    <div className="flex items-center border border-outline-variant/30 rounded-xl bg-surface-container-low shadow-sm h-10 justify-between px-2">
                      <button 
                        type="button" 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-6 h-6 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-90 transition-transform"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-extrabold text-xs text-on-surface">{quantity}</span>
                      <button 
                        type="button" 
                        onClick={() => setQuantity(q => Math.min(99, q + 1))}
                        className="w-6 h-6 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-90 transition-transform"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCard}
                    className="flex-grow h-10 bg-primary hover:bg-primary-container text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
                  >
                    <Check size={16} />
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
