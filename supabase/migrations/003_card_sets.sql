-- =============================================================================
-- Migration 003 — Tabela de sets (coleções) local
-- =============================================================================
-- Substitui os 4 sets fixos de MOCK_SETS pelos ~174 reais. Diferente das
-- cartas, os sets trazem os LOGOS (capas do binder), que o catálogo de cartas
-- não guarda — por isso uma tabela própria, importada de /sets.
--
-- Rode scripts/import_sets_to_supabase.js para popular (endpoint pequeno e
-- estável, importa de uma vez).
--
-- Idempotente, seguro em banco existente.
-- =============================================================================

create table if not exists public.card_sets (
  id            text    primary key,          -- "sv3pt5"
  name          text    not null,             -- "151"
  series        text,                          -- "Scarlet & Violet"
  printed_total integer,                       -- 165 — total impresso (numeração)
  total         integer,                       -- inclui secretas acima do printed
  release_date  date,
  logo          text,                          -- capa do set no binder
  symbol        text                           -- ícone pequeno
);

create index if not exists card_sets_release_idx
  on public.card_sets (release_date desc);
create index if not exists card_sets_series_idx
  on public.card_sets (series);

alter table public.card_sets enable row level security;

drop policy if exists card_sets_read_all on public.card_sets;
create policy card_sets_read_all on public.card_sets
  for select to anon, authenticated
  using (true);

-- Conferência:
--   select count(*) from public.card_sets;
--   select id, name, series, printed_total, total from public.card_sets
--   order by release_date desc limit 10;
