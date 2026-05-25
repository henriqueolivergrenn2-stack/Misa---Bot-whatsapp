/**
 * activityTracker.js
 * Rastreia atividade dos membros por grupo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { onlyNumbers } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACTIVITY_FILE = path.resolve(__dirname, "../../database/activity.json");

export function loadActivity() {
  try {
    if (!fs.existsSync(ACTIVITY_FILE)) {
      fs.mkdirSync(path.dirname(ACTIVITY_FILE), { recursive: true });
      fs.writeFileSync(ACTIVITY_FILE, "{}", "utf-8");
    }
    return JSON.parse(fs.readFileSync(ACTIVITY_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export function saveActivity(data) {
  fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function trackActivity(groupJid, userLid, nome, type) {
  if (!groupJid || !userLid) return;

  const data = loadActivity();
  const numero = onlyNumbers(userLid);

  if (!data[groupJid]) data[groupJid] = {};

  if (!data[groupJid][numero]) {
    data[groupJid][numero] = {
      id: userLid,
      nome: nome || "Usuário",
      messages: 0,
      commands: 0,
      stickers: 0,
    };
  }

  if (nome) data[groupJid][numero].nome = nome;

  if (type === "message") data[groupJid][numero].messages++;
  if (type === "command") data[groupJid][numero].commands++;
  if (type === "sticker") data[groupJid][numero].stickers++;

  saveActivity(data);
}

export function getGroupRank(groupJid, limit = 10) {
  const data = loadActivity();
  const group = data[groupJid];
  if (!group) return [];

  return Object.values(group)
    .map((u) => ({
      ...u,
      total: u.messages + u.commands + u.stickers,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}