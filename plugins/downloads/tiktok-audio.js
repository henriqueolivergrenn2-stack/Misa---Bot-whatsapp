/**
 * Comando: tik-tok-audio / tik-tok-mp3 / tik-audio / tik-mp3 / ttk-audio / ttk-mp3
 * Baixa o áudio de vídeos do TikTok usando yt-dlp.
 * Instale/atualize com: pip install -U yt-dlp  (ou: pkg install yt-dlp)
 * Requer ffmpeg instalado para converter para mp3.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs';

const execFileAsync = promisify(execFile);
const MAX_BUFFER = 1024 * 1024 * 20; // 20MB

function limpar(...arquivos) {
    for (const f of arquivos) {
        try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {}
    }
}

function isTikTokUrl(input) {
    return (
        input.includes('tiktok.com') ||
        input.includes('vm.tiktok') ||
        input.includes('vt.tiktok')
    );
}

export default {
    name: 'tik-tok-audio',
    description: 'Baixa o áudio de vídeos do TikTok pelo link',
    category: 'downloads',
    aliases: ['tik-tok-mp3', 'tik-audio', 'tik-mp3', 'ttk-audio', 'ttk-mp3'],

    async execute({ q, columbina, from, info, reply, reagir, prefix, getRandom }) {
        const url = (q || '').trim();

        if (!url) {
            await reagir('❌');
            return reply(`❌ Você precisa enviar uma URL do TikTok!\n\nEx: ${prefix}tik-tok-audio https://www.tiktok.com/@user/video/123`);
        }

        if (!isTikTokUrl(url)) {
            await reagir('❌');
            return reply('❌ Envie um link válido do TikTok (não é possível buscar por termo).');
        }

        await reagir('⏳');

        const outputPath = getRandom('.mp3');

        try {
            await execFileAsync(
                'yt-dlp',
                [
                    '-x',
                    '--audio-format', 'mp3',
                    '--audio-quality', '0',
                    '--no-playlist',
                    '--no-warnings',
                    '--retries', '3',
                    '--socket-timeout', '30',
                    '-o', outputPath,
                    url
                ],
                { timeout: 120000, maxBuffer: MAX_BUFFER }
            );

            if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
                await reagir('❌');
                return reply('❌ Não foi possível baixar o áudio. Tente novamente!');
            }

            await columbina.sendMessage(from, {
                audio: fs.readFileSync(outputPath),
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: info });

            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Ocorreu um erro ao baixar o áudio. Verifique o link!\n\nSe o link estiver certo e continuar falhando, o TikTok pode ter mudado algo no site — tente atualizar o yt-dlp (pip install -U yt-dlp).\n\n(${err.message})`);
        } finally {
            limpar(outputPath);
        }
    }
};
