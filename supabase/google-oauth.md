# Login com Google — configuração

O código já está pronto (`loginWithGoogle` em `src/context/AppContext.tsx`).
Falta habilitar o provedor. Enquanto isso não for feito, o botão "Continuar com
Google" mostra: *"O login com Google ainda não foi habilitado no servidor."*

Os passos abaixo exigem credenciais e acesso a painéis — precisam ser feitos por
você, não pelo assistente.

---

## 1. Google Cloud Console

<https://console.cloud.google.com/>

1. Crie um projeto (ou selecione um existente).
2. **APIs e serviços → Tela de permissão OAuth**
   - Tipo: **Externo**
   - Nome do app: `PokéFan`
   - E-mail de suporte e e-mail do desenvolvedor: o seu
   - Salvar
3. **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**
   - Tipo: **Aplicativo da Web**
   - **Origens JavaScript autorizadas:**
     ```
     https://pokefan-inky.vercel.app
     http://localhost:5174
     ```
   - **URIs de redirecionamento autorizados:** apenas o callback do Supabase.
     Substitua `SEU_PROJECT_REF` pelo ref do seu projeto (está na URL do
     painel do Supabase e no seu `VITE_SUPABASE_URL`):
     ```
     https://SEU_PROJECT_REF.supabase.co/auth/v1/callback
     ```
4. Copie o **ID do cliente** e a **Chave secreta do cliente**.

> A chave secreta vai para o painel do Supabase, nunca para o `.env` do
> frontend — tudo com prefixo `VITE_` é embutido no bundle e fica público.

---

## 2. Supabase — habilitar o provedor

Painel do projeto → **Authentication → Providers → Google**

1. Ligue o **Enable Sign in with Google**
2. Cole o **Client ID** e o **Client Secret** do passo 1
3. Salvar

---

## 3. Supabase — URLs de redirecionamento

Painel → **Authentication → URL Configuration**

- **Site URL:**
  ```
  https://pokefan-inky.vercel.app
  ```
- **Redirect URLs:** adicione as duas
  ```
  https://pokefan-inky.vercel.app/**
  http://localhost:5174/**
  ```

Sem isso o Google autentica mas o Supabase recusa a volta, e o usuário cai numa
tela de erro em vez de entrar no app.

---

## 4. Conferir

1. Abra <https://pokefan-inky.vercel.app/> numa janela anônima
2. Clique em **Continuar com Google** e escolha uma conta
3. Deve voltar direto para o painel, já logado
4. Confirme que o usuário chegou ao banco:
   ```sql
   select email, created_at, confirmed_at, last_sign_in_at
   from auth.users
   order by created_at desc;
   ```

Conta criada via Google já vem com `confirmed_at` preenchido — o Google já
verificou o e-mail, então não há etapa de confirmação.

---

## Observação sobre confirmação de e-mail

Para cadastro com e-mail e senha, o comportamento depende de
**Authentication → Providers → Email → Confirm email**:

- **Ligado** (padrão): `signUp` devolve usuário sem sessão. O app mostra a tela
  "Confirme seu e-mail" e **não** entra — sem sessão a RLS bloqueia tudo e
  qualquer gravação na nuvem seria descartada em silêncio.
- **Desligado**: a sessão vem junto e o app entra direto.

O código trata os dois casos. Desligar reduz atrito no teste, mas permite
cadastro com e-mail de terceiros.
