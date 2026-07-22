import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { pokemonApi, type TCGCard } from '../services/pokemonApi';
import { Scan as ScanIcon, Upload, X, Plus, Minus, Check, Camera } from 'lucide-react';

// Mapeamento dos arquivos locais para IDs de cartas reais da API
const LOCAL_FILE_MAPPINGS: Record<string, { id: string; name: string }> = {
  'SV05_EN_1.png': { id: 'sv5-10', name: 'Turtwig' },
  'SV05_EN_10.png': { id: 'sv5-17', name: 'Sawsbuck' },
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
  const { addCardToCollection } = useApp();
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
    setIsProcessing(true);
    
    // Simular o flash da câmera
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    try {
      // Obter id mapeado ou escolher aleatório de mock
      const mapped = LOCAL_FILE_MAPPINGS[fileName];
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
    <div className="space-y-6 pb-6 animate-fade-in flex flex-col items-center select-none w-full max-w-sm mx-auto relative">
      
      {/* SUCCESS TOAST MESSAGE */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500/20 font-bold text-xs animate-fade-in text-center max-w-xs">
          <Check size={16} className="bg-white/20 rounded-full p-0.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TÍTULO E FEEDBACK */}
      <div className="text-center">
        <h2 className="text-xl font-extrabold text-on-surface tracking-tight">Escanear Carta</h2>
        <p className="text-xs text-on-surface-variant font-medium mt-0.5">Mire na carta ou selecione um arquivo local</p>
      </div>

      {/* 1. FAUX CAMERA FEED NO TAMANHO DA PROPORÇÃO DA CARTA */}
      <div className="relative w-[210px] aspect-[63/88] bg-black rounded-3xl overflow-hidden shadow-lg border-4 border-white flex flex-col justify-center items-center">
        
        {/* FAUX CAMERA BACKGROUND */}
        <div className="absolute inset-0 z-0 bg-neutral-900 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full relative opacity-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/85 z-10" />
            <img 
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60" 
              alt="Camera Background" 
              className="w-full h-full object-cover blur-sm"
            />
          </div>
        </div>

        {/* DYNAMIC SCANNING RETICLE OVERLAY */}
        {!showSheet && !isProcessing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none p-3">
            {/* Linha Vermelha Laser de Varredura */}
            <div className="absolute left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_3px_rgba(234,0,15,0.7)] animate-scan z-20"></div>
            
            {/* Cantoneiras de Mira (Brackets) */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg bracket-pulse"></div>
            <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg bracket-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg bracket-pulse" style={{ animationDelay: '0.6s' }}></div>
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg bracket-pulse" style={{ animationDelay: '0.4s' }}></div>
            
            {/* Ícone de auxílio visual */}
            <div className="opacity-20">
              <ScanIcon className="text-primary w-10 h-10" />
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

      {/* 2. CONTROLS AREA (SUBIDOS E SEM INVADIR O MENU) */}
      {!showSheet && !isProcessing && (
        <div className="flex flex-col items-center gap-3 w-full px-4 pt-1">
          {/* Seletor de Modo */}
          <div className="bg-surface-container-low p-0.5 rounded-full shadow-inner flex items-center border border-outline-variant/10">
            <button 
              onClick={() => setScanMode('single')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all uppercase ${
                scanMode === 'single' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Carta Única
            </button>
            <button 
              onClick={() => setScanMode('page')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all uppercase ${
                scanMode === 'page' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Página de Pasta
            </button>
          </div>

          <p className="text-[10px] font-bold text-on-surface-variant tracking-wide text-center mt-1">
            Capture uma imagem ou carregue um arquivo da pasta local
          </p>

          {/* Botões de Ação de Captura */}
          <div className="flex items-center gap-6 mt-1">
            
            {/* Seletor de Cartas Locais (Arquivo) */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) handleFileScan(e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-12 h-12 rounded-full"
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
                  className="w-12 h-12 rounded-full bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-all"
                >
                  <Upload size={18} />
                </button>
              </div>
              <span className="text-[8px] font-black text-on-surface-variant mt-1.5 uppercase tracking-wider">Arquivo</span>
            </div>

            {/* Botão de Disparo */}
            <div className="flex flex-col items-center">
              <button 
                onClick={handleRandomScan}
                className="w-16 h-16 rounded-full border-4 border-white bg-primary shadow-lg flex items-center justify-center active:scale-90 transition-all hover:bg-primary-container group"
              >
                <Camera size={22} className="text-white" />
              </button>
              <span className="text-[8px] font-black text-on-surface-variant mt-1.5 uppercase tracking-wider">Capturar</span>
            </div>

          </div>
        </div>
      )}

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
