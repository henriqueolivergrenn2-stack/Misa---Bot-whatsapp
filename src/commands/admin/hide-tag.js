/**
 * 📢 Hide Tag — copia exatamente a mensagem respondida e marca todos.
 * Suporta: texto, imagem, vídeo, sticker, áudio, documento.
 * Nenhum texto extra é enviado além do conteúdo original.
 *
 * Colocar em: src/commands/admin/hide-tag.js
 */

import { downloadContentFromMessage } from "baileys";
import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";

async function toBuffer(stream) {
  let buf = Buffer.alloc(0);
  for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
  return buf;
}

export default {
  name: "hide-tag",
  description: "Copia a mensagem respondida e marca todos do grupo.",
  commands: ["hide-tag", "to-tag", "marcar", "marca", "tag-all", "hidetag"],
  usage: `${PREFIX}hidetag  (responda a uma mensagem)`,

  handle: async ({ socket, remoteJid, webMessage, sendWarningReply }) => {
    // ── Pega o contextInfo da mensagem respondida ─────────────────────────
    const contextInfo =
      webMessage?.message?.extendedTextMessage?.contextInfo ||
      webMessage?.message?.imageMessage?.contextInfo ||
      webMessage?.message?.videoMessage?.contextInfo ||
      webMessage?.message?.documentMessage?.contextInfo ||
      webMessage?.message?.audioMessage?.contextInfo ||
      webMessage?.message?.stickerMessage?.contextInfo ||
      null;

    const quoted = contextInfo?.quotedMessage;

    if (!quoted) {
      throw new WarningError(
        "Responda a uma mensagem com este comando!\n\nExemplo: responda uma foto com *" + PREFIX + "hidetag*"
      );
    }

    // ── Busca todos os participantes para menção ──────────────────────────
    const { participants } = await socket.groupMetadata(remoteJid);
    const mentions = participants.map(({ id }) => id);

    // ── Detecta o tipo e reenvia exatamente o conteúdo ───────────────────

    // 1. STICKER
    if (quoted.stickerMessage) {
      const stream = await downloadContentFromMessage(quoted.stickerMessage, "sticker");
      const buffer = await toBuffer(stream);
      await socket.sendMessage(remoteJid, {
        sticker: buffer,
        mentions,
      });
      return;
    }

    // 2. IMAGEM
    if (quoted.imageMessage) {
      const stream  = await downloadContentFromMessage(quoted.imageMessage, "image");
      const buffer  = await toBuffer(stream);
      const caption = quoted.imageMessage.caption || "";
      await socket.sendMessage(remoteJid, {
        image:   buffer,
        caption,
        mentions,
      });
      return;
    }

    // 3. VÍDEO
    if (quoted.videoMessage) {
      const stream  = await downloadContentFromMessage(quoted.videoMessage, "video");
      const buffer  = await toBuffer(stream);
      const caption = quoted.videoMessage.caption || "";
      await socket.sendMessage(remoteJid, {
        video:   buffer,
        caption,
        mentions,
        gifPlayback: quoted.videoMessage.gifPlayback || false,
      });
      return;
    }

    // 4. ÁUDIO / PTT
    if (quoted.audioMessage || quoted.pttMessage) {
      const audioMsg = quoted.audioMessage || quoted.pttMessage;
      const stream   = await downloadContentFromMessage(audioMsg, "audio");
      const buffer   = await toBuffer(stream);
      await socket.sendMessage(remoteJid, {
        audio:   buffer,
        mimetype: audioMsg.mimetype || "audio/ogg; codecs=opus",
        ptt:     audioMsg.ptt ?? true,
        mentions,
      });
      return;
    }

    // 5. DOCUMENTO
    if (quoted.documentMessage) {
      const stream   = await downloadContentFromMessage(quoted.documentMessage, "document");
      const buffer   = await toBuffer(stream);
      await socket.sendMessage(remoteJid, {
        document: buffer,
        mimetype: quoted.documentMessage.mimetype || "application/octet-stream",
        fileName: quoted.documentMessage.fileName || "arquivo",
        caption:  quoted.documentMessage.caption || "",
        mentions,
      });
      return;
    }

    // 6. TEXTO (conversation ou extendedTextMessage)
    const text =
      quoted.conversation ||
      quoted.extendedTextMessage?.text ||
      "";

    if (text) {
      await socket.sendMessage(remoteJid, { text, mentions });
      return;
    }

    // Tipo não suportado
    throw new WarningError("Tipo de mensagem não suportado para este comando.");
  },
};
