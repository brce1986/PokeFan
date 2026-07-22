import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { pokemonApi, type TCGCard } from '../services/pokemonApi';
import { ArrowLeft, Search, Share2, Plus, Minus, Check, TrendingUp, Info } from 'lucide-react';

// Helpers para gradients baseados nos tipos do Pokémon
const TYPE_GRADIENTS: Record<string, string> = {
  Grass: 'from-emerald-400 to-teal-600',
  Fire: 'from-orange-400 to-red-600',
  Water: 'from-sky-400 to-blue-600',
  Lightning: 'from-amber-300 to-yellow-500',
  Psychic: 'from-fuchsia-400 to-purple-600',
  Fighting: 'from-orange-600 to-amber-800',
  Darkness: 'from-neutral-700 to-neutral-900',
  Metal: 'from-slate-300 to-zinc-500',
  Dragon: 'from-amber-400 via-yellow-600 to-indigo-700',
  Colorless: 'from-slate-200 to-slate-400',
  Fairy: 'from-pink-300 to-pink-500',
};

const TYPE_TRANSLATIONS: Record<string, string> = {
  Grass: 'Planta',
  Fire: 'Fogo',
  Water: 'Água',
  Lightning: 'Elétrico',
  Psychic: 'Psíquico',
  Fighting: 'Luta',
  Darkness: 'Escuridão',
  Metal: 'Metal',
  Dragon: 'Dragão',
  Colorless: 'Incolor',
  Fairy: 'Fada',
};

export const SearchDetails: React.FC = () => {
  const { 
    formatPrice, 
    selectedCardId, 
    setSelectedCardId, 
    addCardToCollection 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TCGCard[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Card details states
  const [cardInfo, setCardInfo] = useState<TCGCard | null>(null);
  const [condition, setCondition] = useState<'NM' | 'LP' | 'MP' | 'HP' | 'DMG'>('NM');
  const [variant, setVariant] = useState<'normal' | 'holo' | 'reverse'>('normal');
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Carregar lista inicial (ex: Charizard, Pikachu, etc.)
  useEffect(() => {
    if (selectedCardId) return; // Não buscar se já houver um card selecionado
    handleSearch('Charizard');
  }, [selectedCardId]);

  // Carregar detalhes quando selectedCardId muda
  useEffect(() => {
    if (!selectedCardId) {
      setCardInfo(null);
      return;
    }
    const loadCardDetails = async () => {
      try {
        const data = await pokemonApi.getCardById(selectedCardId);
        setCardInfo(data);
        
        // Inicializar opções baseadas no tipo da carta
        setCondition('NM');
        setVariant(data.rarity?.toLowerCase().includes('rare') || data.subtypes?.includes('V') ? 'holo' : 'normal');
        setQuantity(1);
      } catch (err) {
        console.error(err);
      }
    };
    loadCardDetails();
  }, [selectedCardId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleSearch = async (query: string) => {
    setLoadingSearch(true);
    try {
      const result = await pokemonApi.searchCards(query);
      setSearchResults(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAddCard = () => {
    if (!cardInfo) return;
    addCardToCollection(cardInfo, quantity, condition, variant);
    
    // Toast de confirmação
    setToastMessage(`${cardInfo.name} adicionada à coleção!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShare = () => {
    if (!cardInfo) return;
    
    const shareText = `Olha essa carta Pokémon que achei no PokéFan!\n${cardInfo.name} (${cardInfo.rarity || 'Comum'})\nPreço de mercado: ${
      cardInfo.tcgplayer?.prices?.holofoil?.market || cardInfo.tcgplayer?.prices?.normal?.market
        ? formatPrice(cardInfo.tcgplayer.prices.holofoil?.market || cardInfo.tcgplayer.prices.normal?.market || 0)
        : formatPrice(10)
    }`;

    if (navigator.share) {
      navigator.share({
        title: `PokéFan TCG - ${cardInfo.name}`,
        text: shareText,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback: copiar para o clipboard
      navigator.clipboard.writeText(shareText);
      setToastMessage('Link e texto copiados para a área de transferência!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Obter cores do gradiente baseadas no tipo principal
  const getGradientClass = (types: string[] | undefined) => {
    if (!types || types.length === 0) return TYPE_GRADIENTS.Colorless;
    const type = types[0];
    return TYPE_GRADIENTS[type] || TYPE_GRADIENTS.Colorless;
  };

  const getTranslatedType = (types: string[] | undefined) => {
    if (!types || types.length === 0) return 'Incolor';
    return TYPE_TRANSLATIONS[types[0]] || types[0];
  };

  return (
    <div className="space-y-6 pb-6 animate-fade-in select-none">
      
      {/* SUCCESS TOAST */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-y-0 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500/20 font-bold text-xs animate-fade-in text-center max-w-sm">
          <Check size={16} className="bg-white/20 rounded-full p-0.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. SEÇÃO DE DETALHES DA CARTA (Se houver selecionada) */}
      {selectedCardId && cardInfo ? (
        <div className="space-y-6">
          {/* Header customizado com gradiente de tipo e imagem */}
          <div className={`relative w-full h-[320px] md:h-[400px] rounded-3xl overflow-hidden bg-gradient-to-br ${getGradientClass(cardInfo.types)} shadow-ambient-lvl2 flex items-center justify-center`}>
            
            {/* Decorações do gradiente */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            
            {/* Botão de Voltar */}
            <button
              onClick={() => setSelectedCardId(null)}
              className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur text-primary p-2.5 rounded-full shadow-md hover:bg-surface-container-high transition-all active:scale-90"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Imagem da Carta com Animação 3D de Hover */}
            <img 
              src={cardInfo.images.large} 
              alt={cardInfo.name} 
              className="object-contain h-[90%] w-[90%] md:h-[85%] md:w-[85%] drop-shadow-2xl z-10 transition-transform duration-500 hover:scale-[1.03] hover:rotate-2 animate-float"
            />
            
            {/* Tag do Tipo Principal */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-md border border-white/20 z-20">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
              <span className="font-bold text-[10px] text-on-surface uppercase tracking-wider">
                {getTranslatedType(cardInfo.types)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Coluna Esquerda: Dados de Ataques, Descrições */}
            <div className="md:col-span-8 space-y-6">
              
              {/* Informações Básicas */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-on-surface tracking-tight leading-none">{cardInfo.name}</h2>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mt-2">
                    Coleção: {cardInfo.supertype} • {cardInfo.rarity || 'Comum'}
                  </p>
                </div>
                
                {cardInfo.hp && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">PS</span>
                    <div className="text-xl font-extrabold text-primary">{cardInfo.hp}</div>
                  </div>
                )}
              </div>

              {cardInfo.rules && cardInfo.rules.length > 0 && (
                <div className="bg-surface-container-low border border-outline-variant/15 p-4 rounded-2xl">
                  <h4 className="text-xs font-extrabold text-on-surface uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Info size={14} className="text-primary" />
                    Regra Especial
                  </h4>
                  {cardInfo.rules.map((rule, idx) => (
                    <p key={idx} className="text-xs text-on-surface-variant leading-relaxed">{rule}</p>
                  ))}
                </div>
              )}

              {/* Lista de Ataques */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10 pb-2">
                  Ataques
                </h3>

                {cardInfo.attacks && cardInfo.attacks.length > 0 ? (
                  <div className="space-y-3">
                    {cardInfo.attacks.map((attack, idx) => (
                      <div 
                        key={idx} 
                        className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient-lvl1 border border-outline-variant/10 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            {/* Custo de Energia Simplificado */}
                            <div className="flex gap-0.5">
                              {attack.cost.map((energy, eIdx) => (
                                <span 
                                  key={eIdx} 
                                  className="w-4 h-4 rounded-full border border-black/10 flex items-center justify-center text-[9px] font-extrabold bg-surface-container-high text-on-surface-variant"
                                  title={energy}
                                >
                                  {energy[0]}
                                </span>
                              ))}
                            </div>
                            <span className="font-extrabold text-sm text-on-surface">{attack.name}</span>
                          </div>
                          {attack.damage && (
                            <span className="font-extrabold text-base text-on-surface">{attack.damage}</span>
                          )}
                        </div>
                        {attack.text && (
                          <p className="text-xs text-on-surface-variant leading-relaxed">{attack.text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant italic">Este card não possui ataques descritos.</p>
                )}
              </div>

              {/* Fraquezas e Resistências */}
              <div className="grid grid-cols-3 gap-4 border-t border-outline-variant/10 pt-4">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Fraqueza</span>
                  <span className="font-extrabold text-xs text-on-surface">
                    {cardInfo.weaknesses && cardInfo.weaknesses.length > 0 
                      ? `${TYPE_TRANSLATIONS[cardInfo.weaknesses[0].type] || cardInfo.weaknesses[0].type} ${cardInfo.weaknesses[0].value}`
                      : 'Nenhuma'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Resistência</span>
                  <span className="font-extrabold text-xs text-on-surface">
                    {cardInfo.resistances && cardInfo.resistances.length > 0 
                      ? `${TYPE_TRANSLATIONS[cardInfo.resistances[0].type] || cardInfo.resistances[0].type} ${cardInfo.resistances[0].value}`
                      : 'Nenhuma'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Recuo</span>
                  <span className="font-extrabold text-xs text-on-surface">
                    {cardInfo.retreatCost ? cardInfo.retreatCost.length : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Preço de Mercado e Operações */}
            <div className="md:col-span-4 space-y-4">
              <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-ambient-lvl1 border border-outline-variant/15 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Preço de Mercado TCG</span>
                    <div className="text-2xl font-black text-primary mt-1">
                      {formatPrice(
                        cardInfo.tcgplayer?.prices?.holofoil?.market || 
                        cardInfo.tcgplayer?.prices?.normal?.market || 
                        10.00
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleShare}
                    className="bg-surface-container-low hover:bg-surface-container-high text-primary p-2.5 rounded-full shadow-sm transition-all active:scale-90"
                    title="Compartilhar Carta"
                  >
                    <Share2 size={18} />
                  </button>
                </div>

                {/* SVG Histórico de Preços Sparkline */}
                <div className="bg-surface-container-low/30 border border-outline-variant/10 rounded-2xl p-3">
                  <div className="flex justify-between items-center text-[9px] font-bold text-on-surface-variant mb-2">
                    <span>Tendência 30d</span>
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <TrendingUp size={10} /> +5.2%
                    </span>
                  </div>
                  
                  {/* Faux Sparkline */}
                  <div className="h-10 w-full flex items-end gap-1 px-1">
                    <div className="w-1/6 bg-primary/20 rounded-t h-1/3"></div>
                    <div className="w-1/6 bg-primary/30 rounded-t h-1/2"></div>
                    <div className="w-1/6 bg-primary/25 rounded-t h-2/5"></div>
                    <div className="w-1/6 bg-primary/50 rounded-t h-3/4"></div>
                    <div className="w-1/6 bg-primary/45 rounded-t h-2/3"></div>
                    <div className="w-1/6 bg-primary rounded-t h-full"></div>
                  </div>
                </div>

                {/* Formulário Interativo de Coleção */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Condição
                    </label>
                    <select 
                      value={condition} 
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-xs text-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-tertiary"
                    >
                      <option value="NM">Praticamente Nova (NM)</option>
                      <option value="LP">Levemente Jogada (LP)</option>
                      <option value="MP">Moderadamente Jogada (MP)</option>
                      <option value="HP">Muito Jogada (HP)</option>
                      <option value="DMG">Danificada (DMG)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Variante
                    </label>
                    <select 
                      value={variant} 
                      onChange={(e) => setVariant(e.target.value as any)}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-xs text-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-tertiary"
                    >
                      <option value="normal">Normal</option>
                      <option value="holo">Holográfica</option>
                      <option value="reverse">Holo Reversa</option>
                    </select>
                  </div>

                  <div className="flex gap-3 items-end pt-1">
                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                        Qtd
                      </label>
                      <div className="flex items-center justify-between border border-outline-variant/25 rounded-xl bg-surface-container-low h-9 px-1">
                        <button 
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-75 transition-all"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-extrabold text-xs text-on-surface">{quantity}</span>
                        <button 
                          onClick={() => setQuantity(q => Math.min(99, q + 1))}
                          className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-75 transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={handleAddCard}
                      className="flex-grow bg-primary hover:bg-primary-container text-white py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center gap-1"
                    >
                      <Plus size={14} />
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        
        // 2. TELA DE BUSCA GLOBAL
        <>
          <div className="flex flex-col">
            <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">Buscar Cartas TCG</h2>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Explore todo o banco de dados oficial</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por nome de Pokémon (ex: Pikachu)..."
                className="w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white transition-all text-on-surface font-medium shadow-ambient-lvl1"
              />
            </div>
            <button 
              type="submit"
              className="bg-primary hover:bg-primary-container text-white rounded-2xl px-6 py-3.5 font-bold text-sm shadow-md active:scale-95 duration-200 transition-all border border-primary/10"
            >
              Buscar
            </button>
          </form>

          {loadingSearch ? (
            <div className="text-center py-16 text-sm text-on-surface-variant font-semibold">
              Buscando cartas na base de dados...
            </div>
          ) : (
            <div>
              {searchResults.length > 0 && (
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 px-1">
                  Resultados encontrados ({searchResults.length})
                </p>
              )}
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResults.map(card => {
                  const price = card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 10;
                  
                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-2.5 shadow-ambient-lvl1 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
                    >
                      <div className="relative w-full aspect-[63/88] rounded-xl bg-surface-container overflow-hidden mb-2 shadow-sm">
                        <img 
                          src={card.images.small} 
                          alt={card.name} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[8px] px-1.5 py-0.5 rounded font-extrabold">
                          #{card.number}
                        </span>
                      </div>
                      
                      <div className="px-1 flex flex-col">
                        <h4 className="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors leading-tight">
                          {card.name}
                        </h4>
                        <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-outline-variant/10">
                          <span className="font-extrabold text-[11px] text-on-surface">
                            {formatPrice(price)}
                          </span>
                          <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-wider">
                            {card.types?.[0] || 'Incolor'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {searchResults.length === 0 && !loadingSearch && (
                <div className="text-center py-16 text-on-surface-variant/80 text-sm font-medium">
                  Use a barra acima para pesquisar qualquer carta do Pokémon TCG.
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
};
