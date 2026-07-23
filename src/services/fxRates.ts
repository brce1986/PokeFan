// =============================================================================
// Câmbio USD -> BRL ao vivo, com cache de 24h no localStorage.
//
// Substitui o fator 6.2 que estava hardcoded no serviço da LigaPokémon. Aquele
// número misturava câmbio com ágio de mercado e envelhecia sozinho — em três
// meses vira mentira. Aqui o câmbio é buscado de uma fonte pública gratuita e
// o ágio fica separado e explícito em quem consome.
// =============================================================================

const CACHE_KEY = 'pokefan_fx_usd_brl';
const TTL_MS = 24 * 60 * 60 * 1000;

// Último recurso quando a fonte está fora E não há cache. Aproximado de
// propósito e marcado como tal — nunca deve ser a fonte normal do valor.
const FALLBACK_USD_BRL = 5.65;

interface FxCache {
  rate: number;
  fetchedAt: number;
}

const lerCache = (): FxCache | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as FxCache) : null;
  } catch {
    return null;
  }
};

const salvarCache = (rate: number) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, fetchedAt: Date.now() }));
  } catch {
    /* localStorage cheio/indisponível — segue sem cache */
  }
};

/**
 * Retorna a cotação USD->BRL. Ordem: cache válido (24h) -> rede -> cache velho
 * -> constante de último recurso. Nunca lança: câmbio indisponível não pode
 * derrubar a exibição de preço.
 */
export const getUsdToBrl = async (): Promise<number> => {
  const cache = lerCache();
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return cache.rate;
  }

  try {
    // Fonte pública gratuita, sem chave. Se sair do ar, cai para o cache velho.
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.BRL;
      if (typeof rate === 'number' && rate > 0) {
        salvarCache(rate);
        return rate;
      }
    }
  } catch {
    /* rede fora — usa o que houver abaixo */
  }

  // Cache expirado ainda é melhor que a constante fixa.
  if (cache) return cache.rate;
  return FALLBACK_USD_BRL;
};
