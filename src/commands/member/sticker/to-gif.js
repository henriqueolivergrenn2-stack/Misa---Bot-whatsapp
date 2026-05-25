/**
 * Comando: togif / gif
 * Converte figurinha animada (WebP) em GIF que reproduz no WhatsApp.
 * Salve em: src/commands/sticker/togif.js
 *
 * Pipeline:
 *   1. sharp extrai cada frame do WebP animado como PNG
 *      (necessário pois ffmpeg 8.x no Termux não decodifica ANIM/ANMF)
 *   2. ffmpeg combina os PNGs em MP4 (libx264)
 *   3. Enviado com gifPlayback:true → toca em loop automático no WhatsApp
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { PREFIX, TEMP_DIR } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { getRandomName } from "../../../utils/index.js";
import { errorLog, infoLog } from "../../../utils/logger.js";

const execFileAsync = promisify(execFile);

// ─── Limpeza de arquivos temporários ─────────────────────────────────────────
function cleanup(...files) {
  for (const f of files) {
    try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {}
  }
}

// ─── Extrai frames do WebP animado e converte para MP4 ───────────────────────
async function webpToMp4(webpPath, mp4Path, baseName) {
  const { default: sharp } = await import("sharp");

  // 1. Lê metadados do WebP animado
  const meta = await sharp(webpPath, { animated: true }).metadata();

  const frameCount = meta.pages ?? 1;
  const delays     = Array.isArray(meta.delay) ? meta.delay : [];

  infoLog(`[togif] ${frameCount} frame(s) encontrado(s)`);

  if (frameCount <= 1) {
    throw new Error(
      "Esta figurinha não é animada (1 frame apenas).\n" +
      "Use uma figurinha que se mova!"
    );
  }

  // 2. Calcula FPS a partir dos delays do WebP
  let fps = 15;
  if (delays.length > 0) {
    const avg = delays.reduce((s, d) => s + d, 0) / delays.length;
    // avg em ms → fps; clamp entre 5 e 30
    fps = Math.min(30, Math.max(5, Math.round(1000 / Math.max(avg, 34))));
  }
  infoLog(`[togif] FPS calculado: ${fps}`);

  // 3. Extrai cada frame como PNG
  const framePaths = [];
  for (let i = 0; i < frameCount; i++) {
    const framePath = path.resolve(
      TEMP_DIR,
      `${baseName}_f${String(i).padStart(4, "0")}.png`
    );
    await sharp(webpPath, { page: i })
      .resize(512, 512, { fit: "fill" })
      .png()
      .toFile(framePath);
    framePaths.push(framePath);
  }
  infoLog(`[togif] ${framePaths.length} frames extraídos → codificando MP4...`);

  // 4. Combina PNGs em MP4 via ffmpeg
  //    ffmpeg lida perfeitamente com PNG — sem problemas de ANIM/ANMF
  const pattern = path.resolve(TEMP_DIR, `${baseName}_f%04d.png`);
  await execFileAsync("ffmpeg", [
    "-y",
    "-framerate", String(fps),
    "-i",         pattern,
    "-vf",        "format=yuv420p",   // obrigatório para libx264
    "-c:v",       "libx264",
    "-preset",    "fast",
    "-crf",       "20",
    "-movflags",  "+faststart",
    mp4Path,
  ]);

  return framePaths; // para limpeza posterior
}

// ─── Exportação do comando ────────────────────────────────────────────────────
export default {
  name: "togif",
  description: "Converte figurinha animada em GIF que toca no WhatsApp.",
  commands: ["togif", "gif"],
  usage: `${PREFIX}togif — responda uma figurinha animada`,

  handle: async ({
    isSticker,
    downloadSticker,
    webMessage,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    socket,
    remoteJid,
  }) => {
    if (!isSticker) {
      throw new InvalidParameterError(
        `Responda uma *figurinha animada* com este comando!\n\n` +
        `Segure a figurinha → *Responder* → *${PREFIX}togif*`
      );
    }

    await sendWaitReact();

    const baseName  = getRandomName();
    const webpPath  = path.resolve(TEMP_DIR, `${baseName}.webp`);
    const mp4Path   = path.resolve(TEMP_DIR, `${baseName}.mp4`);
    let   framePaths = [];

    try {
      // Download
      infoLog(`[togif] Baixando figurinha...`);
      await downloadSticker(webMessage, baseName);

      if (!fs.existsSync(webpPath))
        throw new Error("Figurinha não foi baixada corretamente.");

      const webpSize = fs.statSync(webpPath).size;
      infoLog(`[togif] WebP: ${webpSize} bytes`);

      if (webpSize < 100)
        throw new Error("Arquivo da figurinha está vazio ou corrompido.");

      // Extrai frames + codifica MP4
      framePaths = await webpToMp4(webpPath, mp4Path, baseName);

      if (!fs.existsSync(mp4Path) || fs.statSync(mp4Path).size === 0)
        throw new Error("MP4 não foi gerado após a conversão.");

      infoLog(`[togif] MP4: ${fs.statSync(mp4Path).size} bytes — enviando...`);

      await sendSuccessReact();

      // Envia como vídeo gifPlayback → toca em loop automático
      await socket.sendMessage(
        remoteJid,
        {
          video:       fs.readFileSync(mp4Path),
          gifPlayback: true,
          mimetype:    "video/mp4",
        },
        { quoted: webMessage }
      );
    } catch (error) {
      errorLog(`[togif] ERRO: ${error.message}`);
      await sendErrorReply(
        `Não foi possível converter a figurinha!\n\n` +
        `📄 *Detalhes:* ${error.message}`
      );
    } finally {
      // Limpa todos os temporários
      cleanup(webpPath, mp4Path, ...framePaths);
    }
  },
};
