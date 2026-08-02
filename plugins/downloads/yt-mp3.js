/**
 * Comando: yt-mp3
 * Baixa áudio do YouTube pelo link ou pelo nome da música/vídeo.
 * Requer yt-dlp e ffmpeg instalados (pip install -U yt-dlp / pkg install ffmpeg).
 */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs';

const execAsync = promisify(exec);

function limpar(...arquivos) {
    for (const f of arquivos) {
        try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {}
    }
}

async function resolverUrl(input) {
    const ehUrl =
        input.includes('youtube.com') ||
        input.includes('youtu.be');

    if (ehUrl) return input.trim();

    // Busca pelo termo e pega o primeiro resultado
    const { stdout } = await execAsync(
        `yt-dlp "ytsearch1:${input.replace(/"/g, '')}" --get-id --no-playlist`,
        { timeout: 30000 }
    );

    const videoId = stdout.trim();
    if (!videoId) throw new Error('Nenhum vídeo encontrado para essa busca!');

    return `https://www.youtube.com/watch?v=${videoId}`;
}

export default {
    name: 'yt-mp3',
    description: 'Baixa áudio do YouTube pelo link ou pelo nome da música',
    category: 'downloads',
    aliases: ['youtube-mp3', 'yt-audio', 'youtube-audio', 'ytmp3'],

    async execute({ q, columbina, from, info, reply, reagir, prefix, getRandom }) {
        const entrada = (q || '').trim();

        if (!entrada) {
            await reagir('❌');
            return reply(`❌ Você precisa enviar uma URL ou o nome da música/vídeo!\n\nEx: ${prefix}yt-mp3 Nome da música\nEx: ${prefix}yt-mp3 https://www.youtube.com/watch?v=mW8o_WDL91o`);
        }

        await reagir('⏳');

        const outputPath = getRandom('.mp3');

        try {
            const url = await resolverUrl(entrada);

            await execAsync(
                `yt-dlp -x --audio-format mp3 --audio-quality 0 --no-playlist -o "${outputPath}" "${url}"`,
                { timeout: 120000 }
            );

            if (!fs.existsSync(outputPath)) {
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
            reply(
                err.message.includes('Nenhum')
                    ? `❌ ${err.message}`
                    : `❌ Ocorreu um erro ao baixar o áudio. Verifique o link ou o nome e tente novamente!\n\n(${err.message})`
            );
        } finally {
            limpar(outputPath);
        }
    }
};
