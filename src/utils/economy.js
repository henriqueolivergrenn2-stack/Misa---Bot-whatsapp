/**
 * economy.js — Motor de economia
 * Salve em: src/utils/economy.js   ← NÃO é um comando
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, "../../database");
const DB_PATH = path.resolve(DB_DIR, "economy.json");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ players: {} }, null, 2));

let db = _load();

function _load() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); }
  catch { return { players: {} }; }
}

export function save() {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
  catch (e) { console.error("[ECONOMY]", e.message); }
}

setInterval(save, 30_000);

export const fmt = (v) => Number(v || 0).toLocaleString("pt-BR");
export const getNow = () => Date.now();
export const getCd = (last, ms) => Math.max(0, last + ms - getNow());
export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export function fmtTime(ms) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function xpBar(xp, level) {
  const need = level * 1_000;
  const pct = Math.min(xp / need, 1);
  const filled = Math.round(pct * 10);
  return "[" + "█".repeat(filled) + "░".repeat(10 - filled) + "] " + xp + "/" + need;
}

export function getPlayer(id, name) {
  if (!name) name = "Jogador";
  if (!db.players[id]) {
    db.players[id] = {
      id,
      name,
      gold: 0,
      bank: 0,
      xp: 0,
      level: 1,
      inventory: [],
      streak: 0,
      lastDailyDate: null,
      stats: { wins: 0, loses: 0, mined: 0, steals: 0, worked: 0, crimes: 0, gambled: 0, fished: 0, hunted: 0 },
      cooldowns: { mine: 0, daily: 0, work: 0, crime: 0, steal: 0, fish: 0, hunt: 0, quiz: 0 },
      rpg: null,
    };
    save();
  }
  if (name && name !== "Jogador") db.players[id].name = name;
  return db.players[id];
}

function _addXP(id, amount) {
  const p = getPlayer(id);
  p.xp += amount;
  while (p.xp >= p.level * 1_000) {
    p.xp -= p.level * 1_000;
    p.level++;
  }
}

export function addGold(id, amount) {
  const p = getPlayer(id);
  p.gold = Math.max(0, p.gold + amount);
  _addXP(id, Math.floor(Math.abs(amount) / 10));
  save();
  return p.gold;
}

export function removeGold(id, amount) {
  const p = getPlayer(id);
  p.gold = Math.max(0, p.gold - amount);
  save();
  return p.gold;
}

export const hasItem = (id, item) => getPlayer(id).inventory.includes(item);
export const getDb = () => db;

export const ITEMS = {
  picareta: { name: "Picareta", emoji: "⛏️", price: 2_500, desc: "+50% na mineração" },
  anzol:    { name: "Anzol",    emoji: "🎣", price: 3_000, desc: "+40% na pescaria" },
  faca:     { name: "Faca de Caca", emoji: "🔪", price: 3_500, desc: "+40% na cacada" },
  lucky:    { name: "Lucky Charm",  emoji: "🍀", price: 5_000, desc: "+20% no daily" },
  colete:   { name: "Colete",   emoji: "🦺", price: 7_000, desc: "-30% chance de roubo" },
  mochila:  { name: "Mochila",  emoji: "🎒", price: 8_000, desc: "+30% nos trabalhos" },
  vip:      { name: "VIP",      emoji: "👑", price: 25_000, desc: "+15% em tudo" },
};

export function buyItem(id, itemName) {
  const p = getPlayer(id);
  const item = ITEMS[itemName];
  if (!item) return { error: "Item nao encontrado. Use *loja* para ver os disponiveis." };
  if (p.inventory.includes(itemName)) return { error: "Voce ja possui *" + item.emoji + " " + item.name + "*." };
  if (p.gold < item.price) return { error: "Gold insuficiente. Precisa de *" + fmt(item.price) + " 🪙*" };
  removeGold(id, item.price);
  p.inventory.push(itemName);
  save();
  return { success: true, item };
}

const _betGames = new Map();

export function createBetGame(gameId, p1, p2, amount) {
  amount = Number(amount);
  const pl1 = getPlayer(p1);
  const pl2 = getPlayer(p2);
  if (pl1.gold < amount) return { error: "*" + pl1.name + "* nao tem gold suficiente." };
  if (pl2.gold < amount) return { error: "*" + pl2.name + "* nao tem gold suficiente." };
  removeGold(p1, amount);
  removeGold(p2, amount);
  _betGames.set(gameId, { player1: p1, player2: p2, amount, total: amount * 2 });
  return { success: true };
}

export function finishBetGame(gameId, winner) {
  const g = _betGames.get(gameId);
  if (!g) return { error: "Partida nao encontrada." };
  addGold(winner, g.total);
  _betGames.delete(gameId);
  return { success: true, reward: g.total };
}

export function cancelBetGame(gameId) {
  const g = _betGames.get(gameId);
  if (!g) return;
  addGold(g.player1, g.amount);
  addGold(g.player2, g.amount);
  _betGames.delete(gameId);
}
