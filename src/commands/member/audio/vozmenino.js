/**
 * Comando: vozmenino / adolesc
 * Deixa o áudio com voz de menino/adolescente e envia como mensagem de voz.
 */
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PREFIX, TEMP_DIR } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";
import { getRandomName } from "../../../utils/index.js";

export default {
  name: "vozmenino",
  description: "Deixa o áudio com voz de menino/adolescente e envia como mensagem de voz!",
  commands: ["vozmenino", "adolesc"],
  usage: `${PREFIX}vozmenino (responda um áudio)`,

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
      throw new WarningError(
        "Marque um áudio ou envie junto ao comando!"
      );
    }

    await sendReact("🎙️");
    await sendReply("_Processando o áudio, aguarde..._");

    const inputPath = path.resolve(TEMP_DIR, getRandomName("ogg"));
    const outputPath = path.resolve(TEMP_DIR, getRandomName("ogg"));

    try {
      const audioMessage = isQuotedAudio
        ? webMessage.message.extendedTextMessage.contextInfo.quotedMessage
            .audioMessage
        : webMessage.message.audioMessage;

      const { downloadContentFromMessage } = await import("baileys");

      const stream = await downloadContentFromMessage(audioMessage, "audio");

      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      fs.writeFileSync(inputPath, buffer);

      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -i "${inputPath}" -filter:a "atempo=1.06,asetrate=44100*1.25" -c:a libopus -b:a 64k -vn -f ogg -y "${outputPath}"`,
          (err, stdout, stderr) => {
            try { fs.unlinkSync(inputPath); } catch {}
            if (err) {
              console.error("[vozmenino ffmpeg]", stderr);
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