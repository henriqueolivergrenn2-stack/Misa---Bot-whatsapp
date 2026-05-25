/**
 * Comando: meme
 * Pesquisa memes no Memedroid e envia apenas imagens aleatórias.
 * - Nunca repete o mesmo meme (por grupo/chat)
 * - Bloqueia conteúdo NSFW automaticamente
 * - Ignora vídeos
 */
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import { getBuffer } from "../../../utils/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_FILE = path.resolve(
  __dirname,
  "../../../../database/meme-history.json"
);

const NSFW_KEYWORDS = [
  "nsfw", "18+", "adult", "nude", "naked", "porn", "sex", "hentai",
  "calcinha", "pelada", "safada", "gostosa", "putaria", "buceta",
  "porno", "xxx", "erotic", "nua", "strip",
];

function loadHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
      fs.writeFileSync(HISTORY_FILE, "{}", "utf-8");
    }
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveHistory(data) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function isNsfw(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return NSFW_KEYWORDS.some((kw) => lower.includes(kw));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function searchMeme(query) {
  const url = `https://pt.memedroid.com/search?query=${encodeURIComponent(query)}`;

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
    timeout: 15000,
  });

  const $ = cheerio.load(data);
  const results = [];

  $("article.gallery-item").each((_, el) => {
    const article = $(el);

    // ✅ Ignora artigos que têm vídeo
    if (article.find("video").length > 0) return;

    const title = article.find(".item-header-title").text().trim();
    const tags = article.find(".tags-container").attr("data-tags") || "";

    if (isNsfw(title) || isNsfw(tags)) return;

    const articleId = article.attr("id")?.replace("article-item-", "");
    if (!articleId) return;

    const imgSrc =
      article.find("picture img").attr("src") ||
      article.find("picture source[type='image/jpeg']").first().attr("srcset") ||
      article.find("picture source[type='image/webp']").first().attr("srcset");

    if (!imgSrc) return;

    results.push({ id: articleId, type: "image", url: imgSrc, title });
  });

  return results;
}

export default {
  name: "meme",
  description: "Pesquisa memes no Memedroid e envia imagens aleatórias sem repetir!",
  commands: ["meme", "buscar-meme"],
  usage: `${PREFIX}meme DBZ`,

  handle: async ({
    sendReply,
    sendReact,
    fullArgs,
    remoteJid,
    socket,
    webMessage,
  }) => {
    if (!fullArgs.trim()) {
      throw new InvalidParameterError(
        `Informe o que pesquisar!\n\nExemplo: *${PREFIX}meme DBZ*`
      );
    }

    await sendReact("🔍");
    await sendReply("_Pesquisando memes, aguarde..._");

    let results;
    try {
      results = await searchMeme(fullArgs.trim());
    } catch (err) {
      throw new WarningError(
        `Erro ao buscar no Memedroid!\n\n*Detalhes:* ${err.message}`
      );
    }

    if (!results.length) {
      throw new WarningError(
        `Nenhuma imagem encontrada para *${fullArgs.trim()}*!\n\nTente outro termo de pesquisa.`
      );
    }

    const history = loadHistory();
    if (!history[remoteJid]) history[remoteJid] = {};

    const query = fullArgs.trim().toLowerCase();
    if (!history[remoteJid][query]) history[remoteJid][query] = [];

    const seen = history[remoteJid][query];
    let available = shuffle(results.filter((r) => !seen.includes(r.id)));

    if (!available.length) {
      history[remoteJid][query] = [];
      available = shuffle(results);
    }

    const chosen = available[0];

    history[remoteJid][query].push(chosen.id);
    saveHistory(history);

    try {
      const imageBuffer = await getBuffer(chosen.url);

      await socket.sendMessage(
        remoteJid,
        {
          image: Buffer.from(imageBuffer),
          caption: `🎭 *${chosen.title || "Meme"}*\n\n_Fonte: Memedroid_`,
        },
        { quoted: webMessage }
      );
    } catch (err) {
      throw new WarningError(
        `Não consegui baixar o meme!\n\n*Detalhes:* ${err.message}`
      );
    }
  },
};