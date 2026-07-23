# Tarefa 04 — Testes das contas de dinheiro

Risco: 🟡 Médio (instala vitest). Leia primeiro `docs/agent-tasks/README.md`.

## Contexto

Os cálculos que envolvem dinheiro não têm nenhum teste. São os pontos onde um
bug custa credibilidade: resolução de preço, soma da coleção, e parsing de
código de carta. Esta tarefa adiciona um framework de teste e cobre essas
funções puras.

## Dependência autorizada

Instale **vitest** como devDependency (é a escolha natural para Vite):

```
npm install -D vitest
```

Adicione ao `package.json` o script:
```json
"test": "vitest run"
```

Não instale mais nada.

## Arquivos que você PODE editar/criar

- `package.json` (só o script `test` e a devDependency vitest)
- `src/services/catalogApi.ts` — APENAS para **exportar** a função `parseCodigo`
  (hoje é interna). Exporte-a sem mudar o comportamento, para poder testá-la.
- Arquivos de teste novos: `src/utils/pricing.test.ts`,
  `src/services/catalogApi.test.ts`

Não altere a lógica de nenhuma função — só adicione testes (e o export citado).

## O que testar

### `src/utils/pricing.ts` → `src/utils/pricing.test.ts`
Leia o arquivo. Cubra:
- `resolverPrecoUSD`: retorna o preço da variante pedida; cai para outra
  variante quando a pedida não tem preço (marcando `aproximado: true`); retorna
  `{ usd: null }` quando não há nenhum preço.
- `precoUSD`: retorna número quando há preço, `null` quando não há.
- `somarValorColecao`: soma `preço × quantidade` só dos itens com preço, e conta
  em `itensSemPreco` os que não têm. Item sem preço não entra na soma.

Monte objetos `TCGCard` mínimos nos testes (só os campos que as funções leem:
`tcgplayer.prices`).

### `src/services/catalogApi.ts` → `src/services/catalogApi.test.ts`
Depois de exportar `parseCodigo`, cubra:
- `"121/88"` → `{ number: "121", printedTotal: 88 }`
- `"6/151"` → `{ number: "6", printedTotal: 151 }`
- `"Pikachu 121/88"` → `{ number: "121", printedTotal: 88 }`
- `"TG12/TG30"` → `{ number: "TG12", printedTotal: null }` (prefixo preservado)
- `"SV107/SV122"` → `{ number: "SV107", printedTotal: null }`
- `"25"` (sem barra) → `null`
- `"sv3pt5-6"` (sem barra) → `null`

## Restrições

- Testes só de funções puras. Não teste componentes React nem chamadas de rede.
- Não mocke Supabase — as funções acima não dependem dele.

## Verificação

```
npm test
```
Todos os testes devem passar. Depois, `npx tsc -b --pretty false` sai 0.

## Critérios de aceite (o tech lead vai checar)

- vitest instalado, script `test` no package.json.
- Testes cobrindo os casos listados, todos verdes.
- `parseCodigo` exportada sem mudança de comportamento; nenhuma outra lógica
  alterada.
