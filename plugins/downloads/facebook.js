/**
 * Comando: facebook / face / fb
 * Baixa vídeos do Facebook usando yt-dlp.
 * Instale/atualize com: pip install -U yt-dlp  (ou: pkg install yt-dlp)
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

export default {
    name: 'facebook',
    description: 'Baixa vídeos do Facebook pelo link',
    category: 'downloads',
    aliases: ['face', 'fb'],

    async execute({ q, columbina, from, info, reply, reagir, prefix, getRandom }) {
        const url = (q || '').trim();

        if (!url) {
            await reagir('❌');
            return reply(`❌ Você precisa enviar uma URL do Facebook!\n\nEx: ${prefix}facebook https://www.facebook.com/reel/123456789012345`);
        }

        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            await reagir('❌');
            return reply('❌ O link não é do Facebook!');
        }

        await reagir('⏳');

        const outputPath = getRandom('.mp4');

        try {
            await execFileAsync(
                'yt-dlp',
                [
                    '-f', 'best[ext=mp4]/best',
                    '--merge-output-format', 'mp4',
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
                return reply('❌ Não foi possível baixar o vídeo. Tente novamente!');
            }

            await columbina.sendMessage(from, {
                video: fs.readFileSync(outputPath),
                caption: '🌸 Aqui está seu vídeo do Facebook!'
            }, { quoted: info });

            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Não foi possível baixar o vídeo.\n\nVerifique se o vídeo é público e tente novamente!\n\n(${err.message})`);
        } finally {
            limpar(outputPath);
        }
    }
};
