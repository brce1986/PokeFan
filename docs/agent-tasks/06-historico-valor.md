# Tarefa 06 — Histórico de valor real (matar o gráfico falso)

Risco: 🟡 Médio. Leia primeiro `docs/agent-tasks/README.md` (regras gerais).

## Contexto

O gráfico "Valor da Coleção" no `src/components/Dashboard.tsx` é 100% sintético:
as datas são fixas (16/07 a 22/07) e os valores são o total de hoje multiplicado
por fatores fixos. Ele mostra um "passado" que nunca existiu. Esta tarefa
substitui isso por snapshots reais gravados ao longo do tempo.

## Arquivos que você PODE editar/criar

- `supabase/migrations/004_portfolio_snapshots.sql` (CRIAR — mas NÃO rodar; o
  dono roda no SQL Editor)
- `src/components/Dashboard.tsx`
- Opcional: um pequeno helper em `src/services/` para gravar/ler snapshots.

Não toque em auth, coleção nem nos serviços de catálogo.

## Passo 1 — Migration (você escreve, o dono roda)

Crie `supabase/migrations/004_portfolio_snapshots.sql` com uma tabela:

`portfolio_snapshots`: `user_id uuid` (FK auth.users, on delete cascade),
`snapshot_date date`, `total_usd numeric(12,2)`, `created_at timestamptz`.
PK composta `(user_id, snapshot_date)` — um snapshot por usuário por dia.
RLS: usuário só lê/escreve os próprios registros (siga o padrão das outras
policies em `supabase/schema.sql`, com `auth.uid() = user_id`).

No relatório, avise: "rodar 004 no SQL Editor".

## Passo 2 — Gravar o snapshot do dia

Quando há sessão real e o app carrega, gravar (upsert onConflict
`'user_id,snapshot_date'`) o valor total da coleção de hoje:
- Data = hoje (YYYY-MM-DD).
- total_usd = `somarValorColecao(collection).totalUSD` (função em
  `src/utils/pricing.ts`).
- Um upsert por dia é suficiente (o onConflict garante idempotência).
- Convidado (sem sessão) NÃO grava.

## Passo 3 — Ler e desenhar o real

- Buscar os snapshots do usuário (ordenados por data) e alimentar o gráfico SVG
  existente com eles, no lugar do `chartData` sintético.
- Os seletores de período (7d / 30d / all) devem filtrar os snapshots reais por
  data, não gerar dados.

## Passo 4 — Estado honesto quando não há histórico

Regra importante: **é melhor esconder o gráfico do que mostrar dado falso.**
- Com menos de 2 snapshots (ainda não há série), NÃO desenhe a linha. Mostre um
  estado vazio discreto: algo como "O histórico começa a ser registrado a partir
  de hoje. Volte em alguns dias para ver a evolução."
- O valor total atual (o número grande) continua sendo exibido normalmente.

## Restrições

- Não invente pontos. Se só existe o de hoje, a série tem 1 ponto e cai no
  estado vazio do passo 4.
- Mantenha o visual do gráfico (o SVG e as cores atuais).

## Verificação

- `npx tsc -b --pretty false` sai 0; `npm run build` passa.
- Sem a migration rodada / sem sessão: o gráfico cai no estado vazio, sem
  quebrar. Nenhuma data fixa 16/07–22/07 aparece mais no código nem na tela.
- No relatório, confirme que a migration 004 precisa ser rodada pelo dono.

## Critérios de aceite (o tech lead vai checar)

- `chartData` sintético removido do Dashboard.
- Nenhuma data hardcoded no gráfico.
- Estado vazio honesto quando há < 2 snapshots.
- Convidado não grava snapshot.
- Migration 004 escrita mas não executada pelo agente.
