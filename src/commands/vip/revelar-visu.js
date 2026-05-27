import fs from "node:fs";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import { downloadContentFromMessage } from "baileys";
import { PREFIX, TEMP_DIR } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { getRandomName } from "../../utils/index.js";

export default {
  name: "revelar-visu",
  description: "Revela uma mídia de visualização única (foto, vídeo ou áudio).",
  commands: ["revisu", "revelarvis", "rv2"],
  usage: `${PREFIX}revisu`,

  handle: async ({
    webMessage,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    sendImageFromFile,
    sendVideoFromFile,
    sendAudioFromFile,
  }) => {
    const quoted =
      webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) {
      throw new InvalidParameterError(
        "Responda uma mensagem de visu única para usar este comando."
      );
    }

    const isImage = !!quoted.imageMessage;
    const isVideo = !!quoted.videoMessage;
    const isAudio = !!quoted.audioMessage;

    if (!isImage && !isVideo && !isAudio) {
      throw new InvalidParameterError(
        "A mensagem respondida nao contem foto, video ou audio."
      );
    }

    await sendWaitReact();

    let filePath = null;

    try {
      let mediaContent, mediaType, ext;

      if (isImage) {
        mediaContent = quoted.imageMessage;
        mediaType    = "image";
        ext          = "jpg";
      } else if (isVideo) {
        mediaContent = quoted.videoMessage;
        mediaType    = "video";
        ext          = "mp4";
      } else {
        mediaContent = quoted.audioMessage;
        mediaType    = "audio";
        ext          = "mp3";
      }

      const stream = await downloadContentFromMessage(mediaContent, mediaType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      filePath = path.resolve(TEMP_DIR, `${getRandomName()}.${ext}`);
      await writeFile(filePath, buffer);

      if (isImage) {
        await sendImageFromFile(filePath, "Foto da visualizacao unica!");
      } else if (isVideo) {
        await sendVideoFromFile(filePath, "Video da visualizacao unica!");
      } else {
        await sendAudioFromFile(filePath, false);
      }

      await sendSuccessReact();
    } catch (err) {
      console.error("[revelar-visu] Erro:", err);
      await sendErrorReply("Erro ao revelar: " + err.message);
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }
    }
  },
};
