/**
 * Menu do bot — gerado automaticamente a partir das pastas de comandos.
 *
 * @author Dev Gui
 *
 * ╔══════════════════════════════════════════════╗
 * ║           COMO PERSONALIZAR O MENU           ║
 * ╠══════════════════════════════════════════════╣
 * ║                                              ║
 * ║  ADICIONAR UMA PASTA/SEÇÃO:                  ║
 * ║  1. Crie a pasta em src/commands/ ou         ║
 * ║     dentro de src/commands/member/           ║
 * ║  2. Adicione o nome em FOLDER_TITLES         ║
 * ║     com o título que quer exibir             ║
 * ║  3. Adicione o nome em FOLDER_ICONS          ║
 * ║     com o ícone que quer usar                ║
 * ║  4. Adicione o nome em FOLDER_ORDER          ║
 * ║     na posição que quer exibir               ║
 * ║                                              ║
 * ║  REMOVER UMA PASTA/SEÇÃO DO MENU:            ║
 * ║  Adicione o nome da pasta em                 ║
 * ║  IGNORED_FOLDERS abaixo                      ║
 * ║                                              ║
 * ║  RENOMEAR UMA SEÇÃO:                         ║
 * ║  Altere o valor em FOLDER_TITLES             ║
 * ║                                              ║
 * ║  MUDAR ÍCONE DE UMA SEÇÃO:                   ║
 * ║  Altere o valor em FOLDER_ICONS              ║
 * ║                                              ║
 * ╚══════════════════════════════════════════════╝
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import pkg from "../package.json" with { type: "json" };
import { BOT_NAME, COMMANDS_DIR } from "./config.js";
import { getPrefix } from "./utils/database.js";
import { readMore } from "./utils/index.js";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PASTAS IGNORADAS NO MENU
// Adicione aqui o nome de pastas que não quer exibir
// Exemplo: "exemplos", "testing", "misc"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const IGNORED_FOLDERS = [
  "exemplos",
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TÍTULOS DAS SEÇÕES
// Chave = nome da pasta, Valor = título exibido
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FOLDER_TITLES = {
  owner:     "DONO",
  admin:     "ADMINS",
  member:    "PRINCIPAL",
  downloads: "DOWNLOADS",
  canvas:    "CANVAS",
  funny:     "BRINCADEIRAS",
  ia:        "INTELIGÊNCIA ARTIFICIAL",
  audio:    "ÁUDIO",
  jogos:    "JOGOS",
  gold:    "OURO",
  bot: "BOT",
  sticker: "STICKER",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ÍCONES DAS SEÇÕES
// Chave = nome da pasta, Valor = emoji/ícone
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FOLDER_ICONS = {
  owner:     "🌌",
  admin:     "⭐",
  member:    "🚀",
  downloads: "🎶",
  canvas:    "❇️",
  sticker: "💻",
  funny:     "🎡",
  ia:        "🤖",
  audio: "💽",
  jogos: "🎮",
  gold: "🪙",
  bot: "🤖",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ORDEM DE EXIBIÇÃO DAS SEÇÕES
// Pastas não listadas aqui aparecem no final
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FOLDER_ORDER = [
  "owner",
  "admin",
  "member",
  "gold",
  "downloads",
  "canvas",
  "sticker",
  "funny",
  "jogos",
  "ia",
  "audio",
  "bot",
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NÃO MEXA ABAIXO DAQUI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function loadCommandsFromDir(dir) {
  const commands = [];
  if (!fs.existsSync(dir)) return commands;

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) continue;
    if (item.name.startsWith("_")) continue;
    if (!item.name.endsWith(".js") && !item.name.endsWith(".ts")) continue;

    try {
      const mod = await import(pathToFileURL(path.join(dir, item.name)).href);
      const cmd = mod.default ?? mod;
      if (Array.isArray(cmd?.commands) && cmd.commands.length) {
        commands.push(cmd.commands[0]);
      }
    } catch {}
  }

  return commands.sort();
}

async function buildMenuSections(prefix) {
  const sections = {};

  if (!fs.existsSync(COMMANDS_DIR)) return "";

  const rootFolders = fs
    .readdirSync(COMMANDS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name);

  for (const folder of rootFolders) {
    if (IGNORED_FOLDERS.includes(folder)) continue;

    const folderPath = path.join(COMMANDS_DIR, folder);

    // Arquivos diretos da pasta (ex: member/*.js, admin/*.js)
    const rootCmds = await loadCommandsFromDir(folderPath);
    if (rootCmds.length) {
      sections[folder] = rootCmds;
    }

    // Subpastas (ex: member/canvas, member/downloads)
    const subDirs = fs
      .readdirSync(folderPath, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
      .map((d) => d.name);

    for (const sub of subDirs) {
      if (IGNORED_FOLDERS.includes(sub)) continue;

      const subPath = path.join(folderPath, sub);
      const subCmds = await loadCommandsFromDir(subPath);

      if (subCmds.length) {
        if (!sections[sub]) {
          sections[sub] = subCmds;
        } else {
          sections[sub].push(...subCmds);
          sections[sub].sort();
        }
      }
    }
  }

  // Ordena as seções conforme FOLDER_ORDER
  const orderedKeys = [
    ...FOLDER_ORDER.filter((k) => sections[k]),
    ...Object.keys(sections).filter((k) => !FOLDER_ORDER.includes(k)),
  ];

  const lines = [];

  for (const key of orderedKeys) {
    const cmds = sections[key];
    if (!cmds?.length) continue;

    const title = FOLDER_TITLES[key] || key.toUpperCase();
    const icon  = FOLDER_ICONS[key]  || "📦";

    const cmdLines = cmds.map((cmd) => `▢ • ${prefix}${cmd}`).join("\n");

    lines.push(
      `╭━━⪩ ${title} ⪨━━\n▢\n${cmdLines}\n▢\n╰━━─「${icon}」─━━`
    );
  }

  return lines.join("\n\n");
}

// Cache de 1 minuto pra não recarregar a cada mensagem
let cachedSections = null;
let cachedPrefix   = null;
let cacheTime      = 0;
const CACHE_TTL    = 60 * 1000;

export async function menuMessage(groupJid) {
  const date   = new Date();
  const prefix = getPrefix(groupJid);
  const now    = Date.now();

  if (
    !cachedSections ||
    now - cacheTime > CACHE_TTL ||
    cachedPrefix !== prefix
  ) {
    cachedSections = await buildMenuSections(prefix);
    cachedPrefix   = prefix;
    cacheTime      = now;
  }

  return `╭━━⪩ BEM VINDO! ⪨━━${readMore()}
▢
▢ • ${BOT_NAME}
▢ • Data: ${date.toLocaleDateString("pt-br")}
▢ • Hora: ${date.toLocaleTimeString("pt-br")}
▢ • Prefixo: ${prefix}
▢ • Versão: ${pkg.version}
▢
╰━━─「🪐」─━━

${cachedSections}`;
}