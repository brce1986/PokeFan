import { supabase } from './supabaseClient';
import type { TCGCard, TCGSet } from './pokemonApi';

// =============================================================================
// Busca de cartas contra o catálogo local (tabela public.cards_catalog no
// Supabase), no lugar da API pública instável.
//
// Devolve TCGCard PARCIAL — id, nome, número, raridade, set e miniatura, que é
// tudo que a grade de resultados precisa. Ataques e preço não moram aqui: o
// detalhe completo é buscado por id na API só quando a carta é aberta.
//
// Se o Supabase não estiver configurado, ou a tabela ainda estiver vazia,
// `disponivel()` devolve false e quem chama cai para o fluxo antigo da API.
// Isso deixa a migração acontecer sem quebrar nada no meio.
// =============================================================================

/** Converte uma linha do catálogo no TCGCard parcial que a UI já consome. */
const linhaParaCard = (row: any): TCGCard => {
  const set: TCGSet | undefined = row.set_id
    ? ({
        id: row.set_id,
        name: row.set_name || 'Promo',
        series: row.set_series || '',
        printedTotal: row.printed_total || 0,
        total: row.printed_total || 0,
        releaseDate: row.release_date || '',
        updatedAt: '',
        images: { symbol: '', logo: '' }
      } as TCGSet)
    : undefined;

  return {
    id: row.id,
    name: row.name,
    supertype: row.supertype || '',
    number: row.number || '',
    rarity: row.rarity || undefined,
    images: { small: row.image_small || '', large: row.image_large || row.image_small || '' },
    set
  };
};

/**
 * Interpreta busca por código impresso, ex: "121/88" ou "6/151".
 * Devolve null quando o texto não é um código — aí a busca é por nome.
 */
const parseCodigo = (texto: string): { number: string; printedTotal: number | null } | null => {
  if (!texto.includes('/')) return null;
  const [esq, dir] = texto.split('/').map(p => p.trim());

  // Com espaço, o número é o último token ("Pikachu 121" → "121"). Sem espaço,
  // o lado esquerdo inteiro é o número — preservando prefixos coladinhos como
  // "TG12", "SV107" ou "H12", que fazem parte da numeração impressa.
  const number = (esq.includes(' ') ? esq.split(/\s+/).pop()! : esq).trim();
  if (!number || !/\d/.test(number)) return null;

  const printedTotal = dir && /^\d+$/.test(dir) ? parseInt(dir, 10) : null;
  return { number, printedTotal };
};

let catalogoTemDados: boolean | null = null;

export const catalogApi = {
  /**
   * Há catálogo local utilizável? Cacheado após a primeira checagem.
   * `force` refaz a checagem (usado em telas de administração/diagnóstico).
   */
  disponivel: async (force = false): Promise<boolean> => {
    if (!supabase) return false;
    if (catalogoTemDados !== null && !force) return catalogoTemDados;
    const { count, error } = await supabase
      .from('cards_catalog')
      .select('id', { count: 'exact', head: true });
    catalogoTemDados = !error && (count ?? 0) > 0;
    return catalogoTemDados;
  },

  /** Busca por nome ou por código impresso. Espelha a assinatura de pokemonApi.searchCards. */
  searchCards: async (
    query: string,
    page = 1,
    pageSize = 24
  ): Promise<{ data: TCGCard[]; totalCount: number }> => {
    if (!supabase) return { data: [], totalCount: 0 };

    const de = (page - 1) * pageSize;
    const ate = de + pageSize - 1;

    let consulta = supabase
      .from('cards_catalog')
      .select('*', { count: 'exact' });

    const codigo = parseCodigo(query);
    if (codigo) {
      consulta = consulta.eq('number', codigo.number);
      if (codigo.printedTotal !== null) {
        consulta = consulta.eq('printed_total', codigo.printedTotal);
      }
      consulta = consulta.order('release_date', { ascending: false, nullsFirst: false });
    } else {
      const termo = query.trim();
      if (termo) {
        // % vira curinga no ILIKE; escapamos os que o usuário digitou para não
        // virarem coringas acidentais.
        const seguro = termo.replace(/[%_]/g, m => `\\${m}`);
        consulta = consulta.ilike('name', `%${seguro}%`);
      }
      consulta = consulta
        .order('release_date', { ascending: false, nullsFirst: false })
        .order('number', { ascending: true });
    }

    const { data, error, count } = await consulta.range(de, ate);
    if (error) throw new Error(`Busca no catálogo falhou: ${error.message}`);

    return { data: (data || []).map(linhaParaCard), totalCount: count ?? 0 };
  },

  /** Lista as cartas de um set, ordenadas por número. */
  getCardsBySet: async (
    setId: string,
    page = 1,
    pageSize = 100
  ): Promise<{ data: TCGCard[]; totalCount: number }> => {
    if (!supabase) return { data: [], totalCount: 0 };
    const de = (page - 1) * pageSize;
    const { data, error, count } = await supabase
      .from('cards_catalog')
      .select('*', { count: 'exact' })
      .eq('set_id', setId)
      .order('number', { ascending: true })
      .range(de, de + pageSize - 1);
    if (error) throw new Error(`Listagem do set falhou: ${error.message}`);
    return { data: (data || []).map(linhaParaCard), totalCount: count ?? 0 };
  }
};
