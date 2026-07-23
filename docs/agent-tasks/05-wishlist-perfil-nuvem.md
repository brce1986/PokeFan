# Tarefa 05 — Wishlist e perfil no Supabase

Risco: 🟡 Médio-alto — mexe no AppContext. Leia primeiro
`docs/agent-tasks/README.md`. Brief EXAUSTIVO — faça só o listado.

## Contexto

Wishlist e perfil (nome, avatar, moeda) vivem só no `localStorage`; trocar de
aparelho perde tudo. As tabelas `wishlist_items` e `profiles` já existem no
Supabase (veja `supabase/schema.sql`). Falta o app gravar/ler delas quando há
sessão, igual já é feito com a coleção.

## GUARDRAILS — NÃO ALTERE

No `src/context/AppContext.tsx`, você **não pode** tocar em:
- `login`, `loginWithGoogle`, `loginAsGuest`, `register`, `requestPasswordReset`,
  `updatePassword`, `logout`.
- O bloco de `supabase.auth.getSession` / `onAuthStateChange` / `GUEST_FLAG_KEY`
  dentro do `useEffect` de inicialização.
- `saveCollection` e `fetchSupabaseCollection`.

Você SÓ adiciona sync de wishlist e profile. Use como MODELO a função
`saveCollection` (linha ~293) e o `fetchSupabaseCollection` (linha ~261) — mesma
estrutura: sempre localStorage, e Supabase só quando há sessão real
(`supabase && currentUser` + `supabase.auth.getUser()` retornando user). Convidado
(sem sessão) NUNCA grava na nuvem.

## Arquivo que você PODE editar

- `src/context/AppContext.tsx` — SOMENTE.

## Esquema das tabelas (só referência, já existem)

`wishlist_items`: `user_id uuid`, `card_id text`, `card_details jsonb`,
`added_at timestamptz`. PK `(user_id, card_id)`.

`profiles`: `user_id uuid` (PK), `username text`, `avatar_url text`,
`collector_rank text`, `currency text`, `updated_at timestamptz`.

## Mudanças exatas

### 1. Carregar wishlist e profile ao logar
No `useEffect` que hoje só busca a coleção (o de `fetchSupabaseCollection`,
linhas ~260-290), adicione DUAS buscas novas, DENTRO da função async, DEPOIS do
bloco da coleção, reusando o mesmo `user` já obtido via `supabase.auth.getUser()`:

- **Wishlist:** `select('*').eq('user_id', user.id)` em `wishlist_items`. Mapear
  para `WishlistItem` (`cardId: row.card_id`, `cardDetails: row.card_details`,
  `addedAt: row.added_at`), fazer `setWishlist(...)` e espelhar no localStorage
  (`localStorage.setItem('pokefan_wishlist', ...)`).
- **Profile:** `select('*').eq('user_id', user.id).maybeSingle()` em `profiles`.
  Se existir e os campos não forem vazios, aplicar: `setCurrencyState(row.currency)`
  se houver, e atualizar `currentUser` com `username`/`avatar` do profile (sem
  sobrescrever com valor vazio). NÃO chame as funções de auth — só os setters de
  estado.

### 2. `addCardToWishlist` (linha ~613)
Hoje só chama `saveWishlist`. Após isso, quando houver sessão, faça `upsert` do
item novo em `wishlist_items` (onConflict `'user_id,card_id'`):
```ts
if (supabase && currentUser) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('wishlist_items').upsert({
      user_id: user.id, card_id: card.id,
      card_details: card, added_at: new Date().toISOString()
    }, { onConflict: 'user_id,card_id' });
  }
}
```
Torne a função `async`. Engula erro com `console.error` sem quebrar a UI.

### 3. `removeCardFromWishlist` (linha ~623)
Após `saveWishlist`, quando houver sessão, `delete` em `wishlist_items`
`.eq('user_id', user.id).eq('card_id', cardId)`. Torne `async`, engula erro.

### 4. `updateProfile` (linha ~504)
Existe um comentário `TODO(T14): persistir nome e avatar...`. Substitua o TODO
por um upsert em `profiles` (onConflict `'user_id'`) com `username`,
`avatar_url: avatar`, `updated_at: new Date().toISOString()`, quando há sessão.
Torne `async`, engula erro.

### 5. `setCurrency` (linha ~564)
Após gravar no localStorage, quando há sessão, `upsert` em `profiles`
(onConflict `'user_id'`) com `currency: curr` e `updated_at`. Torne `async`,
engula erro.

## Regras

- Toda escrita na nuvem é precedida de `supabase.auth.getUser()` retornando user.
  Convidado não dispara nenhuma chamada ao Supabase.
- Comentário curto em cada bloco novo explicando o porquê.
- Se tornar funções `async`, confirme que os pontos que as chamam não quebram
  (elas não precisam ser aguardadas pela UI).

## Verificação

- `npx tsc -b --pretty false` sai 0; `npm run build` passa.
- Modo demonstração (Acesso Rápido de Teste) funciona sem erro de console e sem
  disparar chamadas ao Supabase.
- No relatório: liste cada bloco adicionado e CONFIRME que nenhuma das funções de
  auth dos guardrails foi tocada.

## Critérios de aceite (o tech lead vai checar com lupa)

- Diff só com adições de sync de wishlist/profile; zero mudança em auth/sessão.
- Convidado não grava na nuvem.
- `onConflict` correto por tabela (`user_id,card_id` e `user_id`).
- O tech lead vai testar login real: adicionar à wishlist, mudar nome/moeda,
  deslogar, logar em outro navegador e conferir que persistiu.
