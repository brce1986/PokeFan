# E-mail com remetente próprio (SMTP customizado)

Duas razões para fazer isso, em ordem de urgência:

1. **O limite de e-mails do Supabase gratuito é baixíssimo** — poucas mensagens
   por hora no SMTP compartilhado. Com dois ou três testadores cadastrando ao
   mesmo tempo, os e-mails de confirmação simplesmente param de sair, sem erro
   visível no app. Isso derruba o cadastro na prática.
2. Marca: o remetente deixa de ser o endereço genérico do Supabase.

O passo 1 sozinho já justifica. A marca vem de brinde.

---

## Pré-requisito: um domínio próprio

Não dá para contornar. Provedores de e-mail exigem registros DNS (SPF, DKIM,
DMARC) na zona do domínio para autorizar o envio, e **não é possível adicionar
esses registros a um subdomínio `.vercel.app`** — a zona não é sua.

Custo: um `.com` sai por volta de R$ 60/ano; um `.com.br` no Registro.br fica na
faixa de R$ 40/ano.

Enquanto não houver domínio, o e-mail continua saindo pelo Supabase. Os
templates de `supabase/email-templates.md` já mudam o visual e funcionam desde
já — só o remetente permanece genérico.

---

## 1. Provedor de envio

Recomendação: **Resend**. Camada gratuita de ~3.000 e-mails/mês e ~100/dia, o
que é folgado para o volume de cadastro deste app. Alternativas equivalentes:
Brevo, Postmark, Amazon SES, SendGrid.

1. Crie a conta e adicione seu domínio
2. O provedor mostra registros **SPF**, **DKIM** e (opcional) **DMARC**
3. Cadastre esses registros no DNS do domínio e aguarde a verificação
4. Gere as credenciais **SMTP** (host, porta, usuário, senha)

---

## 2. Ligar no Supabase

Painel → **Project Settings → Authentication → SMTP Settings**

- **Enable Custom SMTP:** ligado
- **Sender email:** `nao-responda@seudominio.com`
- **Sender name:** `PokéFan`
- **Host / Port / Username / Password:** os dados do provedor
  (Resend usa `smtp.resend.com`, porta `465`, usuário `resend`, senha = API key)

Salve e envie um cadastro de teste.

---

## 3. Ajustar o limite de envio

Painel → **Authentication → Rate Limits**

Com SMTP próprio, o teto do Supabase deixa de ser o gargalo e passa a ser o do
seu provedor. Suba o limite de e-mails por hora para algo compatível.

---

## O que isto NÃO resolve

O **link dentro do e-mail** continua apontando para
`https://SEU_REF.supabase.co/auth/v1/verify?...`, porque quem valida o token é o
Supabase. O remetente fica com a sua marca; o link, não.

Para o link também ficar no seu domínio, é preciso o add-on **Custom Domain** do
Supabase — pago, na faixa de US$ 10/mês. Veja a análise em
`supabase/branding-auth.md` antes de assinar.
