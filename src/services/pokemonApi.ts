export interface TCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  rules?: string[];
  attacks?: Array<{
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }>;
  weaknesses?: Array<{ type: string; value: string }>;
  resistances?: Array<{ type: string; value: string }>;
  retreatCost?: string[];
  number: string;
  artist?: string;
  rarity?: string;
  flavorText?: string;
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices?: {
      holofoil?: { low: number; mid: number; high: number; market: number };
      normal?: { low: number; mid: number; high: number; market: number };
      reverseHolofoil?: { low: number; mid: number; high: number; market: number };
    };
  };
  set?: TCGSet;
}

export interface TCGSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
  updatedAt: string;
  images: {
    symbol: string;
    logo: string;
  };
}

const BASE_URL = 'https://api.pokemontcg.io/v2';

// Opcionalmente permite usar uma chave de API para aumentar limites de requisições
let apiKey = localStorage.getItem('pokefan_api_key') || '';

export const setApiKey = (key: string) => {
  apiKey = key;
  if (key) {
    localStorage.setItem('pokefan_api_key', key);
  } else {
    localStorage.removeItem('pokefan_api_key');
  }
};

export const getApiKey = () => apiKey;

const fetchFromAPI = async (endpoint: string) => {
  const headers: HeadersInit = {};
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, { headers });
  if (!response.ok) {
    throw new Error(`Erro na requisição da API TCG: ${response.statusText}`);
  }
  return response.json();
};

export const pokemonApi = {
  // Obter todos os conjuntos (Sets)
  getSets: async (): Promise<TCGSet[]> => {
    try {
      const result = await fetchFromAPI('/sets?orderBy=-releaseDate');
      return result.data;
    } catch (error) {
      console.error("Erro ao carregar sets da API, usando mock", error);
      return MOCK_SETS;
    }
  },

  // Obter um conjunto específico
  getSetById: async (id: string): Promise<TCGSet> => {
    const result = await fetchFromAPI(`/sets/${id}`);
    return result.data;
  },

  searchCards: async (nameQuery: string, page: number = 1, pageSize: number = 24): Promise<{ data: TCGCard[], totalCount: number }> => {
    try {
      let q = '';
      if (nameQuery.includes('/')) {
        const parts = nameQuery.split('/');
        const numAndName = parts[0].trim();
        const total = parts[1] ? parts[1].trim() : '';
        
        const numMatch = numAndName.match(/^(.*?)\s*(\d+)$/);
        if (numMatch) {
          const namePart = numMatch[1].trim();
          const numberPart = numMatch[2].trim();
          q = `q=number:"${numberPart}"`;
          if (namePart) {
            q += ` name:"*${namePart}*"`;
          }
        } else {
          q = `q=number:"${numAndName}"`;
        }
        
        if (total) {
          q += ` set.printedTotal:"${total}"`;
        }
      } else {
        q = nameQuery ? `q=name:"*${nameQuery}*"` : '';
      }

      const result = await fetchFromAPI(`/cards?${q}&page=${page}&pageSize=${pageSize}`);
      return {
        data: result.data,
        totalCount: result.totalCount
      };
    } catch (error) {
      console.error("Erro ao buscar cartas da API, usando mock filtrado", error);
      const filteredMock = MOCK_CARDS.filter(c => {
        if (nameQuery.includes('/')) {
          const parts = nameQuery.split('/');
          const numAndName = parts[0].trim();
          const numMatch = numAndName.match(/^(.*?)\s*(\d+)$/);
          const numberPart = numMatch ? numMatch[2].trim() : numAndName;
          return c.number === numberPart;
        }
        return c.name.toLowerCase().includes(nameQuery.toLowerCase());
      });
      return {
        data: filteredMock,
        totalCount: filteredMock.length
      };
    }
  },

  // Obter cartas de um set específico
  getCardsBySet: async (setId: string, page: number = 1, pageSize: number = 100): Promise<{ data: TCGCard[], totalCount: number }> => {
    try {
      const result = await fetchFromAPI(`/cards?q=set.id:${setId}&page=${page}&pageSize=${pageSize}&orderBy=number`);
      return {
        data: result.data,
        totalCount: result.totalCount
      };
    } catch (error) {
      console.error("Erro ao obter cartas do set, usando mock filtrado", error);
      const filteredMock = MOCK_CARDS.filter(c => c.id.startsWith(setId));
      return {
        data: filteredMock,
        totalCount: filteredMock.length
      };
    }
  },

  // Obter detalhes de uma única carta
  getCardById: async (id: string): Promise<TCGCard> => {
    try {
      const result = await fetchFromAPI(`/cards/${id}`);
      return result.data;
    } catch (error) {
      console.error("Erro ao obter detalhes da carta, usando mock", error);
      const card = MOCK_CARDS.find(c => c.id === id);
      if (!card) throw new Error("Carta não encontrada no mock.");
      return card;
    }
  }
};

// --- DADOS MOCKADOS COMPLETOS PARA FALLBACK ---
export const MOCK_SETS: TCGSet[] = [
  {
    id: "sv5",
    name: "Forças Temporais",
    series: "Scarlet & Violet",
    printedTotal: 162,
    total: 218,
    releaseDate: "2024/03/22",
    updatedAt: "2024-03-22T00:00:00Z",
    images: {
      symbol: "https://images.pokemontcg.io/sv5/symbol.png",
      logo: "https://images.pokemontcg.io/sv5/logo.png"
    }
  },
  {
    id: "swsh9",
    name: "Estrelas Brilhantes",
    series: "Sword & Shield",
    printedTotal: 172,
    total: 186,
    releaseDate: "2022/02/25",
    updatedAt: "2022-02-25T00:00:00Z",
    images: {
      symbol: "https://images.pokemontcg.io/swsh9/symbol.png",
      logo: "https://images.pokemontcg.io/swsh9/logo.png"
    }
  },
  {
    id: "swsh7",
    name: "Céus Evolventes",
    series: "Sword & Shield",
    printedTotal: 203,
    total: 237,
    releaseDate: "2021/08/27",
    updatedAt: "2021-08-27T00:00:00Z",
    images: {
      symbol: "https://images.pokemontcg.io/swsh7/symbol.png",
      logo: "https://images.pokemontcg.io/swsh7/logo.png"
    }
  },
  {
    id: "sv3pt5",
    name: "151",
    series: "Scarlet & Violet",
    printedTotal: 165,
    total: 207,
    releaseDate: "2023/09/22",
    updatedAt: "2023-09-22T00:00:00Z",
    images: {
      symbol: "https://images.pokemontcg.io/sv3pt5/symbol.png",
      logo: "https://images.pokemontcg.io/sv3pt5/logo.png"
    }
  }
];

export const MOCK_CARDS: TCGCard[] = [
  {
    id: "swsh9-182",
    name: "Galarian Zapdos V",
    supertype: "Pokémon",
    subtypes: ["Basic", "V"],
    hp: "200",
    types: ["Fighting"],
    rules: ["Regra V: Quando seu Pokémon V é Nocauteado, seu oponente pega 2 cartas de Prêmio."],
    attacks: [
      {
        name: "Thunderous Kick",
        cost: ["Fighting", "Colorless", "Colorless"],
        convertedEnergyCost: 3,
        damage: "170",
        text: "Antes de causar dano, descarte uma Energia Especial do Pokémon Ativo do seu oponente."
      }
    ],
    weaknesses: [{ type: "Psychic", value: "×2" }],
    retreatCost: ["Colorless"],
    number: "182",
    artist: "Akira Egawa",
    rarity: "Ultra Rare",
    images: {
      small: "https://images.pokemontcg.io/swsh9/182.png",
      large: "https://images.pokemontcg.io/swsh9/182_hires.png"
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/swsh9-182",
      updatedAt: "2026-07-22T00:00:00Z",
      prices: {
        holofoil: { low: 110.00, mid: 125.50, high: 150.00, market: 139.18 }
      }
    }
  },
  {
    id: "sv3pt5-6",
    name: "Charizard ex",
    supertype: "Pokémon",
    subtypes: ["Stage 2", "Tera", "ex"],
    hp: "330",
    types: ["Fire"],
    rules: ["Regra Tera: Enquanto este Pokémon estiver no seu Banco, previna todo o dano causado a este Pokémon por ataques.", "Regra ex: Quando seu Pokémon ex é Nocauteado, seu oponente pega 2 cartas de Prêmio."],
    attacks: [
      {
        name: "Burning Darkness",
        cost: ["Fire", "Fire"],
        convertedEnergyCost: 2,
        damage: "180+",
        text: "Este ataque causa 30 pontos de dano adicionais para cada carta de Prêmio que seu oponente pegou."
      }
    ],
    weaknesses: [{ type: "Grass", value: "×2" }],
    retreatCost: ["Colorless", "Colorless"],
    number: "6",
    artist: "5ban Graphics",
    rarity: "Double Rare",
    images: {
      small: "https://images.pokemontcg.io/sv3pt5/6.png",
      large: "https://images.pokemontcg.io/sv3pt5/6_hires.png"
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/sv3pt5-6",
      updatedAt: "2026-07-22T00:00:00Z",
      prices: {
        holofoil: { low: 75.00, mid: 82.00, high: 95.00, market: 85.50 }
      }
    }
  },
  {
    id: "swsh9-122",
    name: "Arceus V",
    supertype: "Pokémon",
    subtypes: ["Basic", "V"],
    hp: "220",
    types: ["Colorless"],
    rules: ["Regra V: Quando seu Pokémon V é Nocauteado, seu oponente pega 2 cartas de Prêmio."],
    attacks: [
      {
        name: "Trinity Charge",
        cost: ["Colorless", "Colorless"],
        convertedEnergyCost: 2,
        damage: "",
        text: "Procure no seu baralho por até 3 cartas de Energia Básica e ligue-as aos seus Pokémon V da maneira que desejar. Em seguida, embaralhe o seu baralho."
      },
      {
        name: "Power Edge",
        cost: ["Colorless", "Colorless", "Colorless"],
        convertedEnergyCost: 3,
        damage: "130",
        text: ""
      }
    ],
    weaknesses: [{ type: "Fighting", value: "×2" }],
    retreatCost: ["Colorless", "Colorless"],
    number: "122",
    artist: "N-Design Inc.",
    rarity: "Ultra Rare",
    images: {
      small: "https://images.pokemontcg.io/swsh9/122.png",
      large: "https://images.pokemontcg.io/swsh9/122_hires.png"
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/swsh9-122",
      updatedAt: "2026-07-22T00:00:00Z",
      prices: {
        holofoil: { low: 5.50, mid: 6.80, high: 8.50, market: 6.50 }
      }
    }
  },
  {
    id: "sv3pt5-9",
    name: "Blastoise ex",
    supertype: "Pokémon",
    subtypes: ["Stage 2", "ex"],
    hp: "330",
    types: ["Water"],
    rules: ["Regra ex: Quando seu Pokémon ex é Nocauteado, seu oponente pega 2 cartas de Prêmio."],
    attacks: [
      {
        name: "Twin Cannons",
        cost: ["Water", "Water"],
        convertedEnergyCost: 2,
        damage: "140×",
        text: "Descarte até 2 cartas de Energia de Água Básica da sua mão. Este ataque causa 140 pontos de dano para cada carta descartada desta forma."
      }
    ],
    weaknesses: [{ type: "Lightning", value: "×2" }],
    retreatCost: ["Colorless", "Colorless", "Colorless"],
    number: "9",
    artist: "Mitsuhiro Arita",
    rarity: "Double Rare",
    images: {
      small: "https://images.pokemontcg.io/sv3pt5/9.png",
      large: "https://images.pokemontcg.io/sv3pt5/9_hires.png"
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/sv3pt5-9",
      updatedAt: "2026-07-22T00:00:00Z",
      prices: {
        holofoil: { low: 35.00, mid: 40.50, high: 49.00, market: 42.20 }
      }
    }
  },
  {
    id: "sv5-10",
    name: "Turtwig",
    supertype: "Pokémon",
    subtypes: ["Basic"],
    hp: "80",
    types: ["Grass"],
    number: "10",
    rarity: "Common",
    images: {
      small: "https://images.pokemontcg.io/sv5/10.png",
      large: "https://images.pokemontcg.io/sv5/10_hires.png"
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/sv5-10",
      updatedAt: "2026-07-22T00:00:00Z",
      prices: {
        normal: { low: 0.10, mid: 0.25, high: 0.50, market: 0.15 }
      }
    }
  },
  {
    id: "sv5-17",
    name: "Sawsbuck",
    supertype: "Pokémon",
    subtypes: ["Stage 1"],
    hp: "120",
    types: ["Grass"],
    number: "17",
    rarity: "Uncommon",
    images: {
      small: "https://images.pokemontcg.io/sv5/17.png",
      large: "https://images.pokemontcg.io/sv5/17_hires.png"
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/sv5-17",
      updatedAt: "2026-07-22T00:00:00Z",
      prices: {
        normal: { low: 0.15, mid: 0.35, high: 0.75, market: 0.25 }
      }
    }
  },
  {
    id: "sv5-12",
    name: "Deerling",
    supertype: "Pokémon",
    subtypes: ["Basic"],
    hp: "70",
    types: ["Grass"],
    number: "12",
    rarity: "Common",
    images: {
      small: "https://images.pokemontcg.io/sv5/12.png",
      large: "https://images.pokemontcg.io/sv5/12_hires.png"
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/sv5-12",
      updatedAt: "2026-07-22T00:00:00Z",
      prices: {
        normal: { low: 0.05, mid: 0.15, high: 0.30, market: 0.10 }
      }
    }
  },
  {
    id: "sv5-81",
    name: "Iron Crown ex",
    supertype: "Pokémon",
    subtypes: ["Basic", "Future", "ex"],
    hp: "220",
    types: ["Psychic"],
    rules: ["Regra ex: Quando seu Pokémon ex é Nocauteado, seu oponente pega 2 cartas de Prêmio."],
    attacks: [
      {
        name: "Twin Shotel",
        cost: ["Psychic", "Colorless", "Colorless"],
        convertedEnergyCost: 3,
        damage: "",
        text: "Este ataque causa 50 pontos de dano a 2 dos Pokémon do seu oponente. Este ataque não é afetado por Fraqueza, Resistência ou quaisquer efeitos nos Pokémon do oponente."
      }
    ],
    weaknesses: [{ type: "Darkness", value: "×2" }],
    retreatCost: ["Colorless", "Colorless"],
    number: "81",
    rarity: "Double Rare",
    images: {
      small: "https://images.pokemontcg.io/sv5/81.png",
      large: "https://images.pokemontcg.io/sv5/81_hires.png"
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/sv5-81",
      updatedAt: "2026-07-22T00:00:00Z",
      prices: {
        holofoil: { low: 10.00, mid: 12.50, high: 18.00, market: 11.50 }
      }
    }
  },
  {
    id: "sv5-60",
    name: "Gengar ex",
    supertype: "Pokémon",
    subtypes: ["Stage 2", "ex"],
    hp: "310",
    types: ["Darkness"],
    rules: ["Regra ex: Quando seu Pokémon ex é Nocauteado, seu oponente pega 2 cartas de Prêmio."],
    attacks: [
      {
        name: "Corrosive Curse",
        cost: ["Darkness", "Colorless"],
        convertedEnergyCost: 2,
        damage: "110",
        text: "Durante o próximo turno do oponente, coloque 2 contadores de dano no Pokémon Ativo do oponente sempre que ele anexar uma Energia da mão."
      }
    ],
    weaknesses: [{ type: "Fighting", value: "×2" }],
    retreatCost: ["Colorless", "Colorless"],
    number: "60",
    rarity: "Double Rare",
    images: {
      small: "https://images.pokemontcg.io/sv5/60.png",
      large: "https://images.pokemontcg.io/sv5/60_hires.png"
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/sv5-60",
      updatedAt: "2026-07-22T00:00:00Z",
      prices: {
        holofoil: { low: 15.00, mid: 18.20, high: 25.00, market: 19.80 }
      }
    }
  },
  {
    id: "sv5-120",
    name: "Cinccino",
    supertype: "Pokémon",
    subtypes: ["Stage 1"],
    hp: "110",
    types: ["Colorless"],
    attacks: [
      {
        name: "Special Roll",
        cost: ["Colorless", "Colorless"],
        convertedEnergyCost: 2,
        damage: "70×",
        text: "Este ataque causa 70 pontos de dano para cada Energia Especial ligada a este Pokémon."
      }
    ],
    weaknesses: [{ type: "Fighting", value: "×2" }],
    retreatCost: ["Colorless"],
    number: "120",
    rarity: "Special Illustration Rare",
    images: {
      small: "https://images.pokemontcg.io/sv5/120.png",
      large: "https://images.pokemontcg.io/sv5/120_hires.png"
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/sv5-120",
      updatedAt: "2026-07-22T00:00:00Z",
      prices: {
        holofoil: { low: 2.00, mid: 2.80, high: 4.50, market: 3.10 }
      }
    }
  },
  {
    id: "sv5-133",
    name: "Koraidon ex",
    supertype: "Pokémon",
    subtypes: ["Basic", "Ancient", "ex"],
    hp: "230",
    types: ["Fighting"],
    rules: ["Regra ex: Quando seu Pokémon ex é Nocauteado, seu oponente pega 2 cartas de Prêmio."],
    attacks: [
      {
        name: "Kaiser Tackle",
        cost: ["Fighting", "Fighting", "Colorless"],
        convertedEnergyCost: 3,
        damage: "280",
        text: "Este Pokémon causa 60 pontos de dano a si mesmo."
      }
    ],
    weaknesses: [{ type: "Psychic", value: "×2" }],
    retreatCost: ["Colorless", "Colorless", "Colorless"],
    number: "133",
    rarity: "Double Rare",
    images: {
      small: "https://images.pokemontcg.io/sv5/133.png",
      large: "https://images.pokemontcg.io/sv5/133_hires.png"
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/sv5-133",
      updatedAt: "2026-07-22T00:00:00Z",
      prices: {
        holofoil: { low: 5.00, mid: 6.80, high: 9.50, market: 6.45 }
      }
    }
  }
];
