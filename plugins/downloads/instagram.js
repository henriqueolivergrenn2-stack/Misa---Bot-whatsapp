/**
 * Comando: instagram / ig / inst / insta
 * Baixa vídeos/reels do Instagram usando yt-dlp.
 * Instale/atualize com: pip install -U yt-dlp  (ou: pkg install yt-dlp)
 *
 * OBS: posts privados ou com restrição de idade exigem cookies de uma conta
 * logada. Se for o caso, gere um cookies.txt e passe com --cookies no array
 * de argumentos abaixo.
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
    name: 'instagram',
    description: 'Baixa vídeos/reels do Instagram pelo link',
    category: 'downloads',
    aliases: ['ig', 'inst', 'insta'],

    async execute({ q, columbina, from, info, reply, reagir, prefix, getRandom }) {
        const url = (q || '').trim();

        if (!url) {
            await reagir('❌');
            return reply(`❌ Você precisa enviar uma URL do Instagram!\n\nEx: ${prefix}instagram https://www.instagram.com/reel/Cx789012345/`);
        }

        if (!url.includes('instagram.com')) {
            await reagir('❌');
            return reply('❌ O link não é do Instagram!');
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
                caption: '🌸 Aqui está seu vídeo do Instagram!'
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
