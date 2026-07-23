# Tarefa 02 — Corrigir `<img>` com src vazio

Risco: 🟢 Baixo. Leia primeiro `docs/agent-tasks/README.md` (regras gerais).

> Este brief é EXAUSTIVO de propósito. Faça exatamente os itens listados, nada
> além. Não procure outros `<img>` fora da lista. Não altere serviços nem o
> `catalogApi.ts`.

## Contexto

O console do navegador emite vários avisos do React:
> An empty string ("") was passed to the src attribute.

Causa: alguns `<img>` recebem `src=""` (string vazia) quando a carta não tem
imagem (`images.small`/`images.large` vazios vindos do catálogo) ou quando o
usuário não tem avatar. A correção é: quando o `src` for vazio, NÃO renderizar o
`<img>` — renderizar um placeholder no lugar, mantendo o mesmo tamanho.

## Arquivos que você PODE editar

- `src/components/Collection.tsx`
- `src/components/Dashboard.tsx`
- `src/components/SearchDetails.tsx`
- `src/components/TradeBinder.tsx`
- `src/components/Scan.tsx`
- `src/components/ProfileSettings.tsx`
- `src/App.tsx`

Não edite nenhum outro arquivo. NÃO edite `src/services/catalogApi.ts`.

## Padrão A — thumbnails de carta

Onde a imagem vem de uma carta (`...images.small` ou `...images.large`), troque
o `<img>` por renderização condicional. Se a expressão de src for vazia,
renderize um placeholder que ocupa o MESMO espaço (mantenha as mesmas classes de
tamanho do container). Use o ícone `ImageOff` do `lucide-react` centralizado.

Exemplo (adapte a expressão de src e as classes existentes de cada local):
```tsx
{EXPRESSAO_DO_SRC ? (
  <img src={EXPRESSAO_DO_SRC} alt={ALT_EXISTENTE} className={CLASSES_EXISTENTES} />
) : (
  <div className="w-full h-full flex items-center justify-center bg-surface-container text-on-surface-variant/50">
    <ImageOff size={20} />
  </div>
)}
```
Importe `ImageOff` de `lucide-react` no topo de cada arquivo que usar (junte ao
import de ícones já existente).

### Locais do Padrão A (localize pela expressão de src; a linha é aproximada)

| Arquivo | Expressão do src | Linha aprox. |
|---|---|---|
| Collection.tsx | `item.cardDetails.images.small` | 443 |
| Collection.tsx | `card.images.small` | 613 |
| Dashboard.tsx | `item.cardDetails.images.small` | 316 |
| Dashboard.tsx | `item.cardDetails.images.small` | 382 |
| SearchDetails.tsx | `cardInfo.images.large` | 278 |
| SearchDetails.tsx | `card.images.small` | 638 |
| TradeBinder.tsx | `item.cardDetails.images.small` | 123 |
| TradeBinder.tsx | `selectedTradeItem.cardDetails.images.large` | 181 |
| Scan.tsx | `detectedCard.images.small` | 260 |

## Padrão B — avatares

Onde a imagem é o avatar do usuário, se vazio renderize o ícone `User` do
`lucide-react` centralizado, mantendo o tamanho do container.

```tsx
{EXPRESSAO_DO_AVATAR ? (
  <img src={EXPRESSAO_DO_AVATAR} alt="Avatar" className={CLASSES_EXISTENTES} />
) : (
  <div className="w-full h-full flex items-center justify-center bg-surface-container text-on-surface-variant/50">
    <User size={20} />
  </div>
)}
```

### Locais do Padrão B

| Arquivo | Expressão do src | Linha aprox. |
|---|---|---|
| ProfileSettings.tsx | `avatar` | 206 |
| App.tsx | `currentUser.avatar` | 99 |
| App.tsx | `currentUser.avatar` | 126 |

## NÃO TOCAR nestes `<img>` (o src nunca é vazio — são estáticos ou já guardados)

- `Onboarding.tsx:188`, `App.tsx:60`, `App.tsx:117` — logo estático
  (`/logo_transparent.png`).
- `Scan.tsx:135` — imagem estática do Unsplash (moldura visual da câmera).
- `Dashboard.tsx:427`, `Collection.tsx:309`, `Collection.tsx:519` — logos de
  set. **Não mexer.** (O de Dashboard já é condicional; os de Collection vêm de
  `card_sets`, que sempre têm logo.)
- `ProfileSettings.tsx:457` (`cropSrc`) — só existe dentro do modal de recorte,
  quando já há imagem carregada. **Não mexer.**

## Verificação

1. Rode `npm run dev` e entre com "Acesso Rápido de Teste".
2. Navegue por Painel, Coleção, Cartas (faça uma busca), Trocas e Perfil.
3. Abra o console e confirme: **zero** avisos de "empty string was passed to the
   src attribute".
4. `npx tsc -b --pretty false` sai 0; `npm run build` passa.

## Critérios de aceite (o tech lead vai checar)

- Exatamente os 12 `<img>` das tabelas Padrão A e B viraram condicionais.
- Os `<img>` da lista "NÃO TOCAR" continuam intactos.
- Zero avisos de src vazio no console após navegar por todas as abas.
- Layout inalterado (placeholders ocupam o mesmo espaço das imagens).
- `catalogApi.ts` não foi tocado.
