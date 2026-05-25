/**
 * mercadoPago.js — Integração com API do Mercado Pago (Pix)
 * Salve em: src/utils/mercadoPago.js
 *
 * Lê configurações de: database/mercadopago.json
 * Configure com: .setmp token|email|cpf|descricao <valor>
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DB_DIR  = path.resolve(__dirname, "..", "..", "database");
const DB_PATH = path.resolve(DB_DIR, "mercadopago.json");

const DEFAULT_CONFIG = {
  access_token: "",
  payer_email:  "",
  payer_cpf:    "",
  description:  "VIP - Bot WhatsApp",
};

// ─── LEITURA / ESCRITA ────────────────────────────────────────────────────────

export function getMpConfig() {
  if (!fs.existsSync(DB_DIR))  fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
  try   { return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(DB_PATH, "utf8")) }; }
  catch { return { ...DEFAULT_CONFIG }; }
}

export function setMpConfig(key, value) {
  const cfg = getMpConfig();
  cfg[key]  = value;
  fs.writeFileSync(DB_PATH, JSON.stringify(cfg, null, 2));
  return cfg;
}

export function isMpConfigured() {
  const cfg = getMpConfig();
  return !!(cfg.access_token && cfg.payer_email && cfg.payer_cpf);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function expirationDate(minutesFromNow = 30) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutesFromNow);
  return d.toISOString().slice(0, -1) + "-03:00";
}

function idempotencyKey() {
  return `vip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function mpFetch(method, endpoint, body = null) {
  const cfg  = getMpConfig();

  // DEBUG — mostra o token lido do JSON (remova depois de resolver)
  console.log(`[MP DEBUG] access_token lido: "${cfg.access_token ? cfg.access_token.slice(0, 20) + "..." : "VAZIO"}"`);
  console.log(`[MP DEBUG] DB_PATH: ${DB_PATH}`);

  if (!cfg.access_token) {
    throw new Error("Access Token do Mercado Pago não configurado! Use .setmp token <seu_token>");
  }

  const opts = {
    method,
    headers: {
      "Authorization":     `Bearer ${cfg.access_token}`,
      "Content-Type":      "application/json",
      "X-Idempotency-Key": idempotencyKey(),
    },
    signal: AbortSignal.timeout(30_000),
  };
  if (body) opts.body = JSON.stringify(body);

  const res  = await fetch(`https://api.mercadopago.com${endpoint}`, opts);
  const data = await res.json();

  if (!res.ok) {
    console.error("[MP ERROR RESPONSE]", JSON.stringify(data, null, 2));
    const cause = data?.cause?.[0]?.description || data?.message || JSON.stringify(data);
    throw new Error(`MP API ${res.status}: ${cause}`);
  }
  return data;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export async function createPixPayment(value, minutes = 30) {
  const cfg = getMpConfig();

  // No sandbox do MP, o payer.email deve ser um e-mail de conta de teste compradora
  // Em produção, pode ser qualquer e-mail válido
  const isTest = cfg.access_token?.startsWith("TEST-");

  const data = await mpFetch("POST", "/v1/payments", {
    transaction_amount: parseFloat(value),
    description:        cfg.description || "VIP - Bot WhatsApp",
    payment_method_id:  "pix",
    payer: {
      email: isTest ? `test_user_${Date.now()}@testuser.com` : cfg.payer_email,
      ...(isTest ? {} : {
        identification: { type: "CPF", number: cfg.payer_cpf },
      }),
    },
    date_of_expiration: expirationDate(minutes),
  });

  return {
    payment_id:     String(data.id),
    copy_paste:     data.point_of_interaction.transaction_data.qr_code,
    qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
  };
}

export async function checkPayment(paymentId) {
  const data = await mpFetch("GET", `/v1/payments/${paymentId}`);
  return data.status;
}
