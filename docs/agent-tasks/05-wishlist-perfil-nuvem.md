# Tarefa 05 — Wishlist e perfil no Supabase

Risco: 🟡 Médio-alto — mexe no AppContext. Leia primeiro
`docs/agent-tasks/README.md` e RESPEITE os guardrails abaixo à risca.

## Contexto

Hoje a lista de desejos (wishlist) e os dados de perfil (nome, avatar, moeda)
vivem só no `localStorage`. Se o usuário troca de aparelho, perde tudo. As
tabelas já existem no Supabase (`wishlist_items` e `profiles`, criadas na
migration inicial) — falta o app gravar e ler delas quando há sessão, igual já
é feito com a coleção.

## GUARDRAILS — leia antes de tocar em qualquer coisa

O `src/context/AppContext.tsx` contém correções de segurança e de sessão
delicadas, feitas recentemente. Você **NÃO PODE** alterar:

- Nenhuma função de autenticação: `login`, `loginWithGoogle`, `loginAsGuest`,
  `register`, `requestPasswordReset`, `updatePassword`, `logout`.
- O `useEffect` de inicialização, na parte que trata `supabase.auth.getSession`,
  `onAuthStateChange`, o `GUEST_FLAG_KEY` e a ordem de leitura do localStorage.
- A função `saveCollection` e o fluxo de `collection_items`.

Você SÓ adiciona persistência para wishlist e profile, **espelhando o padrão que
já existe** para a coleção. Se precisar entender o padrão, LEIA `saveCollection`
e o `useEffect` que faz `fetchSupabaseCollection` — copie a mesma estrutura
(gravar no localStorage sempre, e no Supabase quando `supabase && currentUser` e
há sessão via `supabase.auth.getUser()`).

## Arquivos que você PODE editar

- `src/context/AppContext.tsx` — SÓ para adicionar sync de wishlist e profile,
  respeitando os guardrails acima.

Não edite componentes nem serviços. Não crie tabelas (já existem).

## Esquema das tabelas (já existentes — só para referência)

`wishlist_items`: `user_id uuid`, `card_id text`, `card_details jsonb`,
`added_at timestamptz`. PK composta `(user_id, card_id)`.

`profiles`: `user_id uuid` (PK), `username text`, `avatar_url text`,
`collector_rank text`, `currency text`, `updated_at timestamptz`.

(Se quiser confirmar, o SQL está em `supabase/schema.sql`.)

## O que fazer

### Wishlist
1. Ao logar (dentro do fluxo que já busca a coleção), buscar também
   `wishlist_items` do usuário (`.eq('user_id', user.id)`) e popular o estado
   `wishlist`, gravando espelho no localStorage.
2. Em `addCardToWishlist` e `removeCardFromWishlist`: além do localStorage já
   existente, quando `supabase && currentUser` e há sessão, fazer `upsert`
   (onConflict `'user_id,card_id'`) na inclusão e `delete` na remoção. Engula
   erros de rede com `console.error` sem quebrar a UI (mesmo padrão da coleção).

### Profile
3. Em `updateProfile` e em `setCurrency`: quando há sessão, fazer `upsert` em
   `profiles` (onConflict `'user_id'`) com os campos disponíveis
   (`username`, `avatar_url`, `currency`, `collector_rank`, `updated_at: now`).
4. Ao logar, buscar o `profiles` do usuário e, se existir, aplicar
   `username`/`avatar`/`currency` ao estado (sem sobrescrever com vazio).

### Regras
- Modo demonstração (convidado, sem sessão) continua SÓ localStorage — nunca
  grava na nuvem. Verifique que há sessão real antes de qualquer chamada ao
  Supabase (`supabase.auth.getUser()` retornando user), igual a coleção faz.
- Comentário curto em cada bloco novo explicando o porquê.

## Verificação

- `npx tsc -b --pretty false` sai 0; `npm run build` passa.
- Modo demonstração continua funcionando sem erro de console (não tenta gravar
  na nuvem).
- No relatório, descreva exatamente quais blocos você adicionou e confirme que
  NÃO tocou em nenhuma das funções de auth listadas nos guardrails.

## Critérios de aceite (o tech lead vai checar com atenção)

- Diff limitado a adições de sync de wishlist/profile. Zero mudança nas funções
  de auth e no fluxo de sessão.
- Convidado não dispara escrita na nuvem.
- upsert usa o `onConflict` correto de cada tabela.
- O tech lead vai testar login real + wishlist/perfil persistindo entre sessões.
