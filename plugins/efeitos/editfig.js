/**
 * Comando: editfig / editsticker
 * Marque (responda) uma figurinha com o comando e o bot mostra um menu de
 * edições. Responda só com o número (1 a 7) direto no chat, sem comando.
 */
import { aplicarFiltroWebp } from '../../arquivos/js/stickerEditUtils.js';
import { enviarStickerWebp } from '../../arquivos/js/ttpUtils.js';
import { RedLog } from '../../arquivos/js/logger.js';

const TEMPO_ESPERA_MS = 60_000;

// Map<remoteJid, { bufferOriginal, timeout }>
const sessoesEdit = new Map();

function menuEdicao() {
  return (
    `🛠️ Figurinha recebida! Escolha a edição:\n\n` +
    `*1* — 🔄 Girar 90°\n` +
    `*2* — 🪞 Espelhar\n` +
    `*3* — ⏩ Acelerar (2x)\n` +
    `*4* — ⏪ Câmera lenta (0.5x)\n` +
    `*5* — ⏮️ Inverter animação\n` +
    `*6* — ❄️ Congelar (1 frame, vira estática)\n` +
    `*7* — ⭕ Recortar em círculo\n\n` +
    `_Responda só com o número (1 a 7). Expira em 1 minuto._`
  );
}

function metadataSticker() {
  const agora = new Date();
  return {
    packname: `⛩🌸 Hiyuki Supreme ● MisheruModz </> 🌸⛩`,
    author: `Editado em ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
  };
}

// ─── Sessão (resposta 1 a 7 direto no chat) ─────────────────────────────────

function temSessaoAtiva(from) {
  return sessoesEdit.has(from);
}

async function processarResposta({ from, resposta, columbina, info, reply, reagir }) {
  const sessao = sessoesEdit.get(from);
  if (!sessao) return false;

  clearTimeout(sessao.timeout);
  sessoesEdit.delete(from);

  const { bufferOriginal } = sessao;

  await reagir('⏰');

  try {
    let editado;

    switch (resposta) {
      case '1':
        editado = await aplicarFiltroWebp(bufferOriginal, 'girar');
        break;
      case '2':
        editado = await aplicarFiltroWebp(bufferOriginal, 'espelhar');
        break;
      case '3':
        editado = await aplicarFiltroWebp(bufferOriginal, 'acelerar');
        break;
      case '4':
        editado = await aplicarFiltroWebp(bufferOriginal, 'lento');
        break;
      case '5':
        editado = await aplicarFiltroWebp(bufferOriginal, 'inverter');
        break;
      case '6':
        editado = await aplicarFiltroWebp(bufferOriginal, 'congelar');
        break;
      case '7':
        editado = await aplicarFiltroWebp(bufferOriginal, 'circulo');
        break;
      default:
        return true;
    }

    await enviarStickerWebp(columbina, from, info, editado, metadataSticker());
    await reagir('✅');
  } catch (err) {
    RedLog(`[EditFig] Erro: ${err.message}\n${err.stack}`);
    await reagir('❌');
    await reply(`❌ Não consegui editar a figurinha.`);
  }

  return true;
}

// ─── Comando principal ──────────────────────────────────────────────────────

export default {
  name: 'editfig',
  description: 'Edita uma figurinha: gira, espelha, acelera, congela, recorta em círculo e mais!',
  category: 'efeitos',
  aliases: ['editsticker', 'stickeredit'],

  async execute({ info, from, reply, reagir, getFileBuffer, prefix }) {
    const RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const stickerMsg = RSM?.stickerMessage || info.message?.stickerMessage;

    if (!stickerMsg) {
      return reply(`Marque (responda) uma figurinha com o comando!\n\nExemplo: responda uma figurinha com *${prefix}editfig*`);
    }

    await reagir('📥');

    let bufferOriginal;
    try {
      bufferOriginal = await getFileBuffer(stickerMsg, 'sticker');
    } catch (err) {
      RedLog(`[EditFig] Erro ao baixar figurinha: ${err.message}`);
      await reagir('❌');
      return reply('Não consegui baixar essa figurinha. Tente marcar de novo!');
    }

    const antiga = sessoesEdit.get(from);
    if (antiga) clearTimeout(antiga.timeout);

    const timeout = setTimeout(() => {
      sessoesEdit.delete(from);
    }, TEMPO_ESPERA_MS);

    sessoesEdit.set(from, { bufferOriginal, timeout });

    await reagir('🛠️');
    await reply(menuEdicao());
  },
};

export { temSessaoAtiva, processarResposta };
