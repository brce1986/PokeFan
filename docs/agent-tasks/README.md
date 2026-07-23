# Tarefas para agente externo (Antigravity / Gemini 3.1 Pro)

Cada arquivo aqui é um **brief autossuficiente** — o Gemini tem acesso ao repo,
mas NÃO tem o histórico das nossas conversas. Tudo que ele precisa saber está no
brief. Passe **uma tarefa por vez**; quando ele terminar, me acione para eu
verificar.

## Como funciona o loop

1. Você abre um brief, cola no Antigravity.
2. Gemini executa e roda a verificação descrita no fim do brief.
3. Você me aciona: "tarefa X feita".
4. Eu verifico contra os critérios de aceite e reporto o que estiver errado.

## O agente é LITERAL

O Gemini executa exatamente o que está escrito e **não busca nada além**. Ele
não infere, não caça inconsistências, não "melhora" o que não foi pedido. Por
isso cada brief enumera item a item o que fazer — critérios genéricos do tipo
"corrija tudo que estiver errado" não funcionam; ele ignora o que não estiver
listado explicitamente. Ao escrever um brief novo, liste cada mudança com
arquivo e localização.

## Regras que valem para TODA tarefa (repetidas em cada brief)

- Comentários e textos de UI em **português do Brasil**, igual ao resto do repo.
- **Não** rode `git push`. Commit local é opcional; deixe a revisão para o dono.
- **Não** toque no arquivo `.env` nem rode os scripts de `scripts/` que usam
  `SUPABASE_SERVICE_ROLE_KEY` (importações vão para o Supabase de produção — só
  o tech lead roda).
- **Não** crie tabela no Supabase por conta própria. Se a tarefa precisar de
  tabela nova, escreva o SQL em `supabase/migrations/` e avise no relatório que
  o dono precisa rodá-lo no SQL Editor.
- Não adicione dependências novas a menos que o brief peça explicitamente.
- Ao terminar, `npx tsc -b --pretty false` deve sair com código 0 e
  `npm run build` deve passar. O lint tem avisos pré-existentes — só não
  adicione erros novos.
- Entregue um relatório: o que mudou em cada arquivo (com nº de linha), o
  resultado de tsc/build, e qualquer coisa que você decidiu NÃO fazer.

## Quais tarefas são delegáveis

| Brief | Tarefa | Risco | Por quê |
|---|---|---|---|
| `01-readme-honesto.md` | Reescrever README | 🟢 Baixo | Só documentação |
| `02-img-src-vazio.md` | Corrigir `<img src="">` | 🟢 Baixo | Mecânico, isolado |
| `03-paginacao-busca.md` | Paginação da busca | 🟢 Baixo | 1 arquivo, dados já prontos |
| `04-testes-dinheiro.md` | Testes das contas de dinheiro | 🟡 Médio | Instala vitest; funções puras |
| `05-wishlist-perfil-nuvem.md` | Wishlist/perfil no Supabase | 🟡 Médio-alto | Mexe no AppContext — guardrails fortes |
| `06-historico-valor.md` | Histórico de valor real | 🟡 Médio | Migration + Dashboard |

## O que NÃO delegar (fica com o tech lead)

- **T12 — scraper de preços LigaPokémon.** Precisa de credenciais, julgamento
  sobre bloqueio Cloudflare, e é decisão de negócio (raspar vs. estimar).
- **T16/T17 — reconhecimento de carta no scan.** Precisa de experimentação e
  medição de acerto antes de decidir a abordagem.
- **T19 — quebrar AppContext/Collection.** Refactor de alto risco na peça mais
  sensível; exige o contexto completo das correções de auth já feitas.
