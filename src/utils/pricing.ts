import type { TCGCard } from '../services/pokemonApi';

/**
 * Fonte única de preço de carta.
 *
 * Antes, cada tela resolvia o preço por conta própria e caía num valor
 * inventado quando não achava nada — `10.00` em quatro arquivos, `5.00` no
 * serviço da Liga. Como a ordem de tentativa variava entre as telas, a MESMA
 * carta aparecia por R$ 56,50 no painel e R$ 36,73 na coleção.
 *
 * A regra aqui é simples: preço desconhecido devolve `null`, nunca um número
 * plausível. Cabe à interface mostrar "sem preço" em vez de mentir.
 */

export type VarianteCarta = 'normal' | 'holo' | 'reverse';

/** Chave usada pelo TCGplayer para cada variante do app. */
const CHAVE_TCG: Record<VarianteCarta, 'normal' | 'holofoil' | 'reverseHolofoil'> = {
  normal: 'normal',
  holo: 'holofoil',
  reverse: 'reverseHolofoil'
};

/** Ordem de tentativa quando a variante pedida não tem preço publicado. */
const ORDEM_ALTERNATIVA = ['holofoil', 'normal', 'reverseHolofoil'] as const;

export interface PrecoResolvido {
  /** Valor de mercado em dólar, ou null quando não há preço publicado. */
  usd: number | null;
  /** Qual variante forneceu o número. Null quando não há preço. */
  origem: 'holofoil' | 'normal' | 'reverseHolofoil' | null;
  /** true quando o preço veio de uma variante diferente da pedida. */
  aproximado: boolean;
}

/**
 * Resolve o preço de mercado de uma carta em dólar.
 * Tenta a variante pedida e, se ela não tiver preço, cai para as demais —
 * marcando o resultado como aproximado para a interface poder sinalizar.
 */
export const resolverPrecoUSD = (
  card: TCGCard | undefined | null,
  variante?: VarianteCarta
): PrecoResolvido => {
  const precos = card?.tcgplayer?.prices;
  if (!precos) return { usd: null, origem: null, aproximado: false };

  if (variante) {
    const chave = CHAVE_TCG[variante];
    const exato = precos[chave]?.market;
    if (typeof exato === 'number' && exato > 0) {
      return { usd: exato, origem: chave, aproximado: false };
    }
  }

  for (const chave of ORDEM_ALTERNATIVA) {
    const valor = precos[chave]?.market;
    if (typeof valor === 'number' && valor > 0) {
      return { usd: valor, origem: chave, aproximado: Boolean(variante) };
    }
  }

  return { usd: null, origem: null, aproximado: false };
};

/** Atalho para quando só o número interessa. Devolve null se não houver preço. */
export const precoUSD = (
  card: TCGCard | undefined | null,
  variante?: VarianteCarta
): number | null => resolverPrecoUSD(card, variante).usd;

/**
 * Soma o valor de mercado de uma lista de itens de coleção.
 * Itens sem preço publicado são ignorados na soma — e contados à parte, para a
 * interface poder dizer "3 cartas sem preço" em vez de fingir um total exato.
 */
export const somarValorColecao = <
  T extends { cardDetails: TCGCard; quantity: number; variant: VarianteCarta }
>(itens: T[]): { totalUSD: number; itensSemPreco: number } => {
  let totalUSD = 0;
  let itensSemPreco = 0;

  for (const item of itens) {
    const valor = precoUSD(item.cardDetails, item.variant);
    if (valor === null) {
      itensSemPreco += 1;
      continue;
    }
    totalUSD += valor * item.quantity;
  }

  return { totalUSD, itensSemPreco };
};

/** Texto exibido onde não existe preço publicado. */
export const SEM_PRECO = 'Sem preço';
