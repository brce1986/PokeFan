# Templates de e-mail com a marca PokéFan

> **BLOQUEADO no plano gratuito.** A personalização de templates exige plano Pro
> — verificado no painel em 23/07/2026. Até a migração de plano, os e-mails saem
> com o visual e o remetente padrão do provedor de autenticação.
>
> Os templates abaixo ficam prontos para o dia em que o plano mudar ou o SMTP
> próprio for configurado. Nada aqui é acionável hoje.

Cole cada bloco em **Supabase → Authentication → Email Templates**, na aba
correspondente. São templates Go — as variáveis `{{ .ConfirmationURL }}` e
`{{ .Email }}` são preenchidas pelo Supabase no envio.

O logo é servido pelo próprio app (`/logo_transparent.png`). Se o domínio mudar,
troque a URL nos dois templates.

Paleta usada, igual à do app: `#bc000a` (vermelho Pokédex), `#ffcb09` (amarelo),
`#191c1d` (texto), `#f8f9fa` (fundo).

> Estes templates trocam o visual do e-mail. O **remetente** continua sendo o do
> Supabase até você configurar SMTP próprio — veja `supabase/custom-smtp.md`.

---

## Confirm signup

**Subject:** `Confirme seu e-mail — PokéFan`

```html
<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(188,0,10,0.10);">

            <tr>
              <td align="center" style="background-color:#bc000a;padding:28px 24px;">
                <img src="https://pokefan-inky.vercel.app/logo_transparent.png" width="56" height="56" alt="PokéFan" style="display:block;border:0;" />
                <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;padding-top:10px;">
                  PokéFan
                </div>
                <div style="color:#ffcb09;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding-top:2px;">
                  Coleção TCG
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:800;color:#191c1d;letter-spacing:-0.3px;">
                  Falta um passo
                </h1>
                <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#3f4547;">
                  Confirme <strong style="color:#191c1d;">{{ .Email }}</strong> para ativar sua conta
                  e começar a montar seu binder digital.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:0 32px 24px 32px;">
                <a href="{{ .ConfirmationURL }}"
                   style="display:inline-block;background-color:#bc000a;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 36px;border-radius:12px;">
                  Confirmar meu e-mail
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 28px 32px;">
                <p style="margin:0 0 6px 0;font-size:12px;color:#6b7173;line-height:1.5;">
                  Se o botão não funcionar, copie e cole este endereço no navegador:
                </p>
                <p style="margin:0;font-size:11px;color:#3c4dcb;word-break:break-all;line-height:1.5;">
                  {{ .ConfirmationURL }}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 32px;background-color:#f3f4f5;border-top:1px solid #e1e3e4;">
                <p style="margin:0;font-size:11px;color:#6b7173;line-height:1.6;text-align:center;">
                  Você não criou essa conta? Ignore este e-mail — nada será ativado sem a confirmação.
                </p>
              </td>
            </tr>

          </table>

          <p style="margin:20px 0 0 0;font-size:11px;color:#8b9193;text-align:center;">
            PokéFan · Seu Pokédex de coleção de cartas
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## Reset password

**Subject:** `Redefinir sua senha — PokéFan`

```html
<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(188,0,10,0.10);">

            <tr>
              <td align="center" style="background-color:#bc000a;padding:28px 24px;">
                <img src="https://pokefan-inky.vercel.app/logo_transparent.png" width="56" height="56" alt="PokéFan" style="display:block;border:0;" />
                <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;padding-top:10px;">
                  PokéFan
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:800;color:#191c1d;letter-spacing:-0.3px;">
                  Redefinir senha
                </h1>
                <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#3f4547;">
                  Recebemos um pedido para redefinir a senha de
                  <strong style="color:#191c1d;">{{ .Email }}</strong>.
                  O link vale por 1 hora.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:0 32px 24px 32px;">
                <a href="{{ .ConfirmationURL }}"
                   style="display:inline-block;background-color:#bc000a;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 36px;border-radius:12px;">
                  Criar nova senha
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 32px;background-color:#f3f4f5;border-top:1px solid #e1e3e4;">
                <p style="margin:0;font-size:11px;color:#6b7173;line-height:1.6;text-align:center;">
                  Não foi você? Ignore este e-mail. Sua senha atual continua valendo.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```
