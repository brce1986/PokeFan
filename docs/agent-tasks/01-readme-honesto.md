# Tarefa 01 — Reescrever o README com honestidade

Risco: 🟢 Baixo. Leia primeiro `docs/agent-tasks/README.md` (regras gerais).

## Contexto

O `README.md` na raiz descreve um app que não corresponde ao código atual. Ele
faz afirmações falsas ou desatualizadas. Sua tarefa é reescrevê-lo para refletir
o que o app REALMENTE faz hoje. Leia o código antes de escrever — não repita as
alegações antigas.

## Arquivos que você PODE editar

- `README.md` (raiz)

Não edite mais nada.

## Correções obrigatórias (o README antigo mente sobre isto)

1. **Scanner:** o README diz que escaneia cartas com a câmera / rede neural. É
   falso. Veja `src/components/Scan.tsx`: hoje a tela deixa o usuário escolher
   uma carta de uma lista (não há câmera, não há reconhecimento). Descreva o que
   ela realmente faz. Não invente um recurso que não existe.
2. **Catálogo:** o app usa um catálogo de ~20.000 cartas e ~174 sets guardados
   no Supabase (tabelas `cards_catalog` e `card_sets`), com busca local. Veja
   `src/services/catalogApi.ts`. A API pública `pokemontcg.io` é usada só como
   fallback e para o detalhe completo de uma carta.
3. **Preços:** os valores em BRL são estimativa (câmbio USD→BRL ao vivo via
   `src/services/fxRates.ts` + ágio), não preço oficial. Preço real da
   LigaPokémon ainda não está implementado. Não prometa preço em tempo real.
4. **Autenticação:** há cadastro por e-mail com confirmação, login com Google
   (OAuth) e recuperação de senha, via Supabase Auth. Há um "modo demonstração"
   (Acesso Rápido de Teste) que não usa nuvem.

## O que manter

- A seção de stack tecnológica (atualize o que estiver errado).
- A estrutura de diretórios (confira contra a árvore real de `src/` e
  `scripts/`; adicione `catalogApi.ts`, `fxRates.ts`, `utils/pricing.ts`,
  `supabase/`, `docs/`).
- Instruções de como rodar (`npm install`, `npm run dev`). Atualize a seção de
  scripts de dados citando `import_catalog_to_supabase.js`,
  `import_sets_to_supabase.js` e `check_env.js`, e o `.env.example`.

## Tom

Honesto e específico. Nada de marketing sobre recursos que não existem. Se algo
é estimativa ou está pendente, diga que é.

## Verificação

- O README não deve conter nenhuma afirmação que o código contradiz.
- Confira cada recurso citado abrindo o arquivo correspondente em `src/`.

## Critérios de aceite (o que o tech lead vai checar)

- Nenhuma menção a "rede neural", "câmera" ou reconhecimento de imagem como se
  existissem.
- Catálogo descrito como local no Supabase, não como dependente da API.
- Preço descrito como estimativa.
- Árvore de diretórios bate com o repo real.
