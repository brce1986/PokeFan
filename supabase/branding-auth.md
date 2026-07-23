# Tirar a marca do Supabase das telas de autenticação

Resumo do que é possível, quanto custa, e o que não vale a pena.

---

## Antes de tudo: isto não é segurança

O `project ref` do Supabase é público por definição. Ele está no bundle
JavaScript e no cabeçalho de toda requisição que o app faz ao banco. Qualquer
pessoa com o DevTools aberto descobre em segundos qual serviço está por trás.

Esconder o fornecedor não protege nada. O que protege é o que já foi feito:
RLS ativa em todas as tabelas, policies por dono, chave `service_role` fora do
frontend, e nenhuma senha guardada pela aplicação.

O motivo real para fazer o branding é **confiança e conversão**. Um usuário que
lê "Fazer login no serviço swlwnydpjetilzbyvxdi.supabase.co" numa tela do Google
não entende, desconfia e abandona. Esse é o problema a resolver.

---

## 1. Tela de consentimento do Google

Hoje aparece o host do callback OAuth, que é o domínio do Supabase.

### Grátis — nome e logo do app

Google Cloud Console → **APIs e serviços → Tela de permissão OAuth**

- **Nome do app:** `PokéFan`
- **Logo do app:** envie `public/logo.png` (PNG quadrado, até 1 MB)
- **Domínio da página inicial:** a URL do app
- **Link da política de privacidade** e **dos termos de uso**: obrigatórios para
  publicar o app fora do modo de teste

Isso substitui o host cru pelo nome do app no título da tela. Leva 10 minutos e
não custa nada — **faça primeiro e veja o resultado antes de considerar
qualquer coisa paga.**

Duas ressalvas:

- Para o **logo** aparecer para usuários fora da sua lista de teste, o Google
  exige verificação do app. O processo pede domínio verificado e as páginas de
  privacidade e termos, e leva de dias a semanas.
- O domínio `supabase.co` ainda pode aparecer em texto secundário, no aviso de
  quais dados serão compartilhados. Só o item 3 remove isso por completo.

### Pago — remover `supabase.co` de vez

Exige o add-on Custom Domain (item 3).

---

## 2. E-mail de confirmação

Duas camadas independentes:

| O quê | Como | Custo |
|---|---|---|
| Visual do e-mail | `supabase/email-templates.md` | Grátis |
| Remetente no seu domínio | `supabase/custom-smtp.md` | Domínio ~R$ 60/ano + provedor grátis |
| Link dentro do e-mail no seu domínio | Add-on Custom Domain | US$ 10/mês |

O visual pode ser trocado hoje. O remetente exige um domínio próprio — não dá
para enviar a partir de um subdomínio `.vercel.app`, porque a zona DNS não é sua.

**Motivo urgente e independente da marca:** o SMTP compartilhado do Supabase
gratuito limita o envio a pouquíssimas mensagens por hora. Com alguns testadores
simultâneos, os e-mails de confirmação param de sair sem erro visível no app.
Configurar SMTP próprio resolve isso — e é o argumento mais forte para fazer.

---

## 3. Custom Domain do Supabase

Add-on pago, na faixa de US$ 10/mês. Troca `SEU_REF.supabase.co` por algo como
`auth.seudominio.com` em tudo: callback do OAuth, link de confirmação, endpoint
da API.

É a única forma de remover a menção ao Supabase por completo.

**Avaliação:** ~R$ 660/ano para um app sem receita e com dois testadores. O
retorno é estético. Recomendo adiar até existir base de usuários real ou
qualquer sinal de monetização.

---

## Ordem sugerida

1. **Agora, grátis:** nome e logo na tela de consentimento do Google, e os
   templates de e-mail com a marca. Resolve a maior parte do desconforto visual
   sem custo.
2. **Quando comprar o domínio (~R$ 60/ano):** SMTP próprio. Ganha remetente com
   a marca e, principalmente, tira o limite de envio que trava o cadastro.
3. **Só com usuários reais:** add-on Custom Domain, se ainda incomodar.
