# Tarefa 03 — Paginação na busca de cartas

Risco: 🟢 Baixo. Leia primeiro `docs/agent-tasks/README.md` (regras gerais).

## Contexto

A aba "Cartas" (`src/components/SearchDetails.tsx`) faz busca no catálogo, mas só
mostra a primeira página de 24 resultados. O contador diz "Mostrando N cartas"
onde N é o tamanho da página, não o total. Uma busca comum (ex.: "Charizard")
tem mais de 100 resultados inalcançáveis.

## O que já está pronto (não precisa mexer)

O serviço já suporta paginação. Veja em `src/services/pokemonApi.ts` e
`src/services/catalogApi.ts`:

```ts
searchCards: async (query, page = 1, pageSize = 24) => Promise<{ data, totalCount }>
```

`totalCount` é o total real. Você só precisa usar `page` e `totalCount` na UI.

## Arquivos que você PODE editar

- `src/components/SearchDetails.tsx`

Não edite os serviços — a paginação já existe neles.

## O que fazer

1. Guardar em estado a página atual e o `totalCount` da última busca.
2. Ao fazer uma nova busca (submit), voltar para a página 1.
3. Adicionar controles de navegação abaixo dos resultados: "Anterior" /
   "Próxima" e um indicador "Página X de Y" (Y = `Math.ceil(totalCount / 24)`).
   - "Anterior" desabilitado na página 1.
   - "Próxima" desabilitado na última página.
4. Ao trocar de página, refazer a busca com o mesmo termo e a nova página,
   e dar scroll para o topo da lista.
5. Trocar o texto do contador para algo honesto que use o total real, ex.:
   "N cartas encontradas" (N = `totalCount`), não o tamanho da página.

## Restrições

- Use o estilo visual (classes Tailwind) já presente na tela para os botões.
- Não implemente scroll infinito — paginação com botões, mais simples e testável.
- Mantenha o estado de carregando (`loading`) já existente cobrindo a troca de
  página.

## Verificação

1. Busque "Charizard" — o contador deve mostrar o total real (mais de 100), não
   24.
2. "Próxima" deve trazer a página 2 com cartas diferentes.
3. Na página 1, "Anterior" deve estar desabilitado.
4. Uma nova busca deve voltar para a página 1.
5. `npx tsc -b --pretty false` sai 0; `npm run build` passa.

## Critérios de aceite (o tech lead vai checar)

- Contador reflete o `totalCount` real.
- Navegação entre páginas funciona e busca a página certa no serviço.
- Botões desabilitados nos limites (primeira/última página).
- Nova busca reseta para página 1.
