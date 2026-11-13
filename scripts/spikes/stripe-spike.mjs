#!/usr/bin/env node
/**
 * Spike descartável do Stripe Billing (T0.3).
 *
 * Objetivo: provar o fluxo de assinatura com cartão antes de escrever código
 * de produção. Usa apenas `fetch` nativo, então roda sem instalar o SDK.
 *
 * Uso:
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs whoami
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs clock --name "Echo cycle"
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs customer --email dev@echo.test --clock clock_xxx
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs seed-price --code starter --name Starter --amount 2990
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs price --lookup starter
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs checkout --customer cus_xxx --price price_xxx
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs subscribe --customer cus_xxx --lookup starter
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs status --subscription sub_xxx
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs advance --clock clock_xxx --days 35
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs clock-status --clock clock_xxx
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs invoices --customer cus_xxx
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs portal --customer cus_xxx
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs change-plan --subscription sub_xxx --item si_xxx --lookup pro
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs cancel --subscription sub_xxx
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs reactivate --subscription sub_xxx
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs remove-pms --customer cus_xxx --subscription sub_xxx
 *   node --env-file=.env scripts/spikes/stripe-spike.mjs events --type invoice.paid
 *
 * Requer STRIPE_SECRET_KEY de test mode. Nunca use chave live aqui.
 */

import { randomUUID } from "node:crypto";

const API_BASE = "https://api.stripe.com/v1";
const API_VERSION = process.env.STRIPE_API_VERSION;

const secretKey = process.env.STRIPE_SECRET_KEY;

function assertTestKey() {
  if (!secretKey) {
    fail("STRIPE_SECRET_KEY não definida. Use: node --env-file=.env scripts/spikes/stripe-spike.mjs ...");
  }

  if (secretKey.startsWith("sk_live") || secretKey.startsWith("rk_live")) {
    fail("Este spike só pode rodar com chave de test mode (sk_test_...). Abortando.");
  }
}

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (!value.startsWith("--")) {
      args._.push(value);
      continue;
    }

    const key = value.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function flatten(value, prefix, output) {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, output));
    return;
  }

  if (typeof value === "object" && !(value instanceof Date)) {
    for (const [key, item] of Object.entries(value)) {
      flatten(item, prefix ? `${prefix}[${key}]` : key, output);
    }
    return;
  }

  output.push([prefix, String(value)]);
}

async function stripe(method, path, params, idempotencyKey) {
  const url = new URL(`${API_BASE}${path}`);

  if (method === "GET" && params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const headers = {
    Authorization: `Bearer ${secretKey}`,
  };

  if (API_VERSION) {
    headers["Stripe-Version"] = API_VERSION;
  }

  let body;

  if (method !== "GET" && params) {
    const pairs = [];
    flatten(params, "", pairs);
    body = new URLSearchParams(pairs).toString();
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch(url, { method, headers, body });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message ?? `HTTP ${response.status}`;
    const code = payload?.error?.code ?? payload?.error?.type ?? "unknown";
    throw new Error(`${code}: ${message}`);
  }

  return payload;
}

function print(label, data) {
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(data));
    return;
  }

  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(data, null, 2));
}

function requireArg(args, name) {
  const value = args[name];

  if (!value || value === true) {
    fail(`Parâmetro --${name} é obrigatório.`);
  }

  return value;
}

async function resolvePrice(args) {
  if (args.price) return args.price;
  const lookup = requireArg(args, "lookup");

  const result = await stripe("GET", "/prices", {
    "lookup_keys[0]": lookup,
    active: "true",
    limit: 1,
  });

  const price = result.data?.[0];

  if (!price) {
    fail(`Nenhum Price ativo com lookup_key="${lookup}". Rode a sincronização de preços primeiro.`);
  }

  return price.id;
}

async function createCardPaymentMethod(testToken) {
  const paymentMethod = await stripe(
    "POST",
    "/payment_methods",
    {
      type: "card",
      "card[token]": testToken,
    },
    `spike-pm-${randomUUID()}`,
  );

  return paymentMethod.id;
}

async function main() {
  const rawArgs = process.argv.slice(2).filter((arg) => arg !== "--json");
  const [command] = rawArgs;
  const args = parseArgs(rawArgs.slice(1));

  if (command && command !== "help") {
    assertTestKey();
  }

  switch (command) {
    case "whoami": {
      const account = await stripe("GET", "/account");
      print("Conta Stripe", {
        id: account.id,
        country: account.country,
        default_currency: account.default_currency,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      });
      break;
    }

    case "clock": {
      const clock = await stripe(
        "POST",
        "/test_helpers/test_clocks",
        {
          frozen_time: Math.floor(Date.now() / 1000),
          name: args.name ?? "Echo spike",
        },
        `spike-clock-${randomUUID()}`,
      );
      print("Test clock criado", { id: clock.id, frozen_time: clock.frozen_time, name: clock.name });
      break;
    }

    case "clock-status": {
      const clock = await stripe("GET", `/test_helpers/test_clocks/${requireArg(args, "clock")}`);
      print("Test clock", { id: clock.id, status: clock.status, frozen_time: clock.frozen_time });
      break;
    }

    case "advance": {
      const clockId = requireArg(args, "clock");
      const days = Number(args.days ?? 30);
      const clock = await stripe("GET", `/test_helpers/test_clocks/${clockId}`);
      const frozenTime = clock.frozen_time + days * 24 * 60 * 60;

      const advanced = await stripe("POST", `/test_helpers/test_clocks/${clockId}/advance`, {
        frozen_time: frozenTime,
      });

      print("Test clock avançado", {
        id: advanced.id,
        status: advanced.status,
        frozen_time: advanced.frozen_time,
      });
      break;
    }

    case "customer": {
      const customer = await stripe(
        "POST",
        "/customers",
        {
          email: requireArg(args, "email"),
          name: args.name,
          ...(args.clock ? { test_clock: args.clock } : {}),
          metadata: { userId: args["user-id"] ?? "spike-user" },
        },
        `spike-customer-${randomUUID()}`,
      );
      print("Customer criado", { id: customer.id, email: customer.email, test_clock: customer.test_clock });
      break;
    }

    case "seed-price": {
      const code = requireArg(args, "code");
      const lookup = args.lookup ?? code;

      const existing = await stripe("GET", "/prices", {
        "lookup_keys[0]": lookup,
        active: "true",
        limit: 1,
      });

      if (existing.data?.[0]) {
        print("Price já existe", summarizePrice(existing.data[0]));
        break;
      }

      const product = await stripe(
        "POST",
        "/products",
        {
          name: requireArg(args, "name"),
          "metadata[planCode]": code,
        },
        `spike-product-${code}-${randomUUID()}`,
      );

      const price = await stripe(
        "POST",
        "/prices",
        {
          product: product.id,
          unit_amount: Number(requireArg(args, "amount")),
          currency: args.currency ?? "brl",
          "recurring[interval]": "month",
          lookup_key: lookup,
          "metadata[planCode]": code,
        },
        `spike-price-${code}-${args.amount}-${randomUUID()}`,
      );

      print("Price criado", { ...summarizePrice(price), product: product.id });
      break;
    }

    case "price": {
      const priceId = await resolvePrice(args);
      const price = await stripe("GET", `/prices/${priceId}`, { "expand[0]": "product" });
      print("Price", {
        id: price.id,
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
        lookup_key: price.lookup_key,
        product: price.product?.name ?? price.product,
      });
      break;
    }

    case "checkout": {
      const session = await stripe(
        "POST",
        "/checkout/sessions",
        {
          mode: "subscription",
          customer: requireArg(args, "customer"),
          "payment_method_types[0]": "card",
          "line_items[0][price]": await resolvePrice(args),
          "line_items[0][quantity]": 1,
          client_reference_id: args["client-reference-id"] ?? `spike-${randomUUID()}`,
          "subscription_data[metadata][source]": "spike",
          success_url: args["success-url"] ?? "https://example.com/assinatura?checkout=success",
          cancel_url: args["cancel-url"] ?? "https://example.com/assinatura?checkout=cancel",
          "metadata[source]": "spike",
        },
        `spike-checkout-${randomUUID()}`,
      );
      print("Checkout Session", {
        id: session.id,
        url: session.url,
        expires_at: session.expires_at,
        status: session.status,
      });
      break;
    }

    case "subscribe": {
      const customerId = requireArg(args, "customer");
      let paymentMethod = args["payment-method"];

      if (!paymentMethod) {
        paymentMethod = await createCardPaymentMethod("tok_visa");
        await stripe("POST", `/payment_methods/${paymentMethod}/attach`, { customer: customerId });
      }

      const subscription = await stripe(
        "POST",
        "/subscriptions",
        {
          customer: customerId,
          "items[0][price]": await resolvePrice(args),
          default_payment_method: paymentMethod,
          payment_behavior: "allow_incomplete",
          "expand[0]": "latest_invoice",
          "metadata[source]": "spike",
        },
        `spike-subscribe-${randomUUID()}`,
      );

      print("Assinatura criada", {
        ...summarizeSubscription(subscription),
        payment_method: paymentMethod,
        latest_invoice_status: subscription.latest_invoice?.status,
      });
      break;
    }

    case "expire-checkout": {
      const session = await stripe("POST", `/checkout/sessions/${requireArg(args, "session")}/expire`);
      print("Checkout expirado", { id: session.id, status: session.status });
      break;
    }

    case "status": {
      if (args.customer) {
        const subscriptions = await stripe("GET", "/subscriptions", {
          customer: args.customer,
          status: "all",
          limit: 10,
        });
        print("Assinaturas do customer", subscriptions.data.map(summarizeSubscription));
        break;
      }

      const subscription = await stripe("GET", `/subscriptions/${requireArg(args, "subscription")}`, {
        "expand[0]": "latest_invoice",
      });
      print("Assinatura", summarizeSubscription(subscription));
      break;
    }

    case "invoices": {
      const invoices = await stripe("GET", "/invoices", {
        customer: args.customer,
        subscription: args.subscription,
        limit: 10,
      });
      print(
        "Invoices",
        invoices.data.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          amount_due: invoice.amount_due,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
          created: invoice.created,
          period_start: invoice.period_start,
          period_end: invoice.period_end,
          paid: invoice.paid,
          hosted_invoice_url: invoice.hosted_invoice_url,
          subscription: invoice.parent?.subscription_details?.subscription ?? invoice.subscription,
        })),
      );
      break;
    }

    case "portal": {
      const session = await stripe(
        "POST",
        "/billing_portal/sessions",
        {
          customer: requireArg(args, "customer"),
          return_url: args["return-url"] ?? "https://example.com/assinatura",
        },
        `spike-portal-${randomUUID()}`,
      );
      print("Customer Portal", { url: session.url });
      break;
    }

    case "change-plan": {
      const subscription = await stripe(
        "POST",
        `/subscriptions/${requireArg(args, "subscription")}`,
        {
          "items[0][id]": requireArg(args, "item"),
          "items[0][price]": await resolvePrice(args),
          proration_behavior: args.proration ?? "none",
        },
        `spike-change-plan-${randomUUID()}`,
      );

      print("Plano alterado", summarizeSubscription(subscription));
      break;
    }

    case "cancel": {
      const subscription = await stripe("POST", `/subscriptions/${requireArg(args, "subscription")}`, {
        cancel_at_period_end: "true",
      });
      print("Cancelamento agendado", summarizeSubscription(subscription));
      break;
    }

    case "reactivate": {
      const subscription = await stripe("POST", `/subscriptions/${requireArg(args, "subscription")}`, {
        cancel_at_period_end: "false",
      });
      print("Assinatura reativada", summarizeSubscription(subscription));
      break;
    }

    case "remove-pms": {
      const customerId = requireArg(args, "customer");

      if (args.subscription) {
        await stripe("POST", `/subscriptions/${args.subscription}`, { default_payment_method: "" });
      }

      await stripe("POST", `/customers/${customerId}`, {
        "invoice_settings[default_payment_method]": "",
      });

      const paymentMethods = await stripe("GET", `/customers/${customerId}/payment_methods`, {
        type: "card",
        limit: 20,
      });

      const removed = [];

      for (const paymentMethod of paymentMethods.data ?? []) {
        await stripe("POST", `/payment_methods/${paymentMethod.id}/detach`);
        removed.push(paymentMethod.id);
      }

      print("Meios de pagamento removidos", { customer: customerId, removed });
      break;
    }

    case "events": {
      const events = await stripe("GET", "/events", {
        limit: 20,
        ...(args.type ? { type: args.type } : {}),
      });

      print(
        "Eventos",
        events.data.map((event) => ({
          id: event.id,
          type: event.type,
          created: event.created,
          object: event.data?.object?.id,
          status: event.data?.object?.status,
          subscription:
            event.data?.object?.parent?.subscription_details?.subscription ??
            event.data?.object?.subscription,
        })),
      );
      break;
    }

    default: {
      console.log(`
Stripe spike — comandos disponíveis:

  whoami
  clock --name "Echo cycle"
  advance --clock clock_xxx --days 35
  clock-status --clock clock_xxx
  customer --email dev@echo.test [--name "Dev"] [--clock clock_xxx] [--user-id uuid]
  seed-price --code starter --name Starter --amount 2990 [--lookup starter]
  price --lookup starter | --price price_xxx
  checkout --customer cus_xxx (--lookup starter | --price price_xxx)
  subscribe --customer cus_xxx (--lookup starter | --price price_xxx) [--payment-method pm_xxx]
  expire-checkout --session cs_xxx
  status --subscription sub_xxx | --customer cus_xxx
  change-plan --subscription sub_xxx --item si_xxx (--lookup pro | --price price_xxx) [--proration none]
  invoices --customer cus_xxx
  portal --customer cus_xxx
  cancel --subscription sub_xxx
  reactivate --subscription sub_xxx
  remove-pms --customer cus_xxx [--subscription sub_xxx]
  events [--type invoice.paid]
`);
    }
  }
}

function summarizePrice(price) {
  return {
    id: price.id,
    unit_amount: price.unit_amount,
    currency: price.currency,
    recurring: price.recurring,
    lookup_key: price.lookup_key,
  };
}

function summarizeSubscription(subscription) {
  const item = subscription.items?.data?.[0];

  return {
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at,
    // A partir das versões recentes da API, o período fica no subscription item.
    current_period_start: subscription.current_period_start ?? item?.current_period_start,
    current_period_end: subscription.current_period_end ?? item?.current_period_end,
    latest_invoice: subscription.latest_invoice?.id ?? subscription.latest_invoice,
    price: item?.price?.id,
    amount: item?.price?.unit_amount,
    currency: item?.price?.currency,
    item_id: item?.id,
    default_payment_method: subscription.default_payment_method,
  };
}

main().catch((error) => {
  fail(error.message);
});
