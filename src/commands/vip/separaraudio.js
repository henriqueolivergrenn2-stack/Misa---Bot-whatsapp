/**
 * COMANDO: separaraudio
 * Separa o áudio e o vídeo de um vídeo e envia os dois.
 * Compatível com Takeshi Bot + Termux
 *
 * PRÉ-REQUISITO: pkg install ffmpeg
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PREFIX, TEMP_DIR } from "../../config.js";
import { WarningError } from "../../errors/index.js";

const execFileAsync = promisify(execFile);
const FFMPEG = "ffmpeg";

function tmpFile(ext) {
  const id = Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  return path.join(TEMP_DIR || os.tmpdir(), "sep_" + id + "." + ext);
}

function cleanup(...files) {
  for (const f of files) {
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
  }
}

async function streamToBuffer(stream) {
  let buf = Buffer.alloc(0);
  for await (const chunk of stream) {
    buf = Buffer.concat([buf, chunk]);
  }
  return buf;
}

export default {
  name: "separaraudio",
  description: "Separa o áudio e o vídeo de um vídeo e envia os dois arquivos.",
  commands: ["separaraudio"],
  usage: `${PREFIX}separaraudio (envie ou responda um vídeo)`,

  handle: async ({ sendReply, sendReact, webMessage, socket, remoteJid, isReply }) => {
    const msg = webMessage?.message;

    // Detecta vídeo direto ou em resposta
    const isVideo        = !!msg?.videoMessage;
    const isQuotedVideo  = isReply && !!msg?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;

    if (!isVideo && !isQuotedVideo) {
      throw new WarningError("Envie ou responda a um vídeo para usar este comando!");
    }

    await sendReact("⏳");
    await sendReply("⏳ Separando áudio e vídeo, aguarde...");

    const videoMsg = isQuotedVideo
      ? msg.extendedTextMessage.contextInfo.quotedMessage.videoMessage
      : msg.videoMessage;

    const inputPath    = tmpFile("mp4");
    const audioOutPath = tmpFile("mp3");
    const videoOutPath = tmpFile("mp4");

    try {
      // 1. Baixa o vídeo via Baileys
      const { downloadContentFromMessage } = await import("baileys");
      const stream = await downloadContentFromMessage(videoMsg, "video");
      const buffer = await streamToBuffer(stream);
      fs.writeFileSync(inputPath, buffer);

      // 2. Extrai áudio e vídeo mudo em paralelo
      await Promise.all([
        execFileAsync(FFMPEG, ["-y", "-i", inputPath, "-vn", "-acodec", "libmp3lame", "-ab", "192k", audioOutPath]),
        execFileAsync(FFMPEG, ["-y", "-i", inputPath, "-an", "-vcodec", "copy", videoOutPath]),
      ]);

      // 3. Envia o áudio
      const audioBuf = fs.readFileSync(audioOutPath);
      await socket.sendMessage(
        remoteJid,
        { audio: audioBuf, mimetype: "audio/mpeg" },
        { quoted: webMessage }
      );

      // 4. Envia o vídeo sem áudio
      const videoBuf = fs.readFileSync(videoOutPath);
      await socket.sendMessage(
        remoteJid,
        { video: videoBuf, caption: "🎬 Vídeo *sem áudio*!" },
        { quoted: webMessage }
      );

      await sendReact("✅");

    } catch (err) {
      console.error("[separaraudio]", err?.message || err);
      throw new WarningError(
        "Erro ao processar o vídeo!\n\nVerifique se o ffmpeg está instalado:\n*pkg install ffmpeg*\n\n*Detalhes:* " + err.message
      );
    } finally {
      cleanup(inputPath, audioOutPath, videoOutPath);
    }
  },
};
