/**
 * vipManager.js — Gerencia VIPs de usuários e grupos
 * Salve em: src/utils/vipManager.js
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DB_DIR  = path.resolve(__dirname, "../database");
const DB_PATH = path.resolve(DB_DIR, "vip.json");

if (!fs.existsSync(DB_DIR))  fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], groups: [] }, null, 2));

function load() {
  try   { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); }
  catch { return { users: [], groups: [] }; }
}

function save(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ── Usuários VIP ──────────────────────────────────────────────────────────────

export function isVipUser(userLid) {
  const db = load();
  return db.users.includes(userLid);
}

export function addVipUser(userLid) {
  const db = load();
  if (!db.users.includes(userLid)) {
    db.users.push(userLid);
    save(db);
    return true;
  }
  return false; // já era VIP
}

export function removeVipUser(userLid) {
  const db = load();
  const idx = db.users.indexOf(userLid);
  if (idx !== -1) {
    db.users.splice(idx, 1);
    save(db);
    return true;
  }
  return false; // não era VIP
}

// ── Grupos VIP ────────────────────────────────────────────────────────────────

export function isVipGroup(remoteJid) {
  const db = load();
  return db.groups.includes(remoteJid);
}

export function addVipGroup(remoteJid) {
  const db = load();
  if (!db.groups.includes(remoteJid)) {
    db.groups.push(remoteJid);
    save(db);
    return true;
  }
  return false;
}

export function removeVipGroup(remoteJid) {
  const db = load();
  const idx = db.groups.indexOf(remoteJid);
  if (idx !== -1) {
    db.groups.splice(idx, 1);
    save(db);
    return true;
  }
  return false;
}

// ── Listagens ─────────────────────────────────────────────────────────────────

export function listVipUsers()  { return load().users; }
export function listVipGroups() { return load().groups; }

// ── Verificação geral (usuário OU grupo com acesso VIP) ───────────────────────

export function hasVipAccess(userLid, remoteJid) {
  return isVipUser(userLid) || isVipGroup(remoteJid);
}
