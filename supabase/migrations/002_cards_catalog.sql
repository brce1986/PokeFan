-- =============================================================================
-- Migration 002 — Catálogo de cartas local (índice de busca)
-- =============================================================================
-- Move a busca da aba "Cartas" da API pública instável (que retornou HTTP 500
-- em 3 de cada 4 chamadas na auditoria) para o seu próprio Supabase.
--
-- Guarda APENAS o índice de busca — id, nome, número, set, raridade e a
-- miniatura. NÃO guarda ataques, fraquezas nem preço:
--   - Detalhe completo (ataques etc.) é buscado sob demanda por id na API.
--   - Preço é volátil e vive numa tabela própria (ligapokemon_prices).
-- Índice = ~20 mil linhas leves. Rode scripts/import_catalog_to_supabase.js
-- para popular.
--
-- Seguro rodar em banco existente: idempotente, não apaga nada.
-- =============================================================================

-- Busca por nome usa ILIKE '%termo%'. Sem trigramas, isso varre a tabela
-- inteira a cada tecla. A extensão pg_trgm permite um índice GIN que torna o
-- ILIKE rápido mesmo com curinga no início.
create extension if not exists pg_trgm;

create table if not exists public.cards_catalog (
  id            text    primary key,          -- "sv3pt5-6"
  name          text    not null,             -- "Charizard ex"
  number        text,                         -- "6" (string: existem "TG12", "SV107")
  printed_total integer,                       -- 165 — total impresso do set, p/ busca "6/165"
  set_id        text,                          -- "sv3pt5"
  set_name      text,                          -- "151"
  set_series    text,                          -- "Scarlet & Violet"
  rarity        text,
  supertype     text,                          -- "Pokémon" | "Trainer" | "Energy"
  image_small   text,                          -- miniatura para a grade de resultados
  image_large   text,
  release_date  date                           -- ordenação por lançamento
);

-- Nome: índice trigram para ILIKE rápido com curinga.
create index if not exists cards_catalog_name_trgm
  on public.cards_catalog using gin (name gin_trgm_ops);

-- Código da carta: "121/88" vira number='121' + printed_total=88.
create index if not exists cards_catalog_number_idx
  on public.cards_catalog (number, printed_total);

-- Listar cartas de um set, ordenadas.
create index if not exists cards_catalog_set_idx
  on public.cards_catalog (set_id);

-- Leitura pública, escrita só via service_role (o script de import ignora RLS).
-- Sem policy de insert/update: nenhum client anon ou logado grava aqui.
alter table public.cards_catalog enable row level security;

drop policy if exists cards_catalog_read_all on public.cards_catalog;
create policy cards_catalog_read_all on public.cards_catalog
  for select to anon, authenticated
  using (true);

-- Conferência:
--   select count(*) from public.cards_catalog;
--   select id, name, number, printed_total, set_name
--   from public.cards_catalog
--   where name ilike '%charizard%' limit 5;
