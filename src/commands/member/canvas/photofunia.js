/**
 * Comando: obama / putin / pfx / photofunia
 * Aplica efeitos do PhotoFunia em uma imagem.
 * Salve em: src/commands/member/photofunia.js
 *
 * Uso:
 *   .obama           — Obama segurando sua foto
 *   .putin           — Putin no escritório com sua foto
 *   .pfx <efeito>    — qualquer efeito pelo slug
 *   .pfx lista       — ver efeitos disponíveis
 *
 * Slugs extras: art-admirer, brussels-museum, kitty-and-frame,
 *               bronze-frames, roses, reproduction, ...
 * Lista completa: https://m.photofunia.com/categories/all_effects
 */

import fs from "node:fs";
import path from "node:path";
import { PREFIX, TEMP_DIR } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { errorLog, infoLog } from "../../../utils/logger.js";

// Mapa de apelidos → slug real do PhotoFunia
// A PRIMEIRA entrada de cada slug é o nome amigável exibido no .pfx lista
const EFEITOS = {
  obama:               "obama",
  putin:               "putin",
  museu:               "art-admirer",
  brusselas:           "brussels-museum",
  gatinho:             "kitty-and-frame",
  bronze:              "bronze-frames",
  rosas:               "roses",
  reproducao:          "reproduction",
  // Slugs completos como alias (funcionam mas não aparecem na lista)
  "art-admirer":       "art-admirer",
  "brussels-museum":   "brussels-museum",
  "kitty-and-frame":   "kitty-and-frame",
  "bronze-frames":     "bronze-frames",
  "roses":             "roses",
  "reproduction":      "reproduction",
};

/**
 * Faz upload da imagem para o PhotoFunia e retorna o Buffer do resultado.
 * Usa fetch nativo do Node 22 + FormData nativo.
 */
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
  "Accept":     "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

/** Extrai a URL da imagem grande (_r = regular) de um HTML do PhotoFunia */
function extrairImagemUrl(html) {
  // Padrão real: https://u.photofunia.com/2/results/E/u/EupX5fo..._r.jpg
  // Prioridade: _r (regular/large) > qualquer .jpg do u.photofunia.com
  const patterns = [
    // 1. u.photofunia.com com sufixo _r (regular - maior qualidade)
    /https?:\/\/u\.photofunia\.com\/[^"'\s<>]+_r\.jpg/i,
    // 2. u.photofunia.com qualquer jpg
    /https?:\/\/u\.photofunia\.com\/[^"'\s<>]+\.jpg/i,
    // 3. cdn.photofunia.com/results (fallback para outros efeitos)
    /https?:\/\/cdn\.photofunia\.com\/results\/[^"'\s<>]+\.jpg/i,
    /https?:\/\/cdn\.photofunia\.com\/results\/[^"'\s<>]+\.png/i,
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (m) {
      // Remove ?download se vier junto
      return m[0].split("?")[0];
    }
  }
  return null;
}

async function aplicarEfeito(imgBuffer, slug) {
  const uploadUrl = `https://m.photofunia.com/categories/all_effects/${slug}?server=1`;
  infoLog(`[photofunia] POST ${uploadUrl} (${imgBuffer.length} bytes)`);

  const form = new FormData();
  const blob = new Blob([imgBuffer], { type: "image/jpeg" });
  form.append("image", blob, "photo.jpg");

  // POST — o servidor redireciona para /results/<id>
  const uploadRes = await fetch(uploadUrl, {
    method:   "POST",
    body:     form,
    headers:  {
      ...HEADERS,
      "Referer": `https://m.photofunia.com/categories/all_effects/${slug}`,
      "Origin":  "https://m.photofunia.com",
    },
    redirect: "follow",
    signal:   AbortSignal.timeout(60_000),
  });

  if (!uploadRes.ok) throw new Error(`PhotoFunia retornou HTTP ${uploadRes.status}`);

  const finalUrl = uploadRes.url;
  infoLog(`[photofunia] URL final: ${finalUrl}`);

  const html = await uploadRes.text();
  infoLog(`[photofunia] HTML: ${html.length} chars`);

  const imgUrl = extrairImagemUrl(html);

  if (!imgUrl) {
    infoLog(`[photofunia] HTML snippet (debug): ${html.substring(0, 2000)}`);
    throw new Error("Não foi possível extrair a imagem do resultado.");
  }

  infoLog(`[photofunia] Baixando: ${imgUrl}`);
  const imgRes = await fetch(imgUrl, {
    headers: { ...HEADERS, "Referer": finalUrl },
    signal:  AbortSignal.timeout(30_000),
  });

  if (!imgRes.ok) throw new Error(`Erro ao baixar imagem: HTTP ${imgRes.status}`);

  return Buffer.from(await imgRes.arrayBuffer());
}

export default {
  name: "photofunia",
  description: "Aplica efeitos do PhotoFunia em uma imagem.",
  commands: ["pfx", "obama", "putin", "photofunia"],
  usage:
    `*${PREFIX}obama* — Obama segurando sua foto\n` +
    `*${PREFIX}putin* — Putin no escritório\n` +
    `*${PREFIX}pfx <efeito>* — qualquer efeito pelo slug\n` +
    `*${PREFIX}pfx lista* — ver efeitos disponíveis\n\n` +
    `Envie ou responda uma imagem para usar.`,

  handle: async ({
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    sendReply,
    sendImageFromBuffer,
    webMessage,
    isImage,
    downloadImage,
    command,
    args,
    fullArgs,
  }) => {
    // ── Lista de efeitos ────────────────────────────────────────────────
    const subCmd = (args[0] || "").toLowerCase().trim();
    if (subCmd === "lista" || subCmd === "list") {
      // Mostra só o primeiro apelido de cada slug (sem repetição)
      const vistos = new Set();
      const amigaveis = Object.entries(EFEITOS)
        .filter(([, slug]) => {
          if (vistos.has(slug)) return false;
          vistos.add(slug);
          return true;
        })
        .map(([k]) => `• *${k}*`)
        .join("\n");
      await sendReply(
        `🎨 *Efeitos disponíveis:*\n\n${amigaveis}\n\n` +
        `Uso: *${PREFIX}pfx <efeito>* + imagem`
      );
      return;
    }

    // ── Determina o slug ────────────────────────────────────────────────
    let slug;
    if (command === "obama") {
      slug = "obama";
    } else if (command === "putin") {
      slug = "putin";
    } else {
      const efeitoArg = (args[0] || "").toLowerCase().trim();
      if (!efeitoArg) {
        throw new InvalidParameterError(
          `Informe o efeito!\n\n` +
          `Uso: *${PREFIX}pfx <efeito>* + imagem\n` +
          `*${PREFIX}pfx lista* — ver efeitos`
        );
      }
      slug = EFEITOS[efeitoArg] || efeitoArg;
    }

    // ── Verifica imagem ─────────────────────────────────────────────────
    if (!isImage) {
      throw new InvalidParameterError(
        `Envie ou responda uma *imagem*!\n\n` +
        `Ex: *${PREFIX}${slug}* respondendo uma foto`
      );
    }

    await sendWaitReact();

    const tempName = `pf_${Date.now()}`;
    const imgPath  = path.resolve(TEMP_DIR, `${tempName}.png`);

    try {
      infoLog(`[photofunia] Baixando imagem do usuário → ${imgPath}`);
      await downloadImage(webMessage, tempName);

      if (!fs.existsSync(imgPath)) {
        throw new Error("Imagem não foi baixada corretamente.");
      }

      const imgBuffer = fs.readFileSync(imgPath);
      infoLog(`[photofunia] Imagem: ${imgBuffer.length} bytes | efeito="${slug}"`);

      try { fs.unlinkSync(imgPath); } catch (_) {}

      const resultBuffer = await aplicarEfeito(imgBuffer, slug);
      infoLog(`[photofunia] Resultado: ${resultBuffer.length} bytes`);

      await sendSuccessReact();
      await sendImageFromBuffer(
        resultBuffer,
        `🎨 *${slug}*`
      );
    } catch (error) {
      try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (_) {}
      errorLog(`[photofunia] ERRO: ${error.message}`);
      errorLog(`[photofunia] stack: ${error.stack}`);
      await sendErrorReply(
        `Erro ao aplicar efeito *${slug}*!\n\n` +
        `📄 *Detalhes*: ${error.message}`
      );
    }
  },
};
