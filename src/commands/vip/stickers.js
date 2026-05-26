/**
 * 🎴 Stickers Aleatórios
 * src/commands/member/stickers.js
 *
 * - Busca stickers do GitHub (nunca repete até acabar tudo)
 * - Envia 3 stickers no PRIVADO de quem pediu
 * - Cooldown de 15 minutos por usuário
 * - Mensagens variadas para evitar spam detection
 */

import fs from "node:fs";
import path from "node:path";
import { DATABASE_DIR, PREFIX } from "../../config.js";

// ─── Config ───────────────────────────────────────────────────────────────────
const REPO_API  = "https://api.github.com/repos/henriqueolivergrenn2-stack/Stickers-aleat-rio/contents/";
const RAW_BASE  = "https://raw.githubusercontent.com/henriqueolivergrenn2-stack/Stickers-aleat-rio/main/";
const QUEUE_FILE = path.resolve(DATABASE_DIR, "stickerQueue.json");

const COOLDOWN_MS     = 15 * 60 * 1000; // 15 minutos
const STICKERS_POR_USO = 3;
const CACHE_TTL       = 60 * 60 * 1000; // 1h antes de rebuscar lista no GitHub

// ─── Cache em memória da lista do GitHub ─────────────────────────────────────
let _listaCache = null;
let _cacheTempo = 0;

// ─── Persistência da fila ─────────────────────────────────────────────────────
function carregarFila() {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
    }
  } catch { /* ignora */ }
  return { restantes: [], usados: [], cooldowns: {} };
}

function salvarFila(data) {
  try {
    const dir = path.dirname(QUEUE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch { /* ignora */ }
}

// ─── Busca lista de stickers no GitHub ───────────────────────────────────────
async function getListaGitHub() {
  if (_listaCache && Date.now() - _cacheTempo < CACHE_TTL) {
    return _listaCache;
  }

  const res = await fetch(REPO_API, {
    headers: {
      "User-Agent": "WhatsApp-Sticker-Bot/1.0",
      "Accept":     "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) throw new Error(`GitHub API: ${res.status} ${res.statusText}`);

  const json = await res.json();
  _listaCache = json
    .filter(f => f.type === "file" && f.name.toLowerCase().endsWith(".webp"))
    .map(f => f.name);

  _cacheTempo = Date.now();
  return _listaCache;
}

// ─── Embaralha array (Fisher-Yates) ──────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Pega os próximos N stickers sem repetir ─────────────────────────────────
async function proximosStickers(qtd) {
  const todos = await getListaGitHub();
  const fila  = carregarFila();

  // Se a fila de restantes não tiver stickers suficientes → reinicia embaralhado
  if (fila.restantes.length < qtd) {
    fila.restantes = shuffle(todos);
    fila.usados    = [];
  }

  const escolhidos = fila.restantes.splice(0, qtd);
  fila.usados.push(...escolhidos);
  salvarFila(fila);
  return escolhidos;
}

// ─── Baixa o buffer de um sticker ────────────────────────────────────────────
async function baixarSticker(nome) {
  const url = RAW_BASE + encodeURIComponent(nome);
  const res = await fetch(url, {
    headers: { "User-Agent": "WhatsApp-Sticker-Bot/1.0" },
  });
  if (!res.ok) throw new Error(`Falha ao baixar ${nome}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ─── Delay aleatório entre stickers (anti-spam) ───────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Bancos de mensagens variadas ─────────────────────────────────────────────
const MSGS_GRUPO = [
  "📬 Indo no seu privado agora!",
  "✉️ Stickers a caminho do seu privado... 👀",
  "🚀 Preparando uma surpresa pra você!",
  "🎴 Separei uns stickers especiais — chegando no privado!",
  "📦 Pacote de stickers enviado! Confere lá no privado 😄",
  "🎁 Presente chegando no seu chat! Só aguarda...",
  "🌟 Os stickers do destino estão indo pra você!",
];

const MSGS_PRIVADO_INICIO = [
  "🎴 *Seus stickers chegaram!* Aqui estão eles:",
  "✨ *Surpresa!* Figurinhas escolhidas especialmente:",
  "🃏 *Toma aí!* Bem aleatório, como pedido:",
  "🎨 *Arte em forma de sticker* chegando pra você:",
  "🌈 *Figurinhas do dia!* Aproveite:",
  "🎭 *Sortidas e únicas!* Confere:",
  "🎪 *O show dos stickers começou!*",
];

const MSGS_PRIVADO_FIM = [
  "⏰ _Próximo pedido disponível em 15 minutos!_",
  "🕐 _Volte em 15 minutos para mais figurinhas!_",
  "⌛ _Cooldown: 15 min. Até já!_",
  "🔄 _Estoque atualizado! Novo pedido em 15 min._",
  "🎯 _Gostou? Mais stickers em 15 minutinhos!_",
];

function msgAleatoria(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Exportação do comando ────────────────────────────────────────────────────
export default {
  name: "stickers",
  description: "Receba 3 stickers aleatórios no privado! Nunca repete até acabar tudo. (cd 15min)",
  commands: ["stickers", "figurinhas", "figurinha", "stickeraleatorio"],
  usage: `${PREFIX}stickers`,

  handle: async ({
    sendReply,
    sendWarningReply,
    sendWaitReact,
    sendSuccessReact,
    socket,
    remoteJid,
    userLid,
    webMessage,
  }) => {
    // ── Determina JID do remetente para o privado ──────────────────────────────
    // Em grupos: participant pode ser @lid ou @s.whatsapp.net
    // Em privado: remoteJid já é o JID do usuário
    const isGroup   = remoteJid?.endsWith("@g.us");
    const senderJid = isGroup
      ? (webMessage?.key?.participant?.replace(/:[0-9]+/, "") || userLid)
      : remoteJid;

    if (!senderJid) {
      return sendWarningReply("Não foi possível identificar seu usuário. Tente novamente!");
    }

    // ── Verifica cooldown ────────────────────────────────────────────────────
    const fila    = carregarFila();
    const agora   = Date.now();
    const ultimo  = fila.cooldowns?.[userLid] || 0;
    const espera  = COOLDOWN_MS - (agora - ultimo);

    if (espera > 0) {
      const min = Math.ceil(espera / 60000);
      const seg = Math.ceil((espera % 60000) / 1000);
      const txt = min > 0 ? `${min}min ${seg}s` : `${seg}s`;
      return sendWarningReply(
        `⏳ Aguarde *${txt}* para pedir mais stickers!\n\n` +
        `_A fila precisa ser justa para todos_ 😄`
      );
    }

    // ── Registra cooldown antes de tudo ─────────────────────────────────────
    if (!fila.cooldowns) fila.cooldowns = {};
    fila.cooldowns[userLid] = agora;
    salvarFila(fila);

    await sendWaitReact();

    // ── Avisa no grupo (se em grupo) que vai no privado ───────────────────────
    if (isGroup) {
      await sendReply(msgAleatoria(MSGS_GRUPO));
    }

    // ── Busca e envia os stickers ─────────────────────────────────────────────
    try {
      const nomes = await proximosStickers(STICKERS_POR_USO);
      let enviados = 0;

      // Mensagem de abertura no privado (varia sempre)
      await socket.sendMessage(senderJid, {
        text: msgAleatoria(MSGS_PRIVADO_INICIO),
      });

      await sleep(800);

      for (const nome of nomes) {
        try {
          const buffer = await baixarSticker(nome);

          // Delay variado entre stickers (1.5s a 3s) — anti-spam natural
          if (enviados > 0) {
            await sleep(1500 + Math.floor(Math.random() * 1500));
          }

          await socket.sendMessage(senderJid, { sticker: buffer });
          enviados++;
        } catch {
          // Sticker específico falhou — pula para o próximo
        }
      }

      if (enviados === 0) {
        return sendWarningReply(
          "Não foi possível baixar os stickers agora. " +
          "O GitHub pode estar lento. Tente de novo em instantes!"
        );
      }

      await sleep(600);

      // Mensagem de encerramento no privado (varia sempre)
      await socket.sendMessage(senderJid, {
        text:
          `✅ *${enviados} sticker${enviados > 1 ? "s" : ""} enviado${enviados > 1 ? "s" : ""}!*\n\n` +
          msgAleatoria(MSGS_PRIVADO_FIM),
      });

      await sendSuccessReact();
    } catch (err) {
      // Reseta cooldown se falhou antes de enviar qualquer coisa
      const filaAtual = carregarFila();
      if (filaAtual.cooldowns) delete filaAtual.cooldowns[userLid];
      salvarFila(filaAtual);

      await sendWarningReply(
        `⚠️ Não consegui buscar os stickers!\n\n` +
        `_Detalhes: ${err.message}_\n\n` +
        `_Seu cooldown foi resetado — tente novamente!_`
      );
    }
  },
};
