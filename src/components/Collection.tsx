import React, { useState, useEffect } from 'react';
import { useApp, type CollectionItem } from '../context/AppContext';
import { pokemonApi, type TCGCard, type TCGSet, MOCK_SETS } from '../services/pokemonApi';
import { precoUSD, somarValorColecao, SEM_PRECO } from '../utils/pricing';
import { ArrowLeft, Search, Plus, ChevronRight, SlidersHorizontal, X } from 'lucide-react';

export const Collection: React.FC = () => {
  const { 
    collection, 
    formatPrice, 
    selectedSetId, 
    setSelectedSetId, 
    setSelectedCardId, 
    setActiveTab 
  } = useApp();

  const [setsList, setSetsList] = useState<TCGSet[]>(MOCK_SETS);
  const [loadingSets, setLoadingSets] = useState(false);
  // true quando a API pública falhou e a tela caiu para o catálogo mockado (MOCK_SETS)
  const [usingFallbackSets, setUsingFallbackSets] = useState(false);
  const [setSearchText, setSetSearchText] = useState('');
  
  // Set Detail View States
  const [setCards, setSetCards] = useState<TCGCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardSearchText, setCardSearchText] = useState('');
  const [cardFilter, setCardFilter] = useState<'all' | 'owned' | 'missing'>('all');

  // States para "Por Carta" view
  const [collectionTab, setCollectionTab] = useState<'collection' | 'card'>('collection');
  const [visibleCount, setVisibleCount] = useState(20);
  const [sortBy, setSortBy] = useState<'value-desc' | 'value-asc' | 'number' | 'name' | 'recent'>('value-desc');
  const [supertypeFilter, setSupertypeFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [subtypeFilter, setSubtypeFilter] = useState<string>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [variantFilter, setVariantFilter] = useState<string>('all');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Carregar todos os sets
  useEffect(() => {
    const loadSets = async () => {
      setLoadingSets(true);
      try {
        const data = await pokemonApi.getSets();
        setSetsList(data);
        // getSets nunca lança: quando catálogo e API falham, devolve a própria
        // referência de MOCK_SETS. Comparar por referência é o jeito exato de
        // saber que estamos nos 4 sets mockados e avisar o usuário.
        setUsingFallbackSets(data === MOCK_SETS);
      } catch (err) {
        console.error(err);
        setSetsList(MOCK_SETS);
        setUsingFallbackSets(true);
      } finally {
        setLoadingSets(false);
      }
    };
    loadSets();
  }, []);

  // Carregar cartas do set selecionado
  useEffect(() => {
    if (!selectedSetId) {
      setSetCards([]);
      return;
    }
    const loadSetCards = async () => {
      setLoadingCards(true);
      try {
        const result = await pokemonApi.getCardsBySet(selectedSetId);
        setSetCards(result.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCards(false);
      }
    };
    loadSetCards();
  }, [selectedSetId]);

  // Obter estatísticas do set selecionado
  const getSelectedSetStats = () => {
    const selectedSet = setsList.find(s => s.id === selectedSetId);
    if (!selectedSet) return null;

    // Prefixo com hífen: sem ele, cartas de "sv3pt5" contariam para "sv3".
    const cardsInCollection = collection.filter(item => item.cardDetails.id.startsWith(selectedSetId + '-'));
    const uniqueCount = cardsInCollection.length;

    // Fonte única de preço (utils/pricing) — nunca fabrica valor para carta sem preço publicado.
    const { totalUSD: valuation, itensSemPreco } = somarValorColecao(cardsInCollection);

    const percentage = selectedSet.printedTotal > 0
      ? Math.round((uniqueCount / selectedSet.printedTotal) * 100)
      : 0;

    return {
      set: selectedSet,
      uniqueCount,
      totalCount: selectedSet.printedTotal,
      percentage,
      valuation,
      itensSemPreco
    };
  };

  const setStats = getSelectedSetStats();

  // Filtrar conjuntos pela barra de pesquisa
  const filteredSets = setsList.filter(s => 
    s.name.toLowerCase().includes(setSearchText.toLowerCase()) || 
    s.series.toLowerCase().includes(setSearchText.toLowerCase())
  );

  // Obter as cartas que o usuário de fato possui e indexá-las por cardId para busca rápida
  const ownedCardsMap = collection.reduce((map, item) => {
    if (!map[item.cardId]) {
      map[item.cardId] = [];
    }
    map[item.cardId].push(item);
    return map;
  }, {} as Record<string, CollectionItem[]>);

  // Filtrar e pesquisar cartas dentro de um set binder
  const filteredCards = setCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(cardSearchText.toLowerCase()) || 
                          card.number.includes(cardSearchText);
    
    const isOwned = !!ownedCardsMap[card.id];
    
    if (cardFilter === 'owned') return matchesSearch && isOwned;
    if (cardFilter === 'missing') return matchesSearch && !isOwned;
    return matchesSearch;
  });

  // Lista de tipos Pokémon com cores correspondentes
  const typesList = [
    { id: 'all', name: 'Todos', color: 'bg-slate-500' },
    { id: 'Grass', name: 'Planta', color: 'bg-emerald-500' },
    { id: 'Fire', name: 'Fogo', color: 'bg-orange-500' },
    { id: 'Water', name: 'Água', color: 'bg-blue-500' },
    { id: 'Lightning', name: 'Elétrico', color: 'bg-yellow-500' },
    { id: 'Psychic', name: 'Psíquico', color: 'bg-purple-500' },
    { id: 'Fighting', name: 'Luta', color: 'bg-amber-700' },
    { id: 'Darkness', name: 'Escrudão', color: 'bg-neutral-800' },
    { id: 'Metal', name: 'Metal', color: 'bg-zinc-500' },
    { id: 'Dragon', name: 'Dragão', color: 'bg-indigo-600' },
    { id: 'Colorless', name: 'Incolor', color: 'bg-slate-400' }
  ];

  // Obter preço de mercado de um item — null quando não há preço publicado (ver utils/pricing).
  const getItemPrice = (item: CollectionItem): number | null => precoUSD(item.cardDetails, item.variant);

  // Contador de filtros ativos
  const activeFiltersCount = 
    (supertypeFilter !== 'all' ? 1 : 0) + 
    (typeFilter !== 'all' ? 1 : 0) + 
    (subtypeFilter !== 'all' ? 1 : 0) + 
    (rarityFilter !== 'all' ? 1 : 0) + 
    (conditionFilter !== 'all' ? 1 : 0) + 
    (variantFilter !== 'all' ? 1 : 0);

  // Filtrar e ordenar cartas individuais possuídas
  const filteredOwnedCards = collection
    .filter(item => {
      // Busca por texto (usa a mesma setSearchText para conveniência)
      const matchesSearch = item.cardDetails.name.toLowerCase().includes(setSearchText.toLowerCase()) || 
                            item.cardDetails.number.includes(setSearchText);
      
      // Filtro de Supertipo
      const matchesSupertype = supertypeFilter === 'all' || 
        item.cardDetails.supertype.toLowerCase() === supertypeFilter.toLowerCase();

      // Filtro de tipo de elemento
      const matchesType = typeFilter === 'all' || item.cardDetails.types?.includes(typeFilter);

      // Filtro de Subtipo
      const matchesSubtype = subtypeFilter === 'all' || 
        item.cardDetails.subtypes?.some(sub => sub.toLowerCase() === subtypeFilter.toLowerCase());
      
      // Filtro de raridade
      const matchesRarity = rarityFilter === 'all' || 
        (item.cardDetails.rarity?.toLowerCase().includes(rarityFilter.toLowerCase()));

      // Filtro de condição
      const matchesCondition = conditionFilter === 'all' || item.condition === conditionFilter;

      // Filtro de variante
      const matchesVariant = variantFilter === 'all' || item.variant === variantFilter;

      return matchesSearch && matchesSupertype && matchesType && matchesSubtype && matchesRarity && matchesCondition && matchesVariant;
    })
    .sort((a, b) => {
      if (sortBy === 'value-desc') {
        // Item sem preço (null) vale 0 só para fins de ordenação — não é exibido como preço real.
        return (getItemPrice(b) ?? 0) - (getItemPrice(a) ?? 0);
      }
      if (sortBy === 'value-asc') {
        return (getItemPrice(a) ?? 0) - (getItemPrice(b) ?? 0);
      }
      if (sortBy === 'name') {
        return a.cardDetails.name.localeCompare(b.cardDetails.name);
      }
      if (sortBy === 'number') {
        const numA = parseInt(a.cardDetails.number.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.cardDetails.number.replace(/\D/g, '')) || 0;
        return numA - numB;
      }
      if (sortBy === 'recent') {
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
      return 0;
    });

  const visibleCards = filteredOwnedCards.slice(0, visibleCount);

  return (
    <div className="space-y-6 pb-6 animate-fade-in select-none">

      {/* Aviso de fallback: API pública instável, catálogo exibido é o mockado (MOCK_SETS) */}
      {usingFallbackSets && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-2xl px-4 py-2.5">
          Catálogo indisponível no momento. Mostrando dados limitados.
        </div>
      )}

      {/* 1. VISÃO DOS BINDERS (Lista de Sets) */}
      {!selectedSetId ? (
        <>
          <div className="flex flex-col">
            <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">Minhas Pastas TCG</h2>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Explore o progresso de cada coleção</p>
          </div>

          {/* Barra de Pesquisa de Sets / Cartas */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <input
              type="text"
              value={setSearchText}
              onChange={(e) => {
                setSetSearchText(e.target.value);
                setVisibleCount(20);
              }}
              placeholder={collectionTab === 'collection' ? "Pesquisar por conjunto ou série..." : "Pesquisar por nome ou número da carta..."}
              className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white transition-all text-on-surface font-medium shadow-ambient-lvl1"
            />
          </div>

          {/* Pills de Divisão da Busca */}
          <div className="flex gap-2 p-0.5 bg-surface-container-low border border-outline-variant/10 rounded-2xl shadow-inner">
            <button
              onClick={() => {
                setCollectionTab('collection');
                setVisibleCount(20);
              }}
              className={`flex-1 text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                collectionTab === 'collection'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              📁 Por Coleção
            </button>
            <button
              onClick={() => {
                setCollectionTab('card');
                setVisibleCount(20);
              }}
              className={`flex-1 text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                collectionTab === 'card'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              🎴 Por Carta
            </button>
          </div>

          {/* Conteúdo Dependendo da Pill Selecionada */}
          {collectionTab === 'collection' ? (
            /* Listagem de Sets */
            loadingSets ? (
              <div className="text-center py-12 text-sm text-on-surface-variant font-semibold">
                Carregando coleções...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSets.map(set => {
                  // Prefixo com hífen: sem ele, "sv3pt5" cairia dentro de "sv3".
                  const cardsDoSet = collection.filter(item => item.cardDetails.id.startsWith(set.id + '-'));
                  const uniqueOwned = cardsDoSet.length;
                  const percentage = set.printedTotal > 0 ? Math.min(100, Math.round((uniqueOwned / set.printedTotal) * 100)) : 0;

                  // Fonte única de preço (utils/pricing) — itens sem preço publicado são ignorados na soma.
                  const { totalUSD: setValuation } = somarValorColecao(cardsDoSet);

                  return (
                    <div
                      key={set.id}
                      onClick={() => setSelectedSetId(set.id)}
                      className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-4 shadow-ambient-lvl1 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-4">
                        {/* Logo do Set */}
                        <div className="w-16 h-12 bg-surface-container-low rounded-xl flex items-center justify-center p-1 border border-outline-variant/20 overflow-hidden flex-shrink-0 shadow-sm">
                          <img src={set.images.logo} alt={set.name} className="w-full h-full object-contain" />
                        </div>
                        
                        <div className="min-w-0 flex-grow">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-extrabold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                              {set.name}
                            </h3>
                          </div>
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase mt-0.5 tracking-wider">
                            Série: {set.series}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-on-surface-variant/50 group-hover:translate-x-0.5 transition-transform" />
                      </div>

                      <div className="mt-4 pt-3 border-t border-outline-variant/5 flex items-end justify-between">
                        <div className="w-2/3 space-y-1">
                          <div className="flex justify-between text-[9px] font-bold text-on-surface-variant">
                            <span>Colecionado</span>
                            <span>{uniqueOwned} / {set.printedTotal}</span>
                          </div>
                          <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                percentage > 70 ? 'bg-emerald-500' : percentage > 30 ? 'bg-secondary-container' : 'bg-primary'
                              }`}
                              style={{ width: `${Math.max(percentage, 2)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Valor</div>
                          <div className="text-xs font-extrabold text-on-surface">{formatPrice(setValuation)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Listagem de Cartas Individuais ("Por Carta") */
            <div className="space-y-4">
              
              {/* Category selector + Filters Drawer Trigger */}
              <div className="flex justify-between items-center gap-2 mt-1">
                {/* Horizontal scrollable categories */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 flex-grow">
                  {[
                    { id: 'all', label: '🎴 Todas' },
                    { id: 'Pokémon', label: '🦖 Pokémon' },
                    { id: 'Trainer', label: '🎒 Treinador' },
                    { id: 'Energy', label: '⚡ Energia' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSupertypeFilter(cat.id);
                        setVisibleCount(20);
                      }}
                      className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                        supertypeFilter === cat.id
                          ? 'bg-primary text-white border-transparent shadow-sm'
                          : 'bg-white text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-low'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Botão para abrir o Drawer de Filtros */}
                <button
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className={`flex-shrink-0 h-9 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all relative ${
                    activeFiltersCount > 0
                      ? 'bg-primary/5 text-primary border-primary/30 shadow-sm'
                      : 'bg-white text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-low'
                  }`}
                >
                  <SlidersHorizontal size={14} />
                  <span>Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Indicador de Filtros Ativos */}
              {activeFiltersCount > 0 && (
                <div className="flex justify-between items-center bg-surface-container-low px-3.5 py-2 rounded-2xl border border-outline-variant/10 text-[10px] font-bold text-on-surface-variant">
                  <span>Filtros ativos: {activeFiltersCount}</span>
                  <button 
                    onClick={() => {
                      setSortBy('value-desc');
                      setSupertypeFilter('all');
                      setTypeFilter('all');
                      setSubtypeFilter('all');
                      setRarityFilter('all');
                      setConditionFilter('all');
                      setVariantFilter('all');
                    }}
                    className="text-primary hover:underline"
                  >
                    Limpar Filtros
                  </button>
                </div>
              )}

              {/* 3. Grid de Cartas (2 Colunas) */}
              {filteredOwnedCards.length === 0 ? (
                <div className="text-center py-16 text-sm text-on-surface-variant font-bold bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-6 shadow-sm">
                  Nenhuma carta encontrada com os filtros selecionados.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {visibleCards.map(item => {
                      const price = getItemPrice(item);
                      
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedCardId(item.cardDetails.id);
                            setActiveTab('search');
                          }}
                          className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-2.5 shadow-ambient-lvl1 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
                        >
                          {/* Imagem do Card */}
                          <div className="relative w-full aspect-[63/88] rounded-xl bg-surface-container overflow-hidden mb-2 shadow-sm">
                            <img 
                              src={item.cardDetails.images.small} 
                              alt={item.cardDetails.name} 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                            {/* Badge de Variante */}
                            {item.variant !== 'normal' && (
                              <span className="absolute top-1.5 right-1.5 bg-primary/90 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider shadow-sm">
                                {item.variant === 'holo' ? 'Holo' : 'Rev'}
                              </span>
                            )}
                            {/* Badge de Condição / Quantidade */}
                            <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[8px] px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1 shadow-sm">
                              <span>{item.condition}</span>
                              <span className="w-1 h-1 bg-white/45 rounded-full"></span>
                              <span className="text-amber-400">x{item.quantity}</span>
                            </span>
                          </div>

                          {/* Dados do Card */}
                          <div className="min-w-0 px-0.5">
                            <h4 className="font-extrabold text-xs text-on-surface group-hover:text-primary transition-colors truncate">
                              {item.cardDetails.name}
                            </h4>
                            
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider truncate max-w-[70%]">
                                {item.cardDetails.id.split('-')[0].toUpperCase()}
                              </span>
                              <span className="text-xs font-black text-emerald-600">
                                {price === null ? SEM_PRECO : formatPrice(price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botão Carregar Mais */}
                  {filteredOwnedCards.length > visibleCount && (
                    <button
                      onClick={() => setVisibleCount(c => c + 20)}
                      className="w-full py-3 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-on-surface font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-1"
                    >
                      Carregar Mais (+20)
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </>
      ) : (
        
        // 2. DETALHE DO BINDER (Card Grid do Set)
        <>
          {/* Header de Detalhes do Set */}
          {setStats && (
            <div className="bg-surface-container-low border border-outline-variant/15 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <button
                  onClick={() => setSelectedSetId(null)}
                  className="flex items-center gap-1 text-xs font-bold text-primary bg-white px-3 py-1.5 rounded-full shadow-sm hover:bg-surface-container-high active:scale-95 transition-all border border-outline-variant/10"
                >
                  <ArrowLeft size={16} />
                  Pastas
                </button>
                <div className="text-right text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Lançamento: {new Date(setStats.set.releaseDate).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="w-20 h-12 bg-white rounded-xl flex items-center justify-center p-1.5 border border-outline-variant/30 overflow-hidden flex-shrink-0 shadow-sm">
                  <img src={setStats.set.images.logo} alt={setStats.set.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-on-surface leading-tight tracking-tight">
                    {setStats.set.name}
                  </h2>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-0.5">
                    {setStats.set.series} • {setStats.set.total} Cartas
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-outline-variant/5">
                  <div className="text-sm font-extrabold text-on-surface">{setStats.uniqueCount} / {setStats.totalCount}</div>
                  <div className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Únicas</div>
                </div>
                <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-outline-variant/5">
                  <div className="text-sm font-extrabold text-primary">{setStats.percentage}%</div>
                  <div className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Completado</div>
                </div>
                <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-outline-variant/5">
                  <div className="text-sm font-extrabold text-emerald-600">{formatPrice(setStats.valuation)}</div>
                  <div className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Valor</div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros e Barra de Pesquisa de Cartas */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
              <input
                type="text"
                value={cardSearchText}
                onChange={(e) => setCardSearchText(e.target.value)}
                placeholder="Pesquisar carta por nome ou número..."
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-tertiary focus:bg-white transition-all text-on-surface font-medium shadow-sm"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'owned', 'missing'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setCardFilter(f)}
                  className={`flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all border ${
                    cardFilter === f 
                      ? 'bg-primary text-white border-primary shadow-sm' 
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-low'
                  }`}
                >
                  {f === 'all' ? 'Ver Todas' : f === 'owned' ? 'Possuídas' : 'Faltantes'}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Cartas (Colecionador Binder) */}
          {loadingCards ? (
            <div className="text-center py-16 text-sm text-on-surface-variant font-semibold">
              Carregando cartas do conjunto...
            </div>
          ) : (
            <>
              {filteredCards.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant text-sm font-medium">
                  Nenhuma carta corresponde aos critérios de busca.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredCards.map(card => {
                    const ownedInstances = ownedCardsMap[card.id] || [];
                    const isOwned = ownedInstances.length > 0;
                    const totalQty = ownedInstances.reduce((sum, item) => sum + item.quantity, 0);
                    
                    return (
                      <div
                        key={card.id}
                        onClick={() => {
                          setSelectedCardId(card.id);
                          setActiveTab('search');
                        }}
                        className={`flex flex-col gap-2 relative group cursor-pointer ${
                          !isOwned && 'opacity-65'
                        }`}
                      >
                        {/* Imagem da Carta com Borda Realística de Binder */}
                        <div className={`relative rounded-2xl overflow-hidden aspect-[63/88] bg-white transition-all duration-300 group-hover:-translate-y-1 ${
                          isOwned 
                            ? 'border border-outline-variant/30 shadow-ambient-lvl1 group-hover:shadow-ambient-lvl2' 
                            : 'border-2 border-dashed border-outline-variant/40 bg-surface-container-low shadow-none'
                        }`}>
                          <img 
                            src={card.images.small} 
                            alt={card.name} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* Overlays / Badges */}
                          {isOwned ? (
                            <>
                              {/* Pill Badge de Quantidade (Inferior Direito) */}
                              <div className="absolute bottom-2 right-2 bg-inverse-surface text-inverse-on-surface font-sans text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-md border border-white/10">
                                x{totalQty}
                              </div>

                              {/* Pill Badge de Condição (Superior Esquerdo) */}
                              <div className="absolute top-2 left-2 bg-primary text-white font-sans text-[9px] font-black px-2 py-0.5 rounded-full border border-white/20 shadow-md">
                                {ownedInstances[0].condition}
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none">
                              <span className="bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant/30 text-on-surface-variant font-bold text-[9px] uppercase px-3 py-1 rounded-full shadow-sm">
                                Faltando
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Detalhes da legenda */}
                        <div className="px-1 text-left">
                          <div className="flex justify-between items-baseline gap-1">
                            <span className="text-[10px] font-extrabold text-on-surface-variant">
                              #{card.number}
                            </span>
                            <span className="text-[9px] font-black text-primary/80 uppercase truncate max-w-[70px]">
                              {card.rarity ? card.rarity.replace('Double ', '').replace('Rare', 'Rara') : 'Comum'}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-on-surface truncate mt-0.5 group-hover:text-primary transition-colors">
                            {card.name}
                          </h4>
                          <div className="text-[11px] font-extrabold text-on-surface mt-1 flex items-center gap-0.5">
                            {(() => {
                              const price = precoUSD(card);
                              return price === null ? SEM_PRECO : formatPrice(price);
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Botão de Adicionar Rápido */}
              <div className="pt-6">
                <button
                  onClick={() => setActiveTab('scan')}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/30 bg-surface-container-lowest text-primary font-bold text-sm hover:bg-primary/5 hover:border-primary transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Plus size={18} />
                  Adicionar Cartas a este Binder
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* 3. FILTERS & SORTING DRAWER (Estilo Slide-Up Drawer) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center animate-fade-in p-4 select-none">
          {/* Click-outside backdrop */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsFilterDrawerOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] flex flex-col sheet-slide-up pb-safe max-h-[85%] overflow-y-auto z-10 p-5 space-y-5">
            {/* Handle bar */}
            <div className="w-full flex justify-center pb-2 cursor-pointer" onClick={() => setIsFilterDrawerOpen(false)}>
              <div className="w-12 h-1.5 bg-surface-container-highest rounded-full" />
            </div>

            {/* Cabeçalho */}
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-on-surface flex items-center gap-1.5">
                  <SlidersHorizontal size={16} className="text-primary" />
                  Filtros & Ordenação
                </h3>
                <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mt-0.5">Refine a listagem de cartas</p>
              </div>
              <button 
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Conteúdo do Drawer */}
            <div className="space-y-4 overflow-y-auto pr-1">
              
              {/* 1. Ordenação */}
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Ordenar por</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'value-desc', label: '💸 Maior Valor' },
                    { id: 'value-asc', label: '🪙 Menor Valor' },
                    { id: 'name', label: '🔤 Nome A-Z' },
                    { id: 'number', label: '🔢 Número' },
                    { id: 'recent', label: '📅 Recentes' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSortBy(opt.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        sortBy === opt.id
                          ? 'bg-primary text-white border-transparent shadow-sm'
                          : 'bg-surface-container-low text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Filtro de Elemento Pokémon */}
              {(supertypeFilter === 'all' || supertypeFilter === 'Pokémon') && (
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Elemento Pokémon</label>
                  <div className="flex flex-wrap gap-1.5">
                    {typesList.map(type => (
                      <button
                        key={type.id}
                        onClick={() => setTypeFilter(type.id)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                          typeFilter === type.id
                            ? `${type.color} text-white border-transparent shadow-sm`
                            : 'bg-surface-container-low text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
                        }`}
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Filtro de Subtipo */}
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Subtipo da Carta</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'Basic', label: 'Básico' },
                    { id: 'Stage 1', label: 'Estágio 1' },
                    { id: 'Stage 2', label: 'Estágio 2' },
                    { id: 'V', label: 'Pokémon V' },
                    { id: 'ex', label: 'Pokémon ex' },
                    { id: 'Item', label: 'Item' },
                    { id: 'Supporter', label: 'Apoiador' },
                    { id: 'Stadium', label: 'Estádio' },
                    { id: 'Special', label: 'Energia Especial' }
                  ].map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setSubtypeFilter(sub.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        subtypeFilter === sub.id
                          ? 'bg-primary text-white border-transparent shadow-sm'
                          : 'bg-surface-container-low text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Raridade */}
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Raridade</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'common', label: 'Comum' },
                    { id: 'uncommon', label: 'Incomum' },
                    { id: 'rare', label: 'Rara' },
                    { id: 'ultra', label: 'Ultra Rara' },
                    { id: 'double', label: 'Dupla Rara (ex)' },
                    { id: 'secret', label: 'Secreta' }
                  ].map(rar => (
                    <button
                      key={rar.id}
                      onClick={() => setRarityFilter(rar.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        rarityFilter === rar.id
                          ? 'bg-primary text-white border-transparent shadow-sm'
                          : 'bg-surface-container-low text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
                      }`}
                    >
                      {rar.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Condição */}
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Condição da Carta</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'NM', label: 'Near Mint (NM)' },
                    { id: 'LP', label: 'Lightly Played (LP)' },
                    { id: 'MP', label: 'Mod. Played (MP)' },
                    { id: 'HP', label: 'Heavily Played (HP)' },
                    { id: 'DMG', label: 'Damaged (DMG)' }
                  ].map(cond => (
                    <button
                      key={cond.id}
                      onClick={() => setConditionFilter(cond.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        conditionFilter === cond.id
                          ? 'bg-primary text-white border-transparent shadow-sm'
                          : 'bg-surface-container-low text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
                      }`}
                    >
                      {cond.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Variante / Acabamento */}
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Variante / Acabamento</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'normal', label: 'Normal' },
                    { id: 'holo', label: 'Holográfica' },
                    { id: 'reverse', label: 'Reverse Holo' }
                  ].map(vr => (
                    <button
                      key={vr.id}
                      onClick={() => setVariantFilter(vr.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        variantFilter === vr.id
                          ? 'bg-primary text-white border-transparent shadow-sm'
                          : 'bg-surface-container-low text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
                      }`}
                    >
                      {vr.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer do Drawer */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-outline-variant/10">
              <button
                type="button"
                onClick={() => {
                  setSortBy('value-desc');
                  setSupertypeFilter('all');
                  setTypeFilter('all');
                  setSubtypeFilter('all');
                  setRarityFilter('all');
                  setConditionFilter('all');
                  setVariantFilter('all');
                  setIsFilterDrawerOpen(false);
                }}
                className="py-3 bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container-high text-on-surface-variant font-extrabold text-[10px] rounded-2xl transition-all uppercase tracking-wider flex items-center justify-center gap-1 active:scale-[0.98]"
              >
                Limpar Tudo
              </button>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="py-3 bg-primary hover:bg-primary-container text-white font-extrabold text-[10px] rounded-2xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-1 active:scale-[0.98]"
              >
                Aplicar ({filteredOwnedCards.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
