/**
 * Comando: play
 * Baixa áudio ou vídeo do YouTube via busca ou link.
 * Mostra thumbnail + título e pergunta o formato via chat (1=áudio, 2=vídeo).
 */
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { PREFIX, TEMP_DIR } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { getRandomName } from "../../../utils/index.js";
import { errorLog } from "../../../utils/logger.js";

const execAsync = promisify(exec);

// Map<remoteJid, { url, title, timeout }>
export const playSessions = new Map();

function cleanup(...files) {
  for (const f of files) {
    try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {}
  }
}

async function resolveUrl(input) {
  const isUrl = /youtu(be\.com|\.be)/i.test(input);
  if (isUrl) return { url: input.trim(), videoId: extractId(input) };

  const { stdout } = await execAsync(
    `yt-dlp "ytsearch1:${input.replace(/"/g, "")}" --get-id --no-playlist`,
    { timeout: 30_000 }
  );
  const videoId = stdout.trim();
  if (!videoId) throw new Error("Nenhum vídeo encontrado para essa busca.");
  return { url: `https://www.youtube.com/watch?v=${videoId}`, videoId };
}

function extractId(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

async function getVideoInfo(url) {
  const { stdout } = await execAsync(
    `yt-dlp --no-playlist --print "%(title)s\n%(duration>%M:%S)s\n%(uploader)s" "${url}"`,
    { timeout: 30_000 }
  );
  const [title = "Sem título", duration = "?", uploader = "?"] = stdout.trim().split("\n");
  return { title, duration, uploader };
}

async function downloadAudio(url, outPath) {
  await execAsync(
    `yt-dlp -x --audio-format mp3 --audio-quality 0 --no-playlist -o "${outPath}" "${url}"`,
    { timeout: 120_000 }
  );
}

async function downloadVideo(url, rawPath, fixedPath) {
  await execAsync(
    `yt-dlp -f "best[ext=mp4][height<=480]/best[ext=mp4]/best" --no-playlist -o "${rawPath}" "${url}"`,
    { timeout: 180_000 }
  );
  try {
    await execAsync(
      `ffmpeg -i "${rawPath}" -c copy -movflags +faststart -y "${fixedPath}"`,
      { timeout: 120_000 }
    );
  } catch (_) {}
}

export async function processPlayAnswer(paramsHandler) {
  const {
    remoteJid, fullMessage,
    sendWaitReact, sendSuccessReact,
    sendErrorReply, sendAudioFromFile, sendVideoFromFile,
  } = paramsHandler;

  const session = playSessions.get(remoteJid);
  const trimmed = (fullMessage ?? "").trim();

  if (!session) return false;
  if (trimmed !== "1" && trimmed !== "2") return false;

  clearTimeout(session.timeout);
  playSessions.delete(remoteJid);

  const { url, title } = session;
  const isAudio = trimmed === "1";

  await sendWaitReact();

  const name = getRandomName();

  if (isAudio) {
    const outPath = path.resolve(TEMP_DIR, `${name}.mp3`);
    try {
      await downloadAudio(url, outPath);
      if (!fs.existsSync(outPath)) throw new Error("Arquivo não gerado.");
      await sendSuccessReact();
      await sendAudioFromFile(outPath, false);
    } catch (err) {
      errorLog(`[play] Erro áudio: ${err.message}`);
      await sendErrorReply(`Erro ao baixar o áudio!\n\n📄 *Detalhes:* ${err.message}`);
    } finally {
      cleanup(outPath);
    }
  } else {
    const rawPath   = path.resolve(TEMP_DIR, `${name}.mp4`);
    const fixedPath = path.resolve(TEMP_DIR, `${name}_fixed.mp4`);
    try {
      await downloadVideo(url, rawPath, fixedPath);
      const finalPath = fs.existsSync(fixedPath) ? fixedPath : rawPath;
      if (!fs.existsSync(finalPath)) throw new Error("Arquivo não gerado.");
      await sendSuccessReact();
      await sendVideoFromFile(finalPath);
    } catch (err) {
      errorLog(`[play] Erro vídeo: ${err.message}`);
      await sendErrorReply(`Erro ao baixar o vídeo!\n\n📄 *Detalhes:* ${err.message}`);
    } finally {
      cleanup(rawPath, fixedPath);
    }
  }

  return true;
}

export default {
  name: "play",
  description: "Baixa áudio ou vídeo do YouTube. Busca por nome ou link.",
  commands: [
    "play", "yt", "youtube",
    "yt-mp3", "mp3", "play-audio",
    "yt-mp4", "mp4", "play-video",
  ],
  usage:
    `*${PREFIX}play <nome ou link>*\n` +
    `Ex: *${PREFIX}play Bohemian Rhapsody*`,

  handle: async ({
    sendReply,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    sendImageFromURL,
    sendAudioFromFile,
    sendVideoFromFile,
    remoteJid,
    commandName,
    fullArgs,
  }) => {
    if (!fullArgs?.trim()) {
      throw new InvalidParameterError(
        `Informe o nome ou link do vídeo!\n\n` +
        `*Exemplos:*\n` +
        `› *${PREFIX}play Bohemian Rhapsody*\n` +
        `› *${PREFIX}play https://youtu.be/...*`
      );
    }

    const forceAudio = ["yt-mp3", "mp3", "play-audio"].includes(commandName);
    const forceVideo = ["yt-mp4", "mp4", "play-video"].includes(commandName);

    await sendWaitReact();

    try {
      const { url, videoId } = await resolveUrl(fullArgs);
      const { title, duration, uploader } = await getVideoInfo(url);

      const thumbUrl = videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : null;

      const caption =
        `🎵 *${title}*\n` +
        `👤 ${uploader}\n` +
        `⏱️ ${duration}\n\n` +
        (forceAudio || forceVideo
          ? `⬇️ Baixando ${forceAudio ? "áudio 🎵" : "vídeo 🎬"}...`
          : `Responda com:\n*1* — 🎵 Áudio (MP3)\n*2* — 🎬 Vídeo (MP4)`
        );

      if (thumbUrl) {
        try {
          await sendImageFromURL(thumbUrl, caption);
        } catch (_) {
          await sendReply(caption);
        }
      } else {
        await sendReply(caption);
      }

      if (forceAudio || forceVideo) {
        const name = getRandomName();
        if (forceAudio) {
          const outPath = path.resolve(TEMP_DIR, `${name}.mp3`);
          try {
            await downloadAudio(url, outPath);
            if (!fs.existsSync(outPath)) throw new Error("Arquivo não gerado.");
            await sendSuccessReact();
            await sendAudioFromFile(outPath, false);
          } finally {
            cleanup(outPath);
          }
        } else {
          const rawPath   = path.resolve(TEMP_DIR, `${name}.mp4`);
          const fixedPath = path.resolve(TEMP_DIR, `${name}_fixed.mp4`);
          try {
            await downloadVideo(url, rawPath, fixedPath);
            const finalPath = fs.existsSync(fixedPath) ? fixedPath : rawPath;
            if (!fs.existsSync(finalPath)) throw new Error("Arquivo não gerado.");
            await sendSuccessReact();
            await sendVideoFromFile(finalPath);
          } finally {
            cleanup(rawPath, fixedPath);
          }
        }
        return;
      }

      // Salva sessão aguardando 1 ou 2
      const old = playSessions.get(remoteJid);
      if (old) clearTimeout(old.timeout);

      const timeout = setTimeout(() => {
        playSessions.delete(remoteJid);
      }, 120_000);

      playSessions.set(remoteJid, { url, title, timeout });

    } catch (err) {
      errorLog(`[play] ERRO: ${err.message}`);
      await sendErrorReply(
        err.message.includes("Nenhum")
          ? err.message
          : `Erro ao buscar o vídeo!\n\n📄 *Detalhes:* ${err.message}`
      );
    }
  },
};
