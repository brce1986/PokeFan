# Tarefa 06 — Histórico de valor real (matar o gráfico falso)

Risco: 🟡 Médio. Leia primeiro `docs/agent-tasks/README.md`. Brief EXAUSTIVO.

## Contexto

O gráfico "Valor da Coleção" em `src/components/Dashboard.tsx` é sintético: o
objeto `chartData` (linhas ~51-77) tem datas fixas ("16/07"…"22/07") e valores
que são o total de hoje multiplicado por fatores. Mostra um passado que nunca
existiu. Esta tarefa troca isso por snapshots reais gravados dia a dia.

## Arquivos que você PODE editar/criar

- `supabase/migrations/004_portfolio_snapshots.sql` (CRIAR — NÃO rodar; o dono
  roda no SQL Editor)
- `src/components/Dashboard.tsx`

Não toque em auth, coleção, serviços de catálogo, nem em outros componentes.

## Passo 1 — Migration (você escreve, o dono roda)

Crie `supabase/migrations/004_portfolio_snapshots.sql`. Use as migrations
existentes em `supabase/migrations/` e `supabase/schema.sql` como modelo de
estilo (RLS por dono com `auth.uid() = user_id`). A tabela:

```sql
create table if not exists public.portfolio_snapshots (
  user_id       uuid        not null references auth.users (id) on delete cascade,
  snapshot_date date        not null,
  total_usd     numeric(12,2) not null default 0,
  created_at    timestamptz not null default now(),
  constraint portfolio_snapshots_pkey primary key (user_id, snapshot_date)
);
```
Habilite RLS e crie policies de select/insert/update onde `auth.uid() = user_id`
(espelhe as policies de `collection_items` no `schema.sql`). No relatório, avise:
"rodar 004 no SQL Editor".

## Passo 2 — Dashboard: importar o cliente Supabase

No topo de `Dashboard.tsx`, importe `supabase` de `../services/supabaseClient`.

## Passo 3 — Gravar o snapshot do dia (novo useEffect)

`somarValorColecao(collection)` (já usado na linha ~47, retorna
`{ totalUSD }`) dá o valor de hoje. Adicione um `useEffect` que, quando há sessão
real, faz upsert do snapshot de hoje:

```tsx
useEffect(() => {
  const gravarSnapshot = async () => {
    if (!supabase || !currentUser) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // convidado não grava
    const hoje = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    await supabase.from('portfolio_snapshots').upsert({
      user_id: user.id, snapshot_date: hoje, total_usd: totalValue
    }, { onConflict: 'user_id,snapshot_date' });
  };
  gravarSnapshot().catch(err => console.error('Falha ao gravar snapshot:', err));
}, [collection, currentUser]);
```
(`currentUser` já vem do `useApp()` no componente; confirme que está
desestruturado — se não estiver, adicione-o.)

## Passo 4 — Ler os snapshots reais (novo estado + useEffect)

Adicione estado `const [snapshots, setSnapshots] = useState<{date: string; value: number}[]>([])`.
Em um `useEffect` (deps `[currentUser]`), quando há sessão, buscar
`portfolio_snapshots` do usuário ordenado por `snapshot_date` asc, e mapear para
`{ date: row.snapshot_date, value: Number(row.total_usd) }`.

## Passo 5 — Trocar o gráfico sintético pelo real

1. REMOVA o objeto `chartData` inteiro (linhas ~51-77).
2. Filtre os snapshots pelo `timeframe`:
```tsx
const agora = Date.now();
const limiteDias = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : Infinity;
const activePoints = snapshots
  .filter(p => (agora - new Date(p.date).getTime()) / 86400000 <= limiteDias)
  .map(p => ({ date: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: p.value }));
```
Isso mantém a variável `activePoints` que o resto do código (min/max, `points`,
`linePath`, `areaPath`, rótulos) já consome — não precisa mexer no cálculo do SVG
nem nos rótulos (linhas ~79-99 e ~181-185).

## Passo 6 — Estado vazio honesto (menos de 2 pontos)

Envolva o SVG do gráfico e os rótulos de data num condicional: se
`activePoints.length >= 2`, renderiza o gráfico como hoje; senão, renderiza no
mesmo espaço um aviso discreto, ex.:
```tsx
<div className="h-[150px] flex items-center justify-center text-center text-xs text-on-surface-variant/80 font-medium px-4">
  O histórico de valor começa a ser registrado a partir de hoje. Volte em alguns
  dias para ver a evolução da sua coleção.
</div>
```
O número grande do valor total atual continua sendo exibido normalmente (não
mexa nele).

## NÃO fazer

- Não invente pontos. Se só há o snapshot de hoje (1 ponto), cai no estado vazio.
- Não mude o cálculo do SVG (linePath/areaPath/points) nem as cores.
- Não rode a migration.

## Verificação

- `npx tsc -b --pretty false` sai 0; `npm run build` passa.
- Sem sessão / sem a migration rodada: o gráfico cai no estado vazio, sem
  quebrar. Nenhuma data "16/07".."22/07" aparece mais no código nem na tela.
- Busque no código por `chartData` — não deve existir mais.

## Critérios de aceite (o tech lead vai checar)

- `chartData` sintético removido; nenhuma data hardcoded.
- Migration 004 escrita, NÃO executada pelo agente.
- Snapshot gravado só com sessão (convidado não grava).
- Estado vazio honesto com < 2 pontos; SVG intacto quando há série.
