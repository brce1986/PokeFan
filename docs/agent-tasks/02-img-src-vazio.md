# Tarefa 02 — Corrigir `<img>` com src vazio

Risco: 🟢 Baixo. Leia primeiro `docs/agent-tasks/README.md` (regras gerais).

## Contexto

O console do navegador emite ~40 avisos do React:
> An empty string ("") was passed to the src attribute.

Vêm de `<img>` renderizados com `src=""` (string vazia) em vez de não renderizar
ou passar `null`. Isso suja o console e o React avisa que pode rebaixar a
performance (rebaixa a página).

## Arquivos que você PODE editar

- `src/components/Dashboard.tsx`
- `src/components/Collection.tsx`
- `src/components/SearchDetails.tsx`
- `src/components/TradeBinder.tsx`
- `src/components/ProfileSettings.tsx`

Não edite serviços nem o contexto. Apenas a renderização das imagens.

## A causa raiz

`src/services/catalogApi.ts` (função `linhaParaCard`) devolve
`images.small: ''` quando a carta não tem imagem — isso alimenta o caso em
escala quando a busca usa o catálogo. O avatar do usuário também pode ser
string vazia.

**Não** altere `catalogApi.ts` — a correção é na renderização: nunca renderize
um `<img>` com `src` vazio.

## O que fazer

Em cada `<img>` cujo `src` possa ser vazio (thumbnails de carta
`cardDetails.images.small`, avatar do usuário, logos), trocar por renderização
condicional: só renderiza o `<img>` quando há `src` não-vazio; senão mostra um
placeholder.

Já existe esse padrão pronto para copiar em `src/components/Dashboard.tsx`, no
logo do set:

```tsx
{set.images.logo ? (
  <img className="..." src={set.images.logo} alt={set.name} />
) : (
  <span className="...">{set.name}</span>
)}
```

Aplique o mesmo raciocínio aos thumbnails de carta (placeholder pode ser um
ícone genérico de carta do `lucide-react` ou as iniciais do nome) e ao avatar
(placeholder: ícone de usuário). Mantenha as classes/tamanhos existentes para
não quebrar o layout.

## Verificação

1. Rode o app: `npm run dev` (ou peça ao ambiente para abrir o preview).
2. Entre com "Acesso Rápido de Teste", navegue por Painel, Coleção, Cartas
   (faça uma busca), Trocas e Perfil.
3. Abra o console do navegador e confirme que **não há mais** avisos de
   "empty string was passed to the src attribute".

## Critérios de aceite (o tech lead vai checar)

- Zero avisos de src vazio no console após navegar por todas as abas.
- Nenhuma imagem quebrada; placeholders no lugar das que faltavam.
- Layout inalterado (mesmos tamanhos de miniatura/avatar).
- `catalogApi.ts` não foi tocado.
