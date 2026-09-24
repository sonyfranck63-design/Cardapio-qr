# Checklist Definitivo de Deploy & Operação — CardápioQR

Este documento é o guia oficial de implantação, configuração e validação do SaaS **CardápioQR** para lançamento em produção.

---

## 1. Variáveis de Ambiente na Vercel

Acesse seu projeto na Vercel em **Settings** > **Environment Variables** e garanta que todas as variáveis abaixo estejam configuradas para os ambientes **Production**, **Preview** e **Development**:

| Variável | Descrição / Exemplo | Onde Obter |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | URL pública oficial da aplicação (ex.: `https://cardapio-qr-pro.vercel.app`) | Painel da Vercel ou seu domínio próprio |
| `NEXT_PUBLIC_SUPABASE_URL` | Endpoint da sua instância Supabase (ex.: `https://xxxx.supabase.co`) | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anônima do Supabase | Supabase > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta de administração (bypass de RLS para RPCs e Superadmin) | Supabase > Project Settings > API > `service_role` (Secret) |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de produção do Mercado Pago (inicia com `APP_USR-...`) | Mercado Pago Developers > Credenciais de Produção |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Chave pública do Mercado Pago | Mercado Pago Developers > Credenciais de Produção |
| `MERCADOPAGO_WEBHOOK_SECRET` | Chave secreta do Webhook para assinatura criptográfica HMAC-SHA256 | Mercado Pago Developers > Webhooks > Chave secreta |
| `SUPERADMIN_EMAILS` | E-mails autorizados para o painel Master, separados por vírgula | Seu e-mail de administrador (ex.: `matheusfranck2013@gmail.com`) |

> **Nota:** Sempre que adicionar ou alterar variáveis na Vercel, realize um **Redeploy** na aba *Deployments* para que o ambiente de execução carregue os novos valores.

---

## 2. Ordem de Execução das Migrações SQL no Supabase

Acesse o **SQL Editor** do Supabase (`https://supabase.com/dashboard/project/<id>/sql`) e execute os scripts na ordem numérica abaixo (ou execute diretamente o `supabase/schema.sql` consolidado caso esteja iniciando um banco do zero):

1. **`supabase/migration_security_v2.sql`** (Fase 1 — Segurança Crítica)
   - Criação da tabela `processed_payments` com idempotência.
   - Função atômica RPC `apply_payment` com `SECURITY DEFINER`.
   - Remoção de locks e colunas restritas na tabela `restaurants`.
   - RPC `delete_my_account` para exclusão de conta em conformidade com a LGPD.
2. **`supabase/migration_phase2.sql`** (Fase 2 — Correções do Cardápio)
   - Habilitação da extensão `unaccent`.
   - Atualização do gerador de slug sem acentos fonéticos.
3. **`supabase/migration_phase3.sql`** (Fase 3 — Redesign Visual e Temas)
   - Colunas de temas em `restaurants`: `theme_color`, `theme_font`, `cover_url`, `tagline`, `address`, `opening_hours`, `instagram`, `show_sold_out`.
   - Atualização de permissões de colunas (`GRANT UPDATE` / `GRANT SELECT`).
4. **`supabase/migration_phase4.sql`** (Fase 4 — Anti-Abuso e E-mail)
   - Tabela `public.trial_history` para rastreamento de trials por e-mail normalizado.
   - Função `public.normalize_email()` (remove aliases `+` e pontos de Gmail).
   - Triggers `on_auth_user_created` e `on_auth_user_email_confirmed` para ativação dos 7 dias grátis condicionada à verificação de e-mail.

---

## 3. Configuração do Webhook no Mercado Pago

Para que a assinatura seja renovada automaticamente quando o cliente pagar:

1. Acesse: [https://www.mercadopago.com.br/developers/panel/app](https://www.mercadopago.com.br/developers/panel/app)
2. Selecione a aplicação do **CardápioQR**.
3. No menu lateral esquerdo, clique em **Webhooks** (ou **Notificações Webhooks**).
4. No campo **URL de Produção**, insira:
   ```text
   https://cardapio-qr-pro.vercel.app/api/mercadopago/webhook
   ```
5. Nos **Eventos**, marque:
   - [x] **Pagamentos** (`payment`)
6. Clique em **Salvar**.
7. Na tela, copie o valor do campo **Chave secreta** / **Secret da assinatura** e adicione na Vercel com o nome `MERCADOPAGO_WEBHOOK_SECRET`.

---

## 4. Como Testar com Contas de Teste (Sandbox)

### Passo A: Criar Contas de Teste no Mercado Pago
1. No painel de desenvolvedores do Mercado Pago, vá em **Contas de teste** (menu lateral).
2. Crie duas contas:
   - **Vendedor de teste**: para associar às credenciais de teste do SaaS (se desejar testar o fluxo em staging).
   - **Comprador de teste**: conta com saldo fictício e cartões de teste vinculados.

### Passo B: Cartões de Crédito de Teste Oficiais
Utilize os seguintes dados ao simular pagamento por cartão no checkout do Mercado Pago:

- **Número do Cartão**: `APRO` (Cartão aprovado instantaneamente)
  - Número: `4069 6600 0000 0000`
  - Vencimento: `11/28` (ou qualquer data futura)
  - CVV: `123`
  - Nome no cartão: `APRO`
- **Documento / CPF**: Qualquer CPF válido gerado para testes (11 dígitos).

### Passo C: Teste do Ciclo Completo de Assinatura
1. Crie uma nova conta em `/auth/register`.
2. Confirme o e-mail através do link recebido (ou no painel do Supabase em *Authentication* > *Users*).
3. Acesse `/admin/subscription`.
4. Clique em **Assinar Plano — R$ 49,90/mês**.
5. Conclua o pagamento na tela do Mercado Pago.
6. Você será redirecionado para `/admin/subscription?payment=success`.
7. O sistema iniciará o polling automático e confirmará o status **Ativo (30 dias adicionados)** sem necessidade de recarregar a página.

---

## 5. Configuração de Domínio Próprio (Opcional)

Caso queira utilizar um domínio personalizado (ex.: `cardapioqr.com.br`):

1. Na Vercel, acesse **Settings** > **Domains**.
2. Digite seu domínio e clique em **Add**.
3. No painel do seu registrador de domínio (Registro.br, Cloudflare, GoDaddy), aponte:
   - **Tipo A**: `@` -> `76.76.21.21`
   - **Tipo CNAME**: `www` -> `cname.vercel-dns.com`
4. Atualize a variável `NEXT_PUBLIC_APP_URL` na Vercel para refletir o novo domínio com `https://`.
