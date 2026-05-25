/**
 * Comando: audiolento / slow
 * Deixa o áudio mais lento e envia como mensagem de voz.
 */
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PREFIX, TEMP_DIR } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";
import { getRandomName } from "../../../utils/index.js";

export default {
  name: "audiolento",
  description: "Deixa o áudio mais lento e envia como mensagem de voz!",
  commands: ["audiolento", "slow"],
  usage: `${PREFIX}audiolento (responda um áudio)`,

  handle: async ({
    sendReply,
    sendReact,
    isReply,
    webMessage,
    remoteJid,
    socket,
  }) => {
    const isAudio = !!webMessage?.message?.audioMessage;
    const isQuotedAudio =
      isReply &&
      !!webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
        ?.audioMessage;

    if (!isAudio && !isQuotedAudio) {
      throw new WarningError("Marque um áudio ou envie junto ao comando!");
    }

    await sendReact("🎵");
    await sendReply("_Processando o áudio, aguarde..._");

    const inputPath = path.resolve(TEMP_DIR, getRandomName("ogg"));
    const outputPath = path.resolve(TEMP_DIR, getRandomName("ogg"));

    try {
      // Pega o audioMessage correto
      const audioMessage = isQuotedAudio
        ? webMessage.message.extendedTextMessage.contextInfo.quotedMessage
            .audioMessage
        : webMessage.message.audioMessage;

      // Baixa o áudio manualmente via stream do Baileys
      const { downloadContentFromMessage } = await import("baileys");

      const stream = await downloadContentFromMessage(audioMessage, "audio");

      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      fs.writeFileSync(inputPath, buffer);

      // Converte com ffmpeg para ogg/opus com velocidade reduzida
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -i "${inputPath}" -filter:a "atempo=0.85" -c:a libopus -b:a 64k -vn -f ogg -y "${outputPath}"`,
          (err, stdout, stderr) => {
            try { fs.unlinkSync(inputPath); } catch {}
            if (err) {
              console.error("[audiolento ffmpeg]", stderr);
              return reject(new Error("Erro ao processar com ffmpeg!"));
            }
            resolve();
          }
        );
      });

      const audioBuffer = fs.readFileSync(outputPath);

      await socket.sendMessage(
        remoteJid,
        {
          audio: audioBuffer,
          mimetype: "audio/ogg; codecs=opus",
          ptt: true,
        },
        { quoted: webMessage }
      );
    } catch (err) {
      throw new WarningError(
        `Não foi possível processar o áudio!\n\n*Detalhes:* ${err.message}`
      );
    } finally {
      try { fs.unlinkSync(outputPath); } catch {}
    }
  },
}; 