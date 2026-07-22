import type { TCGCard } from './pokemonApi';

export interface LigaPokemonPrice {
  priceMin: number;
  priceAvg: number;
  priceMax: number;
  cardName: string;
  editionName: string;
  lastUpdated: string;
  isReal: boolean; // true se veio do Apify, false se foi estimado/conversão
}

// Chave para cache local de preços da LigaPokémon
const LIGA_PRICE_CACHE_KEY = 'pokefan_liga_prices_cache';

const getCache = (): Record<string, LigaPokemonPrice> => {
  try {
    const raw = localStorage.getItem(LIGA_PRICE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveCache = (cache: Record<string, LigaPokemonPrice>) => {
  try {
    localStorage.setItem(LIGA_PRICE_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {}
};

export const ligaPokemonApi = {
  /**
   * Obtém o preço da carta na LigaPokémon.
   * Se houver token do Apify, faz a chamada real.
   * Senão, calcula o preço estimado BRL multiplicando o USD do TCGplayer por uma taxa média
   * e salvando no cache local.
   */
  async getCardPrice(card: TCGCard, forceRefresh = false): Promise<LigaPokemonPrice> {
    const cache = getCache();
    const cacheKey = card.id;

    // Se já tiver preço no cache e ele tiver menos de 24 horas, e não for forçado o refresh, usa o cache
    if (!forceRefresh && cache[cacheKey]) {
      const cacheTime = new Date(cache[cacheKey].lastUpdated).getTime();
      const now = Date.now();
      if (now - cacheTime < 24 * 60 * 60 * 1000) {
        return cache[cacheKey];
      }
    }

    const apifyToken = import.meta.env.VITE_APIFY_TOKEN || localStorage.getItem('pokefan_apify_token');

    if (apifyToken) {
      try {
        const queryText = `${card.name} ${card.number}`;
        
        // Chamada síncrona ao endpoint do Apify para o scraper da LigaPokémon
        const response = await fetch(`https://api.apify.com/v2/actors/gio21~ligapokemon-scraper/run-sync-get-dataset-items?token=${apifyToken}&timeout=60`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: queryText,
            language: 'any',
            maxItems: 3
          })
        });

        if (response.ok) {
          const items = await response.json();
          if (Array.isArray(items) && items.length > 0) {
            // Encontra a melhor correspondência de item (toma o primeiro item retornado)
            const matchedItem = items[0];
            
            const priceMin = parseFloat(matchedItem.priceMin || matchedItem.minPrice || '0') || 0;
            const priceAvg = parseFloat(matchedItem.priceAvg || matchedItem.avgPrice || '0') || 0;
            const priceMax = parseFloat(matchedItem.priceMax || matchedItem.maxPrice || '0') || 0;

            if (priceAvg > 0) {
              const newPrice: LigaPokemonPrice = {
                priceMin: priceMin || priceAvg * 0.85,
                priceAvg,
                priceMax: priceMax || priceAvg * 1.15,
                cardName: matchedItem.name || card.name,
                editionName: matchedItem.edition || card.set?.name || 'Promo',
                lastUpdated: new Date().toISOString(),
                isReal: true
              };

              cache[cacheKey] = newPrice;
              saveCache(cache);
              return newPrice;
            }
          }
        }
      } catch (err) {
        console.warn("Erro ao acessar scraper do Apify para LigaPokémon:", err);
      }
    }

    // --- FALLBACK ESTIMADO ---
    // Pega o preço base em USD do TCGplayer
    const usdPrice = card.tcgplayer?.prices?.holofoil?.market || 
                     card.tcgplayer?.prices?.normal?.market || 
                     card.tcgplayer?.prices?.reverseHolofoil?.market || 
                     5.00;

    // Fator de conversão BRL considerando cotação e custos locais (aprox. 1 USD = 6.2 BRL)
    const conversionFactor = 6.2;
    const estimatedAvg = usdPrice * conversionFactor;

    const estimatedPrice: LigaPokemonPrice = {
      priceMin: estimatedAvg * 0.85,
      priceAvg: estimatedAvg,
      priceMax: estimatedAvg * 1.15,
      cardName: card.name,
      editionName: card.set?.name || 'Promo',
      lastUpdated: new Date().toISOString(),
      isReal: false
    };

    cache[cacheKey] = estimatedPrice;
    saveCache(cache);
    return estimatedPrice;
  }
};
