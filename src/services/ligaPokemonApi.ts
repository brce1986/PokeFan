import type { TCGCard } from './pokemonApi';
import { supabase } from './supabaseClient';
import { precoUSD } from '../utils/pricing';
import { getUsdToBrl } from './fxRates';

export interface LigaPokemonPrice {
  priceMin: number;
  priceAvg: number;
  priceMax: number;
  cardName: string;
  editionName: string;
  lastUpdated: string;
  isReal: boolean; // true se veio do banco (Apify centralizado), false se foi estimado
}

// Chave para cache local de preços da LigaPokémon (LocalStorage)
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
   * 1. Consulta o cache local (LocalStorage).
   * 2. Se não estiver no cache (ou expirar), consulta a tabela centralizada no Supabase.
   * 3. Se não houver no banco ou estiver sem internet, estima convertendo o dólar do TCGplayer.
   */
  async getCardPrice(card: TCGCard, forceRefresh = false): Promise<LigaPokemonPrice | null> {
    const cache = getCache();
    const cacheKey = card.id;

    // 1. Verificar Cache do LocalStorage (24h)
    if (!forceRefresh && cache[cacheKey]) {
      const cacheTime = new Date(cache[cacheKey].lastUpdated).getTime();
      const now = Date.now();
      if (now - cacheTime < 24 * 60 * 60 * 1000) {
        return cache[cacheKey];
      }
    }

    // 2. Se o Supabase estiver ativo, buscar na tabela centralizada ligapokemon_prices
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('ligapokemon_prices')
          .select('*')
          .eq('card_id', card.id)
          .maybeSingle();

        if (!error && data) {
          const dbPrice: LigaPokemonPrice = {
            priceMin: Number(data.price_min),
            priceAvg: Number(data.price_avg),
            priceMax: Number(data.price_max),
            cardName: card.name,
            editionName: card.set?.name || 'Promo',
            lastUpdated: data.updated_at,
            isReal: true
          };

          cache[cacheKey] = dbPrice;
          saveCache(cache);
          return dbPrice;
        }
      } catch (err) {
        console.warn("Erro ao carregar preco centralizado da Liga no Supabase:", err);
      }
    }

    // 3. FALLBACK ESTIMADO (BRL a partir do USD do TCGplayer)
    const usdPrice = precoUSD(card);

    // Sem base em dólar não há o que estimar. Devolver um número inventado aqui
    // era a origem de preços fantasma (ex.: "R$ 31,00") para cartas sem preço.
    if (usdPrice === null) return null;

    // Câmbio real (cacheado 24h) no lugar do antigo fator 6.2 hardcoded, que
    // envelhecia sozinho. O ágio de mercado da Liga (frete, importação) fica
    // separado e explícito, em vez de embutido no câmbio.
    const usdToBrl = await getUsdToBrl();
    const AGIO_MERCADO_LIGA = 1.10;
    const estimatedAvg = usdPrice * usdToBrl * AGIO_MERCADO_LIGA;

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
