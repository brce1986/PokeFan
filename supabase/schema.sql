-- =============================================================================
-- PokéFan — Schema canônico do Supabase
-- =============================================================================
-- COMO USAR
--   Supabase Studio -> SQL Editor -> cole este arquivo inteiro -> Run.
--
-- SEGURO EM BANCO EXISTENTE
--   Todo comando é idempotente. Nada aqui apaga dado ou dropa tabela.
--   `create table if not exists` NÃO altera tabelas que já existem — se a sua
--   tabela de produção foi criada à mão, rode também os arquivos em
--   supabase/migrations/ para alinhar as constraints.
--
-- MODELO DE ACESSO
--   collection_items / wishlist_items / profiles -> privados por usuário (RLS).
--   ligapokemon_prices                           -> leitura pública, escrita só
--                                                   via service_role (scripts).
--   storage 'avatars'                            -> leitura pública, escrita só
--                                                   na pasta do próprio usuário.
-- =============================================================================


-- =============================================================================
-- 1. COLEÇÃO DO USUÁRIO
-- =============================================================================
-- `id` vem do client como "{card_id}-{condition}-{variant}" (AppContext.tsx).
-- Esse valor NÃO é único globalmente: dois usuários com a mesma carta na mesma
-- condição geram o mesmo `id`. Por isso a chave primária é (user_id, id).
create table if not exists public.collection_items (
  id           text        not null,
  user_id      uuid        not null references auth.users (id) on delete cascade,
  card_id      text        not null,
  quantity     integer     not null default 1 check (quantity > 0),
  condition    text        not null default 'NM'
                           check (condition in ('NM', 'LP', 'MP', 'HP', 'DMG')),
  variant      text        not null default 'normal'
                           check (variant in ('normal', 'holo', 'reverse')),
  added_at     timestamptz not null default now(),
  card_details jsonb       not null default '{}'::jsonb,
  constraint collection_items_pkey primary key (user_id, id)
);

create index if not exists collection_items_user_idx
  on public.collection_items (user_id);
create index if not exists collection_items_user_card_idx
  on public.collection_items (user_id, card_id);

alter table public.collection_items enable row level security;

drop policy if exists collection_items_select_own on public.collection_items;
create policy collection_items_select_own on public.collection_items
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists collection_items_insert_own on public.collection_items;
create policy collection_items_insert_own on public.collection_items
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists collection_items_update_own on public.collection_items;
create policy collection_items_update_own on public.collection_items
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists collection_items_delete_own on public.collection_items;
create policy collection_items_delete_own on public.collection_items
  for delete to authenticated
  using (auth.uid() = user_id);


-- =============================================================================
-- 2. PREÇOS LIGAPOKÉMON (dado de mercado compartilhado)
-- =============================================================================
-- Escrito por scripts/upload_liga_prices.js usando SUPABASE_SERVICE_ROLE_KEY,
-- que ignora RLS. Nenhuma policy de escrita é criada de propósito: sem policy
-- de insert/update, nenhum client anon ou autenticado consegue gravar aqui.
create table if not exists public.ligapokemon_prices (
  card_id    text        primary key,
  price_min  numeric(12, 2),
  price_avg  numeric(12, 2),
  price_max  numeric(12, 2),
  updated_at timestamptz not null default now()
);

create index if not exists ligapokemon_prices_updated_idx
  on public.ligapokemon_prices (updated_at desc);

alter table public.ligapokemon_prices enable row level security;

drop policy if exists ligapokemon_prices_read_all on public.ligapokemon_prices;
create policy ligapokemon_prices_read_all on public.ligapokemon_prices
  for select to anon, authenticated
  using (true);


-- =============================================================================
-- 3. PERFIL DO TREINADOR
-- =============================================================================
-- Preparado para a tarefa T9. Hoje o client ainda guarda perfil só em
-- localStorage — a tabela existe para que a migração não exija novo deploy de
-- schema. Criar tabela vazia não tem custo nem risco.
create table if not exists public.profiles (
  user_id        uuid        primary key references auth.users (id) on delete cascade,
  username       text,
  avatar_url     text,
  collector_rank text        not null default 'Treinador Novato',
  currency       text        not null default 'BRL'
                             check (currency in ('USD', 'EUR', 'JPY', 'BRL')),
  updated_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- =============================================================================
-- 4. LISTA DE DESEJOS
-- =============================================================================
-- Também preparada para T9 (hoje só localStorage).
create table if not exists public.wishlist_items (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  card_id      text        not null,
  card_details jsonb       not null default '{}'::jsonb,
  added_at     timestamptz not null default now(),
  constraint wishlist_items_pkey primary key (user_id, card_id)
);

alter table public.wishlist_items enable row level security;

drop policy if exists wishlist_items_select_own on public.wishlist_items;
create policy wishlist_items_select_own on public.wishlist_items
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists wishlist_items_insert_own on public.wishlist_items;
create policy wishlist_items_insert_own on public.wishlist_items
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists wishlist_items_delete_own on public.wishlist_items;
create policy wishlist_items_delete_own on public.wishlist_items
  for delete to authenticated
  using (auth.uid() = user_id);


-- =============================================================================
-- 5. STORAGE — BUCKET DE AVATARES
-- =============================================================================
-- ProfileSettings.tsx grava em `{auth.uid()}/avatar-{timestamp}.jpg` e usa
-- getPublicUrl(), então o bucket precisa ser público para leitura.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- =============================================================================
-- 6. VERIFICAÇÃO — rode depois e confira o resultado
-- =============================================================================
-- Toda tabela abaixo precisa aparecer com rowsecurity = true.
--
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public'
--     and tablename in ('collection_items', 'ligapokemon_prices',
--                       'profiles', 'wishlist_items');
--
-- E as policies devem estar presentes:
--
--   select tablename, policyname, cmd
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, policyname;
