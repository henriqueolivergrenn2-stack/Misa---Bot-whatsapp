/**
 * Comando: ttp / attp
 * Cria uma figurinha (sticker) com a frase digitada.
 * Depois de digitar o comando, o bot pergunta o estilo e o usuário responde
 * só com o número (1 a 5) direto no chat (sem precisar de comando de novo).
 */
import { sendImageAsSticker2, sendVideoAsSticker2 } from '../../arquivos/js/exif2.js';
import {
  gerarFramePNG,
  gerarFrameFundo,
  gerarVideoDeFrames,
  gerarWebpAnimadoTransparente,
  gerarWebpEstaticoTransparente,
  enviarStickerWebp,
} from '../../arquivos/js/ttpUtils.js';
import { RedLog } from '../../arquivos/js/logger.js';

const TEMPO_ESPERA_MS = 60_000;
const OPCOES_VALIDAS = ['1', '2', '3', '4', '5'];

// Map<remoteJid, { frase, timeout }>
const sessoesTtp = new Map();

const PALETA_FUNDO = ['#E53935', '#1E88E5', '#43A047', '#FDD835', '#8E24AA', '#FB8C00'];
const PALETA_ARCOIRIS = ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#8E24AA'];

function corAleatoria(paleta) {
  return paleta[Math.floor(Math.random() * paleta.length)];
}

function menuEstilos(frase) {
  return (
    `🎨 Escolha o estilo da figurinha pra:\n*"${frase}"*\n\n` +
    `*1* — ✨ Piscando (sem fundo, transparência real)\n` +
    `*2* — 🌈 Piscando (com fundo colorido)\n` +
    `*3* — 🖼️ Estático (sem fundo, transparência real)\n` +
    `*4* — 🟪 Estático (com fundo colorido)\n` +
    `*5* — 🌀 Arco-íris (sem fundo, cor do texto muda sem sumir)\n\n` +
    `_Responda só com o número (1 a 5). Expira em 1 minuto._`
  );
}

function metadataSticker() {
  const agora = new Date();
  return {
    packname: `⛩🌸 Hiyuki Supreme ● MisheruModz </> 🌸⛩`,
    author: `TTP criado em ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
  };
}

// ─── Geração de cada estilo ─────────────────────────────────────────────────

// 1) Piscando, SEM fundo (transparência real — alpha de verdade, sem halo branco)
async function estiloPiscandoSemFundo(frase) {
  const cor = corAleatoria(PALETA_ARCOIRIS);
  const frameTexto = await gerarFramePNG({ texto: frase, corTexto: cor, transparente: true });
  const frameVazio = await gerarFrameFundo({ transparente: true });
  const frames = [frameTexto, frameVazio, frameTexto, frameVazio];
  return gerarWebpAnimadoTransparente(frames, { fps: 2 });
}

// 2) Piscando, COM fundo colorido (fundo troca de cor, texto sempre visível)
async function estiloPiscandoComFundo(frase) {
  const frames = [];
  for (const cor of PALETA_FUNDO) {
    frames.push(await gerarFramePNG({ texto: frase, corFundo: cor, corTexto: 'black' }));
  }
  return gerarVideoDeFrames(frames, { fps: 2 });
}

// 3) Estático, SEM fundo (transparência real)
async function estiloEstaticoSemFundo(frase) {
  const cor = corAleatoria(PALETA_ARCOIRIS);
  const frame = await gerarFramePNG({ texto: frase, corTexto: cor, transparente: true });
  return gerarWebpEstaticoTransparente(frame);
}

// 4) Estático, COM fundo colorido (cor sorteada, fixa)
async function estiloEstaticoComFundo(frase) {
  const cor = corAleatoria(PALETA_FUNDO);
  return gerarFramePNG({ texto: frase, corFundo: cor, corTexto: 'black' });
}

// 5) Arco-íris, SEM fundo — o texto nunca some, só muda de cor a cada frame
async function estiloArcoIrisSemFundo(frase) {
  const frames = [];
  for (const cor of PALETA_ARCOIRIS) {
    frames.push(await gerarFramePNG({ texto: frase, corTexto: cor, transparente: true }));
  }
  return gerarWebpAnimadoTransparente(frames, { fps: 2 });
}

// ─── Sessão (resposta 1 a 5 direto no chat) ─────────────────────────────────

function temSessaoAtiva(from) {
  return sessoesTtp.has(from);
}

async function processarResposta({ from, resposta, columbina, info, reply, reagir }) {
  const sessao = sessoesTtp.get(from);
  if (!sessao) return false;

  clearTimeout(sessao.timeout);
  sessoesTtp.delete(from);

  const { frase } = sessao;

  await reagir('⏰');

  try {
    switch (resposta) {
      case '1': {
        const webpBuffer = await estiloPiscandoSemFundo(frase);
        await enviarStickerWebp(columbina, from, info, webpBuffer, metadataSticker());
        break;
      }
      case '2': {
        const video = await estiloPiscandoComFundo(frase);
        await sendVideoAsSticker2(columbina, from, video, info, metadataSticker());
        break;
      }
      case '3': {
        const webpBuffer = await estiloEstaticoSemFundo(frase);
        await enviarStickerWebp(columbina, from, info, webpBuffer, metadataSticker());
        break;
      }
      case '4': {
        const imagem = await estiloEstaticoComFundo(frase);
        await sendImageAsSticker2(columbina, from, imagem, info, metadataSticker());
        break;
      }
      case '5': {
        const webpBuffer = await estiloArcoIrisSemFundo(frase);
        await enviarStickerWebp(columbina, from, info, webpBuffer, metadataSticker());
        break;
      }
    }
    await reagir('✅');
  } catch (err) {
    RedLog(`[TTP] Erro ao gerar figurinha: ${err.message}\n${err.stack}`);
    await reagir('❌');
    await reply(`❌ Não consegui gerar a figurinha.`);
  }

  return true;
}

// ─── Comando principal ──────────────────────────────────────────────────────

export default {
  name: 'ttp',
  description: 'Cria uma figurinha com a frase digitada, em diferentes estilos!',
  category: 'efeitos',
  aliases: ['attp', 'textosticker'],

  async execute({ q, from, reply, reagir, prefix }) {
    const frase = (q || '').trim();

    if (!frase) {
      return reply(`Você precisa digitar a frase!\n\nExemplo: *${prefix}ttp Bom dia*`);
    }

    if (frase.length > 100) {
      await reagir('⚠️');
      return reply('Frase muito grande! Use no máximo 100 caracteres.');
    }

    const antiga = sessoesTtp.get(from);
    if (antiga) clearTimeout(antiga.timeout);

    const timeout = setTimeout(() => {
      sessoesTtp.delete(from);
    }, TEMPO_ESPERA_MS);

    sessoesTtp.set(from, { frase, timeout });

    await reagir('🎨');
    await reply(menuEstilos(frase));
  },
};

export { temSessaoAtiva, processarResposta };
