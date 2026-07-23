import React, { createContext, useContext, useState, useEffect } from 'react';
import { type TCGCard, MOCK_CARDS } from '../services/pokemonApi';
import { supabase } from '../services/supabaseClient';

export interface CollectionItem {
  id: string; // Unique local identifier (cardId + '-' + condition + '-' + variant)
  cardId: string;
  quantity: number;
  condition: 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
  variant: 'normal' | 'holo' | 'reverse';
  addedAt: string;
  cardDetails: TCGCard;
}

export interface WishlistItem {
  cardId: string;
  cardDetails: TCGCard;
  addedAt: string;
}

export interface User {
  username: string;
  email: string;
  avatar: string;
  collectorRank: string;
}

export type CurrencyType = 'USD' | 'EUR' | 'JPY' | 'BRL';

export interface NotificationSettings {
  priceAlerts: boolean;
  newSets: boolean;
  weeklyDigest: boolean;
}

interface AppContextType {
  currentUser: User | null;
  usersList: User[];
  collection: CollectionItem[];
  wishlist: WishlistItem[];
  currency: CurrencyType;
  notifications: NotificationSettings;
  activeTab: 'dashboard' | 'collection' | 'scan' | 'search' | 'profile' | 'trade';
  selectedCardId: string | null;
  selectedSetId: string | null;
  apiKey: string;
  login: (email: string, password: string) => boolean | Promise<boolean>;
  register: (username: string, email: string, password: string, avatar: string) => boolean | Promise<boolean>;
  logout: () => void;
  updateProfile: (username: string, avatar: string) => void;
  addCardToCollection: (card: TCGCard, quantity: number, condition: CollectionItem['condition'], variant: CollectionItem['variant']) => void;
  removeCardFromCollection: (id: string) => void;
  updateCardQty: (id: string, newQty: number) => void;
  setCurrency: (currency: CurrencyType) => void;
  setNotifications: (settings: NotificationSettings) => void;
  setActiveTab: (tab: AppContextType['activeTab']) => void;
  setSelectedCardId: (id: string | null) => void;
  setSelectedSetId: (id: string | null) => void;
  setApiKey: (key: string) => void;
  exportCollection: () => string;
  importCollection: (jsonStr: string) => boolean;
  resetCollection: () => void;
  addCardToWishlist: (card: TCGCard) => void;
  removeCardFromWishlist: (cardId: string) => void;
  isInWishlist: (cardId: string) => boolean;
  formatPrice: (usdPrice: number) => string;
  getCurrencySymbol: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Taxas de conversão baseadas em USD
const CURRENCY_CONVERSION: Record<CurrencyType, number> = {
  USD: 1.0,
  EUR: 0.92,
  JPY: 155.0,
  BRL: 5.65
};

const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  BRL: 'R$'
};

const DEFAULT_AVATARS = [
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z'/></svg>"
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [currency, setCurrencyState] = useState<CurrencyType>('BRL');
  const [notifications, setNotificationsState] = useState<NotificationSettings>({
    priceAlerts: true,
    newSets: true,
    weeklyDigest: false
  });
  const [activeTab, setActiveTabState] = useState<AppContextType['activeTab']>('dashboard');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [apiKey, setApiKeyState] = useState<string>('');

  // Carregar dados iniciais do LocalStorage e sincronizar Supabase se ativo
  useEffect(() => {
    const storedUsers = localStorage.getItem('pokefan_users');
    const storedActiveUser = localStorage.getItem('pokefan_active_user');
    const storedCollection = localStorage.getItem('pokefan_collection');
    const storedCurrency = localStorage.getItem('pokefan_currency');
    const storedNotifications = localStorage.getItem('pokefan_notifications');
    const storedApiKey = localStorage.getItem('pokefan_api_key');

    if (storedUsers) setUsersList(JSON.parse(storedUsers));
    if (storedActiveUser) setCurrentUser(JSON.parse(storedActiveUser));
    if (storedCurrency) setCurrencyState(storedCurrency as CurrencyType);
    if (storedNotifications) setNotificationsState(JSON.parse(storedNotifications));
    if (storedApiKey) setApiKeyState(storedApiKey);

    // Se Supabase estiver ativado, obter sessão de auth ativa
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const sUser: User = {
            username: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'Treinador',
            email: session.user.email || '',
            avatar: session.user.user_metadata.avatar || DEFAULT_AVATARS[0],
            collectorRank: 'Mestre da Nuvem'
          };
          setCurrentUser(sUser);
          localStorage.setItem('pokefan_active_user', JSON.stringify(sUser));
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const sUser: User = {
            username: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'Treinador',
            email: session.user.email || '',
            avatar: session.user.user_metadata.avatar || DEFAULT_AVATARS[0],
            collectorRank: 'Mestre da Nuvem'
          };
          setCurrentUser(sUser);
          localStorage.setItem('pokefan_active_user', JSON.stringify(sUser));
        } else {
          setCurrentUser(null);
          localStorage.removeItem('pokefan_active_user');
        }
      });

      return () => subscription.unsubscribe();
    }

    // Inicializar coleção com mock se estiver vazia
    if (storedCollection) {
      setCollection(JSON.parse(storedCollection));
    } else {
      // Pré-popular coleção com itens interessantes para o painel inicial
      const initialCollection: CollectionItem[] = [
        {
          id: "swsh9-182-NM-holo",
          cardId: "swsh9-182",
          quantity: 1,
          condition: "NM",
          variant: "holo",
          addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
          cardDetails: MOCK_CARDS[0] // Galarian Zapdos V
        },
        {
          id: "sv3pt5-6-NM-holo",
          cardId: "sv3pt5-6",
          quantity: 2, // Duplicata para aparecer na pasta de trocas!
          condition: "NM",
          variant: "holo",
          addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Ontem
          cardDetails: MOCK_CARDS[1] // Charizard ex
        },
        {
          id: "swsh9-122-LP-normal",
          cardId: "swsh9-122",
          quantity: 1,
          condition: "LP",
          variant: "normal",
          addedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 dias atrás
          cardDetails: MOCK_CARDS[2] // Arceus V
        }
      ];
      setCollection(initialCollection);
      localStorage.setItem('pokefan_collection', JSON.stringify(initialCollection));
    }

    const storedWishlist = localStorage.getItem('pokefan_wishlist');
    if (storedWishlist) {
      setWishlist(JSON.parse(storedWishlist));
    }
  }, []);

  // Efeito secundário para carregar coleção do Supabase quando o usuário logar
  useEffect(() => {
    const fetchSupabaseCollection = async () => {
      if (!supabase || !currentUser) return;

      // Filtro explícito por dono. A RLS já garante isso no banco; o .eq aqui
      // é defesa em profundidade caso alguma policy saia do ar.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('collection_items')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        const formatted: CollectionItem[] = data.map((item: any) => ({
          id: item.id,
          cardId: item.card_id,
          quantity: item.quantity,
          condition: item.condition,
          variant: item.variant,
          addedAt: item.added_at,
          cardDetails: item.card_details
        }));
        setCollection(formatted);
        localStorage.setItem('pokefan_collection', JSON.stringify(formatted));
      }
    };

    fetchSupabaseCollection();
  }, [currentUser]);

  // Persistir alterações da coleção (Local + Cloud)
  const saveCollection = async (newColl: CollectionItem[]) => {
    setCollection(newColl);
    localStorage.setItem('pokefan_collection', JSON.stringify(newColl));

    if (supabase && currentUser) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Upsert em lote: uma requisição, não uma por carta.
          // onConflict precisa citar a PK composta (user_id, id) porque o `id`
          // montado no client não é único entre usuários diferentes.
          if (newColl.length > 0) {
            await supabase
              .from('collection_items')
              .upsert(
                newColl.map(item => ({
                  id: item.id,
                  user_id: user.id,
                  card_id: item.cardId,
                  quantity: item.quantity,
                  condition: item.condition,
                  variant: item.variant,
                  added_at: item.addedAt,
                  card_details: item.cardDetails
                })),
                { onConflict: 'user_id,id' }
              );
          }
          
          // Limpar itens que foram excluídos localmente
          const currentIds = newColl.map(item => item.id);
          const { data: dbItems } = await supabase
            .from('collection_items')
            .select('id')
            .eq('user_id', user.id);
            
          if (dbItems) {
            const idsToDelete = dbItems.map((d: any) => d.id).filter((id: string) => !currentIds.includes(id));
            if (idsToDelete.length > 0) {
              await supabase
                .from('collection_items')
                .delete()
                .in('id', idsToDelete);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao sincronizar com Supabase:', err);
      }
    }
  };

  // Funções de Autenticação (Local + Supabase)
  const login = async (email: string, password: string): Promise<boolean> => {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          const loggedUser: User = {
            username: data.user.user_metadata.username || email.split('@')[0],
            email: data.user.email || '',
            avatar: data.user.user_metadata.avatar || DEFAULT_AVATARS[0],
            collectorRank: "Mestre da Nuvem"
          };
          setCurrentUser(loggedUser);
          localStorage.setItem('pokefan_active_user', JSON.stringify(loggedUser));
          return true;
        }
      } catch (err) {
        console.error('Supabase Auth falhou, tentando local:', err);
      }
    }

    // Simulação simples com localStorage
    const storedUsersJson = localStorage.getItem('pokefan_accounts') || '[]';
    const accounts = JSON.parse(storedUsersJson);
    
    // Conta padrão se não houver nenhuma
    if (accounts.length === 0 && email === 'alex.trainer@pokevault.app' && password === '123456') {
      const defaultUser: User = {
        username: "Trainer Alex",
        email: "alex.trainer@pokevault.app",
        avatar: DEFAULT_AVATARS[0],
        collectorRank: "Treinador Mestre"
      };
      setCurrentUser(defaultUser);
      localStorage.setItem('pokefan_active_user', JSON.stringify(defaultUser));
      return true;
    }

    const found = accounts.find((acc: any) => acc.email === email && acc.password === password);
    if (found) {
      const loggedUser: User = {
        username: found.username,
        email: found.email,
        avatar: found.avatar || DEFAULT_AVATARS[0],
        collectorRank: "Colecionador Novato"
      };
      setCurrentUser(loggedUser);
      localStorage.setItem('pokefan_active_user', JSON.stringify(loggedUser));
      return true;
    }
    
    // Fallback para facilitar testes rápidos com a conta padrão
    if (email === 'alex.trainer@pokevault.app' || email === 'admin@admin.com') {
      const devUser: User = {
        username: "Trainer Alex",
        email: email,
        avatar: DEFAULT_AVATARS[0],
        collectorRank: "Treinador Master"
      };
      setCurrentUser(devUser);
      localStorage.setItem('pokefan_active_user', JSON.stringify(devUser));
      return true;
    }

    return false;
  };

  const register = async (username: string, email: string, password: string, avatar: string): Promise<boolean> => {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              avatar
            }
          }
        });
        if (!error && data.user) {
          const newUser: User = {
            username,
            email,
            avatar: avatar || DEFAULT_AVATARS[0],
            collectorRank: "Treinador da Nuvem"
          };
          setCurrentUser(newUser);
          localStorage.setItem('pokefan_active_user', JSON.stringify(newUser));
          return true;
        }
      } catch (err) {
        console.error('Supabase Register falhou, tentando local:', err);
      }
    }

    const storedUsersJson = localStorage.getItem('pokefan_accounts') || '[]';
    const accounts = JSON.parse(storedUsersJson);

    if (accounts.some((acc: any) => acc.email === email)) {
      return false; // Email já existe
    }

    const newAccount = { username, email, password, avatar };
    accounts.push(newAccount);
    localStorage.setItem('pokefan_accounts', JSON.stringify(accounts));

    const newUser: User = {
      username,
      email,
      avatar: avatar || DEFAULT_AVATARS[0],
      collectorRank: "Iniciante Pokédex"
    };
    setCurrentUser(newUser);
    localStorage.setItem('pokefan_active_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    if (supabase) {
      supabase.auth.signOut().catch(err => console.error(err));
    }
    setCurrentUser(null);
    localStorage.removeItem('pokefan_active_user');
    setActiveTabState('dashboard');
  };

  const updateProfile = (username: string, avatar: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, username, avatar };
    setCurrentUser(updated);
    localStorage.setItem('pokefan_active_user', JSON.stringify(updated));

    // Atualizar no cadastro geral também
    const storedUsersJson = localStorage.getItem('pokefan_accounts') || '[]';
    const accounts = JSON.parse(storedUsersJson);
    const index = accounts.findIndex((acc: any) => acc.email === currentUser.email);
    if (index !== -1) {
      accounts[index].username = username;
      accounts[index].avatar = avatar;
      localStorage.setItem('pokefan_accounts', JSON.stringify(accounts));
    }
  };

  // Coleção - Adicionar Carta
  const addCardToCollection = (
    card: TCGCard, 
    quantity: number, 
    condition: CollectionItem['condition'], 
    variant: CollectionItem['variant']
  ) => {
    const itemId = `${card.id}-${condition}-${variant}`;
    const existingIndex = collection.findIndex(item => item.id === itemId);

    if (existingIndex !== -1) {
      const updated = [...collection];
      updated[existingIndex].quantity += quantity;
      saveCollection(updated);
    } else {
      const newItem: CollectionItem = {
        id: itemId,
        cardId: card.id,
        quantity,
        condition,
        variant,
        addedAt: new Date().toISOString(),
        cardDetails: card
      };
      saveCollection([newItem, ...collection]);
    }
  };

  // Coleção - Remover
  const removeCardFromCollection = (id: string) => {
    const updated = collection.filter(item => item.id !== id);
    saveCollection(updated);
  };

  // Coleção - Atualizar quantidade
  const updateCardQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeCardFromCollection(id);
      return;
    }
    const updated = collection.map(item => {
      if (item.id === id) {
        return { ...item, quantity: newQty };
      }
      return item;
    });
    saveCollection(updated);
  };

  // Configurações e Preferências
  const setCurrency = (curr: CurrencyType) => {
    setCurrencyState(curr);
    localStorage.setItem('pokefan_currency', curr);
  };

  const setNotifications = (settings: NotificationSettings) => {
    setNotificationsState(settings);
    localStorage.setItem('pokefan_notifications', JSON.stringify(settings));
  };

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    if (key) {
      localStorage.setItem('pokefan_api_key', key);
    } else {
      localStorage.removeItem('pokefan_api_key');
    }
  };

  const exportCollection = () => {
    return JSON.stringify(collection, null, 2);
  };

  const importCollection = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        // Validação básica do formato
        const isValid = parsed.every(item => item.cardId && item.quantity && item.condition && item.variant && item.cardDetails);
        if (isValid) {
          saveCollection(parsed);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  const resetCollection = () => {
    saveCollection([]);
  };

  const saveWishlist = (newWishlist: WishlistItem[]) => {
    setWishlist(newWishlist);
    localStorage.setItem('pokefan_wishlist', JSON.stringify(newWishlist));
  };

  const addCardToWishlist = (card: TCGCard) => {
    if (wishlist.some(item => item.cardId === card.id)) return;
    const newItem: WishlistItem = {
      cardId: card.id,
      cardDetails: card,
      addedAt: new Date().toISOString()
    };
    saveWishlist([newItem, ...wishlist]);
  };

  const removeCardFromWishlist = (cardId: string) => {
    const updated = wishlist.filter(item => item.cardId !== cardId);
    saveWishlist(updated);
  };

  const isInWishlist = (cardId: string) => {
    return wishlist.some(item => item.cardId === cardId);
  };

  // Formatação de Valores Monetários
  const formatPrice = (usdPrice: number): string => {
    const converted = usdPrice * CURRENCY_CONVERSION[currency];
    const symbol = CURRENCY_SYMBOLS[currency];
    
    // Configuração de local para exibição bonita
    let locale = 'en-US';
    if (currency === 'BRL') locale = 'pt-BR';
    else if (currency === 'EUR') locale = 'de-DE';
    else if (currency === 'JPY') locale = 'ja-JP';

    const formattedVal = new Intl.NumberFormat(locale, {
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(converted);

    return `${symbol} ${formattedVal}`;
  };

  const getCurrencySymbol = (): string => {
    return CURRENCY_SYMBOLS[currency];
  };

  const setActiveTab = (tab: AppContextType['activeTab']) => {
    // Ao trocar de aba, limpamos seleções de detalhe para redefinir o fluxo
    if (tab !== 'search') setSelectedCardId(null);
    if (tab !== 'collection') setSelectedSetId(null);
    setActiveTabState(tab);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        usersList,
        collection,
        wishlist,
        currency,
        notifications,
        activeTab,
        selectedCardId,
        selectedSetId,
        apiKey,
        login,
        register,
        logout,
        updateProfile,
        addCardToCollection,
        removeCardFromCollection,
        updateCardQty,
        addCardToWishlist,
        removeCardFromWishlist,
        isInWishlist,
        setCurrency,
        setNotifications,
        setActiveTab,
        setSelectedCardId,
        setSelectedSetId,
        setApiKey,
        exportCollection,
        importCollection,
        resetCollection,
        formatPrice,
        getCurrencySymbol
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser usado com AppProvider');
  return context;
};
export { DEFAULT_AVATARS };
