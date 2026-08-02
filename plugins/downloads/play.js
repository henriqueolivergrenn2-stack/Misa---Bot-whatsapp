/**
 * Comando: play / yt / youtube
 * Busca/baixa do YouTube e PERGUNTA antes de enviar:
 *   1 — 🎵 Áudio (MP3)
 *   2 — 🎬 Vídeo (MP4)
 *
 * Também aceita os aliases yt-mp3/ytmp3/mp3 e yt-mp4/ytmp4/mp4 pra baixar
 * direto, sem perguntar (modo antigo, pra quem já sabe o que quer).
 *
 * 🐛 BUG CORRIGIDO: a versão anterior montava o "%(title)s\n%(duration)s..."
 * como uma string só passada pro shell via exec(). O "\n" dentro de aspas
 * duplas do bash NÃO vira quebra de linha (isso só acontece com $'...'), então
 * o yt-dlp devolvia tudo numa linha literal com "\n" no meio do texto, e o
 * .split('\n') não separava nada — por isso título, duração e uploader vinham
 * errados/"?" na legenda. Aqui trocamos pra execFile com argumentos separados
 * (sem passar pelo shell) e usamos múltiplos --print, que o yt-dlp sempre
 * imprime em linhas de verdade.
 *
 * ⚠️ PRÉ-REQUISITO PRA PERGUNTA "1 ou 2" FUNCIONAR:
 * A base Hiyuki só tem um hook pra "esperar a próxima mensagem do usuário"
 * pro jogo da forca (feito sob medida em index.js). Pra esse comando também
 * conseguir esperar sua resposta 1/2, é preciso adicionar um hook igual no
 * index.js — cole o bloco abaixo logo depois do hook da forca (dentro do
 * `if (!isCommand) { ... }`, antes do `if (isGroup) { logMessage(...`):
 *
 * try {
 *   const respostaPlay = budy.trim();
 *   if (respostaPlay === '1' || respostaPlay === '2') {
 *     const playModulo = gerenciadorComandos.ObterModulo('play');
 *     if (playModulo && typeof playModulo.temSessaoAtiva === 'function' && playModulo.temSessaoAtiva(from)) {
 *       const tratouPlay = await playModulo.processarResposta({
 *         from, resposta: respostaPlay, columbina, info,
 *         reply: (texto) => reply(texto, from, info),
 *         reagir: (emj) => reagir(emj, from, info),
 *         getRandom
 *       });
 *       if (tratouPlay) return;
 *     }
 *   }
 * } catch (e) {
 *   RedLog(`Erro no hook do play: ${e.message}`);
 * }
 *
 * (getRandom já é importado no topo do index.js, não precisa importar de novo)
 * Sem esse hook, o comando continua funcionando só no modo direto (mp3/mp4).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs';

const execFileAsync = promisify(execFile);

const ALIASES_AUDIO_DIRETO = ['yt-mp3', 'ytmp3', 'mp3', 'play-audio', 'playaudio'];
const ALIASES_VIDEO_DIRETO = ['yt-mp4', 'ytmp4', 'mp4', 'play-video', 'playvideo'];

// Map<remoteJid, { url, videoId, title, timeout }>
export const playSessions = new Map();

function limpar(...arquivos) {
    for (const f of arquivos) {
        try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {}
    }
}

function extrairId(url) {
    const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

async function resolverUrl(input) {
    const ehUrl = /youtu(be\.com|\.be)/i.test(input);
    if (ehUrl) return { url: input.trim(), videoId: extrairId(input) };

    const { stdout } = await execFileAsync(
        'yt-dlp',
        ['--no-playlist', '--get-id', `ytsearch1:${input.trim()}`],
        { timeout: 40000 }
    );
    const videoId = stdout.trim().split('\n')[0];
    if (!videoId) throw new Error('Nenhum vídeo encontrado.');
    return { url: `https://www.youtube.com/watch?v=${videoId}`, videoId };
}

// Usa múltiplos --print (cada um sai em uma linha de verdade) + --skip-download
// pra não baixar o vídeo à toa só pra pegar as informações.
async function getInfo(url) {
    const { stdout } = await execFileAsync(
        'yt-dlp',
        [
            '--no-playlist',
            '--skip-download',
            '--print', '%(title)s',
            '--print', '%(duration>%M:%S)s',
            '--print', '%(uploader)s',
            url
        ],
        { timeout: 40000 }
    );
    const linhas = stdout.trim().split('\n');
    return {
        title: linhas[0] || 'Sem título',
        duration: linhas[1] || '?',
        uploader: linhas[2] || '?'
    };
}

async function baixarAudio(url, getRandom) {
    const outputPath = getRandom('.mp3');
    await execFileAsync(
        'yt-dlp',
        ['--no-playlist', '-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', outputPath, url],
        { timeout: 180000 }
    );
    if (!fs.existsSync(outputPath)) throw new Error('Arquivo de áudio não foi gerado.');
    return outputPath;
}

async function baixarVideo(url, getRandom) {
    const rawOutput = getRandom('.mp4');
    const fixedOutput = rawOutput.replace(/\.mp4$/, '_fixed.mp4');

    await execFileAsync(
        'yt-dlp',
        ['--no-playlist', '-f', 'best[ext=mp4][height<=480]/best[ext=mp4]/best', '-o', rawOutput, url],
        { timeout: 240000 }
    );
    if (!fs.existsSync(rawOutput)) throw new Error('Arquivo de vídeo não foi gerado.');

    let arquivoFinal = rawOutput;
    try {
        await execFileAsync(
            'ffmpeg',
            ['-i', rawOutput, '-c', 'copy', '-movflags', '+faststart', '-y', fixedOutput],
            { timeout: 120000 }
        );
        if (fs.existsSync(fixedOutput) && fs.statSync(fixedOutput).size > 0) arquivoFinal = fixedOutput;
    } catch (_) {
        // segue com o arquivo original se o remux falhar
    }

    return { rawOutput, fixedOutput, arquivoFinal };
}

export function temSessaoAtiva(from) {
    return playSessions.has(from);
}

// Chamado pelo hook do index.js quando o usuário responde "1" ou "2"
// enquanto existe uma sessão de play aberta pra esse chat.
export async function processarResposta({ from, resposta, columbina, info, reply, reagir, getRandom }) {
    const sessao = playSessions.get(from);
    if (!sessao) return false;
    if (resposta !== '1' && resposta !== '2') return false;

    clearTimeout(sessao.timeout);
    playSessions.delete(from);

    const { url } = sessao;
    const ehAudio = resposta === '1';

    await reagir('⏳');

    try {
        if (ehAudio) {
            const outputPath = await baixarAudio(url, getRandom);
            try {
                await columbina.sendMessage(from, {
                    audio: fs.readFileSync(outputPath),
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: info });
                await reagir('✅');
            } finally {
                limpar(outputPath);
            }
        } else {
            const { rawOutput, fixedOutput, arquivoFinal } = await baixarVideo(url, getRandom);
            try {
                await columbina.sendMessage(from, {
                    video: fs.readFileSync(arquivoFinal),
                    caption: '🌸 Aqui está seu vídeo do YouTube!'
                }, { quoted: info });
                await reagir('✅');
            } finally {
                limpar(rawOutput, fixedOutput);
            }
        }
    } catch (err) {
        await reagir('❌');
        await reply(`❌ Ocorreu um erro ao baixar.\n\n(${err.message})`);
    }

    return true;
}

export default {
    name: 'play',
    description: 'Baixa do YouTube perguntando 1 (áudio) ou 2 (vídeo) antes de enviar',
    category: 'downloads',
    aliases: ['yt', 'youtube', ...ALIASES_AUDIO_DIRETO, ...ALIASES_VIDEO_DIRETO],

    async execute({ q, command, columbina, from, info, reply, reagir, prefix, getRandom }) {
        const entrada = (q || '').trim();

        if (!entrada) {
            await reagir('❌');
            return reply(
                `❌ Informe o nome ou link do vídeo!\n\n` +
                `Exemplos:\n` +
                `› ${prefix}play Bohemian Rhapsody\n` +
                `› ${prefix}play https://youtu.be/...`
            );
        }

        const forcarAudio = ALIASES_AUDIO_DIRETO.includes(command);
        const forcarVideo = ALIASES_VIDEO_DIRETO.includes(command);

        await reagir('🔎');

        let url, videoId, title, duration, uploader;
        try {
            ({ url, videoId } = await resolverUrl(entrada));
            ({ title, duration, uploader } = await getInfo(url));
        } catch (err) {
            await reagir('❌');
            return reply(`❌ Não encontrei esse vídeo. Verifique o link ou o nome!\n\n(${err.message})`);
        }

        const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

        // Modo direto: alias já diz o formato (mp3/mp4), não precisa perguntar
        if (forcarAudio || forcarVideo) {
            const legendaDireta =
                `🎵 *${title}*\n` +
                `👤 ${uploader}\n` +
                `⏱️ ${duration}\n\n` +
                `⬇️ Baixando ${forcarVideo ? 'vídeo 🎬' : 'áudio 🎵'}...`;

            try {
                if (thumbUrl) await columbina.sendMessage(from, { image: { url: thumbUrl }, caption: legendaDireta }, { quoted: info });
                else await reply(legendaDireta);
            } catch (_) {
                await reply(legendaDireta);
            }

            try {
                if (forcarAudio) {
                    const outputPath = await baixarAudio(url, getRandom);
                    try {
                        await columbina.sendMessage(from, { audio: fs.readFileSync(outputPath), mimetype: 'audio/mpeg', ptt: false }, { quoted: info });
                        await reagir('✅');
                    } finally {
                        limpar(outputPath);
                    }
                } else {
                    const { rawOutput, fixedOutput, arquivoFinal } = await baixarVideo(url, getRandom);
                    try {
                        await columbina.sendMessage(from, { video: fs.readFileSync(arquivoFinal), caption: '🌸 Aqui está seu vídeo do YouTube!' }, { quoted: info });
                        await reagir('✅');
                    } finally {
                        limpar(rawOutput, fixedOutput);
                    }
                }
            } catch (err) {
                await reagir('❌');
                reply(`❌ Ocorreu um erro ao baixar.\n\n(${err.message})`);
            }
            return;
        }

        // Modo interativo: pergunta 1 (áudio) ou 2 (vídeo)
        const legenda =
            `🎵 *${title}*\n` +
            `👤 ${uploader}\n` +
            `⏱️ ${duration}\n\n` +
            `Responda com:\n*1* — 🎵 Áudio (MP3)\n*2* — 🎬 Vídeo (MP4)`;

        try {
            if (thumbUrl) await columbina.sendMessage(from, { image: { url: thumbUrl }, caption: legenda }, { quoted: info });
            else await reply(legenda);
        } catch (_) {
            await reply(legenda);
        }

        const antiga = playSessions.get(from);
        if (antiga) clearTimeout(antiga.timeout);

        const timeout = setTimeout(() => {
            playSessions.delete(from);
        }, 120000);

        playSessions.set(from, { url, videoId, title, timeout });
    }
};
