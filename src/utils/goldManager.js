/**
 * goldManager.js — Sistema de Gold RPG
 *
 * Colocar em: src/utils/goldManager.js
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DATABASE_DIR, PREFIX } from "../config.js";

// ─── ESM: substitui __dirname ─────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Constantes ───────────────────────────────────────────────────────────────

export const MINE_COOLDOWN  = 1  * 60 * 60 * 1000; // 1h
export const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24h
export const STEAL_COOLDOWN = 2  * 60 * 60 * 1000; // 2h
const EVENT_COOLDOWN        = 5  * 60 * 60 * 1000; // 5h
const EVENT_EXPIRE_MS       = 2  * 60 * 1000;       // 2min

// Usa DATABASE_DIR do config — ex: /projeto/database/gold.json
const GOLD_FILE = path.resolve(DATABASE_DIR, "gold.json");

// Pool de emojis para os eventos
const EVENT_EMOJIS = [
  "💎","🌟","🔥","⚡","🎯","🍀","🌈","🦄","🏆","👑",
  "🎰","🌊","🦁","🐉","🚀","🌙","☄️","🍄","🦋","🐙",
  "🎸","🎺","🎻","🥁","🎲","🃏","🎁","🧿","🪄","🔮",
];

// Timers em memória para expirar eventos (não persistido)
const eventTimers = new Map(); // remoteJid → timeoutId

// ─── Persistência ─────────────────────────────────────────────────────────────

function loadData() {
  try {
    if (!fs.existsSync(GOLD_FILE)) {
      return { players: {}, events: {} };
    }
    return JSON.parse(fs.readFileSync(GOLD_FILE, "utf-8"));
  } catch {
    return { players: {}, events: {} };
  }
}

function saveData(data) {
  try {
    // Garante que o diretório existe
    const dir = path.dirname(GOLD_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(GOLD_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[GoldManager] Erro ao salvar dados:", err.message);
  }
}

// ─── Helpers de tempo ─────────────────────────────────────────────────────────

export function formatTime(ms) {
  if (!ms || ms <= 0) return "0s";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

export function remainingMs(lastTime, cooldownMs) {
  const remaining = cooldownMs - (Date.now() - (lastTime || 0));
  return remaining > 0 ? remaining : 0;
}

export function formatGold(n) {
  return Number(n || 0).toLocaleString("pt-BR");
}

// ─── Player ───────────────────────────────────────────────────────────────────

export function getPlayer(lid, name, remoteJid) {
  const data = loadData();
  if (!data.players[lid]) {
    data.players[lid] = {
      gold:      0,
      name:      name || "Aventureiro",
      lastMine:  0,
      lastDaily: 0,
      lastSteal: 0,
      groups:    [],
    };
  }
  if (name) data.players[lid].name = name;
  if (remoteJid && !data.players[lid].groups.includes(remoteJid)) {
    data.players[lid].groups.push(remoteJid);
  }
  saveData(data);
  return data.players[lid];
}

export function updatePlayer(lid, changes) {
  const data = loadData();
  if (!data.players[lid]) return;
  Object.assign(data.players[lid], changes);
  saveData(data);
}

export function addGold(lid, name, remoteJid, amount) {
  // Garante que o player existe antes de recarregar
  const check = loadData();
  if (!check.players[lid]) getPlayer(lid, name, remoteJid);

  const fresh = loadData();
  fresh.players[lid].gold = (fresh.players[lid].gold || 0) + amount;
  if (name) fresh.players[lid].name = name;
  saveData(fresh);
  return fresh.players[lid].gold;
}

export function removeGold(lid, amount) {
  const data = loadData();
  if (!data.players[lid]) return 0;
  data.players[lid].gold = Math.max(0, (data.players[lid].gold || 0) - amount);
  saveData(data);
  return data.players[lid].gold;
}

// ─── Rankings ─────────────────────────────────────────────────────────────────

export function getGroupRanking(remoteJid, limit = 10) {
  const data = loadData();
  return Object.entries(data.players)
    .filter(([, p]) => p.groups?.includes(remoteJid) && p.gold > 0)
    .map(([lid, p]) => ({ lid, name: p.name, gold: p.gold }))
    .sort((a, b) => b.gold - a.gold)
    .slice(0, limit);
}

export function getGlobalRanking(limit = 10) {
  const data = loadData();
  return Object.entries(data.players)
    .filter(([, p]) => p.gold > 0)
    .map(([lid, p]) => ({ lid, name: p.name, gold: p.gold }))
    .sort((a, b) => b.gold - a.gold)
    .slice(0, limit);
}

export function getPlayerRank(lid, remoteJid) {
  const group  = getGroupRanking(remoteJid, 9999);
  const global = getGlobalRanking(9999);
  const gPos   = group.findIndex((p) => p.lid === lid) + 1;
  const glPos  = global.findIndex((p) => p.lid === lid) + 1;
  return { group: gPos || null, global: glPos || null };
}

export function buildRankingText(players, title, requesterLid) {
  const medals = ["🥇", "🥈", "🥉"];
  const lines = players.map((p, i) => {
    const medal = medals[i] ?? `${String(i + 1).padStart(2)}·`;
    const name  = p.name.length > 16 ? p.name.slice(0, 15) + "…" : p.name;
    const gold  = formatGold(p.gold);
    const mark  = p.lid === requesterLid ? " ◀" : "";
    return `${medal} *${name}*${mark}\n      ${gold} 💰`;
  });
  const sep = "━━━━━━━━━━━━━━━━━━━━━━━";
  return [`🏆 *${title}*`, sep, ...lines, sep].join("\n");
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

function getEventData(remoteJid) {
  const data = loadData();
  if (!data.events[remoteJid]) {
    data.events[remoteJid] = {
      enabled:       false,
      lastEventTime: 0,
      currentEmoji:  null,
      currentReward: 0,
      expiresAt:     0,
    };
    saveData(data);
  }
  return data.events[remoteJid];
}

export function setEventEnabled(remoteJid, enabled) {
  const data = loadData();
  if (!data.events[remoteJid]) {
    data.events[remoteJid] = {
      enabled:       false,
      lastEventTime: 0,
      currentEmoji:  null,
      currentReward: 0,
      expiresAt:     0,
    };
  }
  data.events[remoteJid].enabled = enabled;
  if (!enabled) {
    data.events[remoteJid].currentEmoji  = null;
    data.events[remoteJid].currentReward = 0;
    data.events[remoteJid].expiresAt     = 0;
    clearEventTimer(remoteJid);
  }
  saveData(data);
}

export function isEventEnabled(remoteJid) {
  return getEventData(remoteJid).enabled;
}

function clearEventTimer(remoteJid) {
  if (eventTimers.has(remoteJid)) {
    clearTimeout(eventTimers.get(remoteJid));
    eventTimers.delete(remoteJid);
  }
}

function triggerEvent(remoteJid, socket) {
  const now    = Date.now();
  const emoji  = EVENT_EMOJIS[Math.floor(Math.random() * EVENT_EMOJIS.length)];
  const reward = Math.floor(Math.random() * 151) + 50; // 50–200 gold

  const data = loadData();
  if (!data.events[remoteJid]) return;
  data.events[remoteJid].currentEmoji  = emoji;
  data.events[remoteJid].currentReward = reward;
  data.events[remoteJid].lastEventTime = now;
  data.events[remoteJid].expiresAt     = now + EVENT_EXPIRE_MS;
  saveData(data);

  const eventText = [
    `✨ *EVENTO DE GOLD!* ✨`,
    ``,
    `💰 Um tesouro apareceu no grupo!`,
    `Mande o emoji abaixo para ganhar *${reward} 💰 Gold!*`,
    ``,
    emoji,
    ``,
    `⏰ _Você tem 2 minutos!_`,
  ].join("\n");

  socket.sendMessage(remoteJid, { text: eventText }).catch(() => {});

  // Timer de expiração
  clearEventTimer(remoteJid);
  const timer = setTimeout(() => {
    const fresh = loadData();
    if (!fresh.events?.[remoteJid]) return;
    if (fresh.events[remoteJid].currentEmoji !== emoji) return;
    fresh.events[remoteJid].currentEmoji  = null;
    fresh.events[remoteJid].currentReward = 0;
    fresh.events[remoteJid].expiresAt     = 0;
    saveData(fresh);
    socket.sendMessage(remoteJid, {
      text: `⌛ O evento expirou! Ninguém capturou o ${emoji} a tempo.`,
    }).catch(() => {});
  }, EVENT_EXPIRE_MS);
  eventTimers.set(remoteJid, timer);
}

// ─── Interceptador de eventos no chat ────────────────────────────────────────

export async function processGoldEvent(paramsHandler) {
  const { remoteJid, userLid, fullMessage, socket, webMessage } = paramsHandler;

  const evData = getEventData(remoteJid);
  if (!evData.enabled) return false;

  const now = Date.now();

  // Tem evento ativo?
  if (evData.currentEmoji) {
    if (now > evData.expiresAt) {
      // Expirou — limpa silenciosamente
      const data = loadData();
      data.events[remoteJid].currentEmoji  = null;
      data.events[remoteJid].currentReward = 0;
      data.events[remoteJid].expiresAt     = 0;
      saveData(data);
      clearEventTimer(remoteJid);
    } else if (fullMessage.trim() === evData.currentEmoji) {
      // Acertou! 🎉
      const name    = webMessage?.pushName || "Aventureiro";
      const reward  = evData.currentReward;
      const newGold = addGold(userLid, name, remoteJid, reward);

      clearEventTimer(remoteJid);
      const data = loadData();
      data.events[remoteJid].currentEmoji  = null;
      data.events[remoteJid].currentReward = 0;
      data.events[remoteJid].expiresAt     = 0;
      saveData(data);

      await socket.sendMessage(remoteJid, {
        text: [
          `🎉 *${name}* capturou o ${evData.currentEmoji} e ganhou *${reward} 💰 Gold!*`,
          ``,
          `💼 Saldo atual: *${formatGold(newGold)} 💰*`,
        ].join("\n"),
      });

      return true; // consome a mensagem
    }
    return false;
  }

  // Verifica se é hora de disparar novo evento (5h)
  if (now - (evData.lastEventTime || 0) >= EVENT_COOLDOWN) {
    triggerEvent(remoteJid, socket);
  }

  return false;
}

// ─── Exports extras ───────────────────────────────────────────────────────────

export { loadData };

export function findPlayerByNumber(phoneNumber) {
  const data = loadData();
  const entry = Object.entries(data.players).find(
    ([lid]) => lid.replace(/[^0-9]/g, "") === phoneNumber
  );
  if (!entry) return null;
  return { lid: entry[0], ...entry[1] };
}

// ─── Gold Passivo (por mensagem, sem notificação) ─────────────────────────────

/**
 * Concede Gold silenciosamente com base no tipo de mensagem.
 *  Texto / mídia com legenda : +1
 *  Sticker                   : +2
 *  Áudio / PTT               : +3
 *
 * Chamado no dynamicCommand.js junto ao trackActivity.
 * Nunca lança erro — falha silenciosa para não quebrar o fluxo.
 */
export function grantPassiveGold(userLid, name, remoteJid, webMessage) {
  try {
    if (!userLid || !remoteJid) return;
    const msg = webMessage?.message;
    if (!msg) return;

    let amount = 0;

    if (msg.stickerMessage) {
      amount = 2; // 🖼️ Sticker
    } else if (msg.audioMessage || msg.pttMessage) {
      amount = 3; // 🎤 Áudio / PTT
    } else if (
      msg.conversation          ||
      msg.extendedTextMessage   ||
      msg.imageMessage          ||
      msg.videoMessage          ||
      msg.documentMessage       ||
      msg.documentWithCaptionMessage
    ) {
      amount = 1; // 💬 Mensagem de texto ou mídia com legenda
    }

    if (amount > 0) {
      addGold(userLid, name, remoteJid, amount);
    }
  } catch {
    // Silencioso — nunca interrompe o fluxo principal
  }
}
