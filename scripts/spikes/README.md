# Spike Stripe Billing — T0.2 e T0.3

Este diretório contém o harness do spike descartável de assinaturas. Ele serve para provar o fluxo antes de implementar o domínio de billing e **não é código de produção**.

## T0.2 — Checklist da conta Stripe (ação manual)

> Esta tarefa depende de acesso à conta Stripe e não pode ser feita por código.

- [x] Criar conta Stripe com titularidade e dados fiscais da Echo.
- [x] Confirmar país da conta: **Brasil** (`acct_1Rg5tYFTfV9EeZEH`).
- [x] Confirmar moeda padrão: **BRL**.
- [ ] Habilitar pagamentos com **cartão de crédito** — `charges_enabled: false`, `details_submitted: false` (onboarding nunca iniciado).
- [x] Criar uma chave secreta de **test mode** (`sk_test_...`).
- [ ] Criar o endpoint de webhook de test mode apontando para `https://<túnel>/webhooks/stripe` e copiar o `whsec_...`.
- [x] Registrar as chaves no gerenciador de segredos (nunca no repositório):
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET` (via `stripe listen --print-secret`)
  - `STRIPE_PORTAL_CONFIGURATION_ID` (pode ficar vazio até a T2.4)
- [x] Confirmar acesso ao Dashboard de test mode e aos test clocks.

> **Pendência única:** concluir o onboarding da conta para `charges_enabled = true`. O restante do
> checklist está atendido em test mode.

### Alternativa local sem túnel

Use o Stripe CLI para encaminhar eventos:

```bash
stripe login
stripe listen --forward-to localhost:3333/webhooks/stripe
```

O `stripe listen` imprime um `whsec_...`; para obter só o segredo sem abrir o listener:

```bash
stripe listen --print-secret
```

Esse valor já está em `STRIPE_WEBHOOK_SECRET` no `.env` local. A verificação HMAC-SHA256
(`t` + `v1`) foi validada com esse segredo.

## T0.3 — Roteiro do spike

### Preparação

```bash
cd echo-api
node --env-file=.env scripts/spikes/stripe-spike.mjs whoami
```

Confirme: `country: "BR"`, `default_currency: "brl"`, `charges_enabled: true`.

Crie os preços de teste (idempotente por `lookup_key`):

```bash
node --env-file=.env scripts/spikes/stripe-spike.mjs seed-price --code free     --name "Echo Free"     --amount 0
node --env-file=.env scripts/spikes/stripe-spike.mjs seed-price --code starter  --name "Echo Starter"  --amount 2990
node --env-file=.env scripts/spikes/stripe-spike.mjs seed-price --code pro      --name "Echo Pro"      --amount 7990
node --env-file=.env scripts/spikes/stripe-spike.mjs seed-price --code business --name "Echo Business" --amount 19990
```

### 1. Checkout com cartão

```bash
node --env-file=.env scripts/spikes/stripe-spike.mjs clock --name "Echo ciclo 1"
node --env-file=.env scripts/spikes/stripe-spike.mjs customer --email dev@echo.test --clock <clock_id>
node --env-file=.env scripts/spikes/stripe-spike.mjs checkout --customer <cus_id> --lookup starter
```

Abra a `url` retornada, pague com `4242 4242 4242 4242` (qualquer validade futura e CVC) e depois consulte:

```bash
node --env-file=.env scripts/spikes/stripe-spike.mjs status --customer <cus_id>
node --env-file=.env scripts/spikes/stripe-spike.mjs invoices --customer <cus_id>
node --env-file=.env scripts/spikes/stripe-spike.mjs events --type invoice.paid
```

**Esperado:** assinatura `active`, `current_period_end` ~1 mês à frente, invoice `paid`, evento `invoice.paid`.

### 2. Renovação com test clock

```bash
node --env-file=.env scripts/spikes/stripe-spike.mjs advance --clock <clock_id> --days 35
node --env-file=.env scripts/spikes/stripe-spike.mjs status --customer <cus_id>
node --env-file=.env scripts/spikes/stripe-spike.mjs invoices --customer <cus_id>
```

**Esperado:** novo período, segunda invoice `paid`, segundo `invoice.paid`.

> O customer precisa ter sido criado **já no test clock**. Não é possível mover um customer existente para um clock.

### 3. Falha de cartão e inadimplência

`tok_chargeDeclined` é rejeitado na criação do `PaymentMethod` nesta conta (raw card data
bloqueado). A falha é simulada removendo os meios de pagamento antes da renovação:

```bash
node --env-file=.env scripts/spikes/stripe-spike.mjs remove-pms --customer <cus_id> --subscription <sub_id>
node --env-file=.env scripts/spikes/stripe-spike.mjs advance --clock <clock_id> --days 35
node --env-file=.env scripts/spikes/stripe-spike.mjs clock-status --clock <clock_id>
node --env-file=.env scripts/spikes/stripe-spike.mjs status --subscription <sub_id>
node --env-file=.env scripts/spikes/stripe-spike.mjs events --type invoice.payment_failed
```

**Esperado:** `invoice.payment_failed`, assinatura `past_due` e invoice `open`. O avanço do
test clock é assíncrono: consulte `clock-status` até `ready`.

### 4. Customer Portal

```bash
node --env-file=.env scripts/spikes/stripe-spike.mjs portal --customer <cus_id>
```

Abra a URL e valide troca de cartão e cancelamento no fim do período.

### 5. Cancelamento e reativação

```bash
node --env-file=.env scripts/spikes/stripe-spike.mjs cancel --subscription <sub_id>
node --env-file=.env scripts/spikes/stripe-spike.mjs status --subscription <sub_id>
node --env-file=.env scripts/spikes/stripe-spike.mjs reactivate --subscription <sub_id>
```

**Esperado:** `cancel_at_period_end` alterna entre `true` e `false`; `status` continua `active`.

### 6. Upgrade sem prorrata

```bash
node --env-file=.env scripts/spikes/stripe-spike.mjs status --subscription <sub_id>
# use o item_id retornado acima
node --env-file=.env scripts/spikes/stripe-spike.mjs change-plan \
  --subscription <sub_id> --item <si_id> --lookup pro
node --env-file=.env scripts/spikes/stripe-spike.mjs invoices --customer <cus_id>
```

**Esperado:** o `price` do item muda e nenhuma invoice nova aparece antes do próximo ciclo.

## Resultado executado (13/11/2026)

Execução completa em test mode. Evidências estruturadas em
[`evidence-t0.3.json`](./evidence-t0.3.json).

| Item | Resultado | Evidência |
| --- | --- | --- |
| Conta BR / BRL | ✅ | `acct_1Rg5tYFTfV9EeZEH`, `BR`, `brl` |
| Checkout com cartão | ✅ criado e expirado | `cs_test_a0Ug…`, `evt_1Ub8n8…` |
| Ativação por `invoice.paid` | ✅ (via criação direta de assinatura) | `evt_1Ub8kf…`, `in_1Ub8kd…` |
| `checkout.session.completed` | ✅ via CLI (sintético) | `evt_1Ub93y…`, `mode=payment`, `payment_status=paid` |
| Renovação após ciclos | ✅ 2 renovações | `in_…0002`, `in_…0003` |
| Falha de cobrança | ✅ | `in_…0004`, `evt_1Ub8md…`, `past_due` |
| Portal abre | ✅ | sessão gerada |
| `cancel_at_period_end` | ✅ | `true` + `cancel_at` |
| Reativação | ✅ | `false` + `cancel_at = null` |
| Upgrade sem prorrata | ✅ | Price `starter` → `pro`, sem invoice nova |
| Payload sem PAN/CVV | ✅ | nenhum caminho `card|pan|cvc|expiry` no evento |
| Assinatura do webhook | ✅ verificação local | HMAC-SHA256 válido; payload/segredo adulterados rejeitados |

### Pendências herdadas para tarefas seguintes

- **Checkout `mode=subscription` pago em browser**: o fixture de `stripe trigger checkout.session.completed`
  cria `mode=payment` e forçar `mode=subscription` falha (`parameter_unknown: subscription`). A ativação
  de assinatura já foi provada por criação direta via API. Validar o checkout real em T8.2.
- **Endpoint real**: o forward do CLI foi provado em um receiver descartável; a rota `POST /webhooks/stripe`
  nasce em T2.4.
- **Cobrança real**: `charges_enabled = false`; depende de concluir o onboarding da conta.

### Forward de webhook (validado em 13/11/2026)

```bash
node --env-file=.env /tmp/stripe-receiver.mjs /tmp/events.log   # receiver descartável em :4242
stripe listen --all-snapshot --forward-to localhost:4242/webhook
stripe trigger checkout.session.completed \
  --override checkout_session:customer=cus_xxx \
  --override checkout_session:client_reference_id=<uuid>
stripe trigger invoice.paid
```

Resultado: uma entrega por evento, `Stripe-Signature` válida sobre o raw body, e
`client_reference_id` preservado no `checkout.session.completed`.

> Cuidado: `stripe listen` spawna um processo filho. Matar só o PID pai deixa listeners órfãos e
> gera entregas duplicadas. Use `pkill -f "stripe listen --forward-to localhost:4242"`.

## Evidências a registrar (modelo)

| Item | Resultado | Evidência |
| --- | --- | --- |
| Conta BR / BRL | | `whoami` |
| Checkout com cartão | | `session.id`, `sub_id` |
| Ativação por `invoice.paid` | | `event.id`, timestamp |
| `checkout.session.completed` antes/depois de `invoice.paid` | | ordem observada |
| Renovação após 1 ciclo | | `invoice.id` novo, `period_end` |
| Falha de cartão | | `invoice.payment_failed`, `status` |
| Portal abre e troca cartão | | print/URL |
| `cancel_at_period_end` | | `status` + flag |
| Reativação | | flag `false` |
| Upgrade sem prorrata | | invoice do ciclo seguinte |
| Payload do webhook sem PAN/CVV | | inspeção do evento |

## Limpeza

O harness não apaga nada. Em test mode, test clocks e objetos podem ser removidos pelo Dashboard. **Nunca rode este script com chave live** — ele aborta se detectar `sk_live`/`rk_live`.
