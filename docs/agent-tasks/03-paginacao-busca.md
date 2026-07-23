# Tarefa 03 — Paginação na busca de cartas

Risco: 🟢 Baixo. Leia primeiro `docs/agent-tasks/README.md` (regras gerais).

> Brief EXAUSTIVO. Faça exatamente os itens abaixo, nada além.

## Contexto

Na aba "Cartas" (`src/components/SearchDetails.tsx`) a busca só mostra a primeira
página de 24 resultados e o contador diz "Mostrando N cartas" onde N é o tamanho
da página, não o total. Uma busca como "Charizard" tem 100+ resultados
inalcançáveis.

## O que já existe (NÃO mexer nos serviços)

`pokemonApi.searchCards(query, page = 1, pageSize = 24)` já devolve
`{ data, totalCount }`. `totalCount` é o total real. Você só usa `page` e
`totalCount` na UI de `SearchDetails.tsx`.

## Arquivo que você PODE editar

- `src/components/SearchDetails.tsx` — SOMENTE.

## Mudanças exatas

### 1. Novos estados (perto da linha 59, junto aos outros `useState`)
Adicione:
```tsx
const [currentPage, setCurrentPage] = useState(1);
const [totalCount, setTotalCount] = useState(0);
const PAGE_SIZE = 24;
```

### 2. `handleSearch` (linha ~184)
Hoje é `const handleSearch = async (query: string) => {` e chama
`pokemonApi.searchCards(cleanQuery)`. Altere para aceitar a página e usar o
totalCount:
- Assinatura: `const handleSearch = async (query: string, page = 1) => {`
- Trocar a chamada para `await pokemonApi.searchCards(cleanQuery, page, PAGE_SIZE)`.
- Depois de receber `result`, fazer `setTotalCount(result.totalCount || 0)` e
  `setCurrentPage(page)`.

### 3. `handleSearchSubmit` (linha ~179)
Hoje chama `handleSearch(searchQuery)`. Mantenha, mas garanta que uma nova busca
começa na página 1: chame `handleSearch(searchQuery, 1)`.

### 4. Contador (linha ~623)
Hoje:
```tsx
{/* comentário */}
Mostrando {searchResults.length} cartas
```
Troque por (usando o total real):
```tsx
{totalCount} {totalCount === 1 ? 'carta encontrada' : 'cartas encontradas'}
```
Remova o comentário antigo que dizia ser o tamanho da página.

### 5. Controles de paginação
Logo APÓS o `</div>` que fecha a grade de resultados (a `<div className="grid ...">`
que termina por volta da linha 665) e ANTES do bloco de estado vazio
(`{searchResults.length === 0 ...}` na linha ~667), adicione os controles.
Mostre-os só quando houver mais de uma página:

```tsx
{totalCount > PAGE_SIZE && (
  <div className="flex items-center justify-center gap-3 mt-6">
    <button
      type="button"
      disabled={currentPage <= 1 || loadingSearch}
      onClick={() => { handleSearch(lastSearchTerm, currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      className="px-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs font-bold text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition-all"
    >
      Anterior
    </button>
    <span className="text-xs font-bold text-on-surface-variant">
      Página {currentPage} de {Math.ceil(totalCount / PAGE_SIZE)}
    </span>
    <button
      type="button"
      disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE) || loadingSearch}
      onClick={() => { handleSearch(lastSearchTerm, currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      className="px-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs font-bold text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition-all"
    >
      Próxima
    </button>
  </div>
)}
```
Obs.: `lastSearchTerm` já existe no componente e guarda o termo já sanitizado da
última busca — use-o para paginar (não `searchQuery`, que o usuário pode ter
editado sem submeter).

## NÃO fazer

- Não implemente scroll infinito.
- Não altere `pokemonApi.ts` nem `catalogApi.ts`.
- Não mexa no estado vazio (linha ~667) nem na busca inicial `handleSearch('Charizard')` (linha ~149).

## Verificação

1. Busque "Charizard": o contador mostra o total real (100+), não 24.
2. "Próxima" traz a página 2 com cartas diferentes; "Página 2 de N".
3. Na página 1, "Anterior" está desabilitado.
4. Uma nova busca volta para a página 1.
5. `npx tsc -b --pretty false` sai 0; `npm run build` passa.

## Critérios de aceite (o tech lead vai checar)

- Contador usa `totalCount`.
- Paginação chama o serviço com a página correta e `lastSearchTerm`.
- Botões desabilitados nos limites; nova busca reseta para página 1.
- Só `SearchDetails.tsx` foi alterado.
