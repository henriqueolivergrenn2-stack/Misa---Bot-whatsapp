/**
 * Comando: stickers / figurinha
 * Envia 1 sticker aleatório sem repetir até acabar todos.
 * Funciona em grupos e privado.
 */
import fs from "node:fs";
import path from "node:path";
import { DATABASE_DIR, PREFIX } from "../../config.js";

const REPO_API  = "https://api.github.com/repos/henriqueolivergrenn2-stack/Stickers-aleat-rio/contents/";
const RAW_BASE  = "https://raw.githubusercontent.com/henriqueolivergrenn2-stack/Stickers-aleat-rio/main/";
const QUEUE_FILE = path.resolve(DATABASE_DIR, "stickerQueue.json");
const CACHE_TTL  = 60 * 60 * 1000; // 1h

let _listaCache = null;
let _cacheTempo = 0;

function carregarFila() {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
    }
  } catch { /* ignora */ }
  return { restantes: [], usados: [] };
}

function salvarFila(data) {
  try {
    const dir = path.dirname(QUEUE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch { /* ignora */ }
}

async function getListaGitHub() {
  if (_listaCache && Date.now() - _cacheTempo < CACHE_TTL) {
    return _listaCache;
  }

  const res = await fetch(REPO_API, {
    headers: {
      "User-Agent": "WhatsApp-Sticker-Bot/1.0",
      "Accept": "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);

  const json = await res.json();
  _listaCache = json
    .filter((f) => f.type === "file" && f.name.toLowerCase().endsWith(".webp"))
    .map((f) => f.name);

  _cacheTempo = Date.now();
  return _listaCache;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function proximoSticker() {
  const todos = await getListaGitHub();
  const fila  = carregarFila();

  // Acabou a fila → reinicia embaralhado
  if (!fila.restantes.length) {
    fila.restantes = shuffle(todos);
    fila.usados    = [];
  }

  const escolhido = fila.restantes.splice(0, 1)[0];
  fila.usados.push(escolhido);
  salvarFila(fila);
  return escolhido;
}

export default {
  name: "stickers",
  description: "Envio um sticker aleatório sem repetir!",
  commands: ["stickers", "figurinha", "figurinhas", "stickeraleatorio"],
  usage: `${PREFIX}stickers`,

  handle: async ({
    sendWaitReact,
    sendSuccessReact,
    sendWarningReply,
    sendStickerFromBuffer,
  }) => {
    await sendWaitReact();

    try {
      const nome = await proximoSticker();
      const url  = RAW_BASE + encodeURIComponent(nome);

      const res = await fetch(url, {
        headers: { "User-Agent": "WhatsApp-Sticker-Bot/1.0" },
      });

      if (!res.ok) throw new Error(`Falha ao baixar sticker: ${res.status}`);

      const buffer = Buffer.from(await res.arrayBuffer());

      await sendSuccessReact();
      await sendStickerFromBuffer(buffer);
    } catch (err) {
      await sendWarningReply(
        `Não consegui buscar o sticker agora. Tente novamente!\n\n_${err.message}_`
      );
    }
  },
};
