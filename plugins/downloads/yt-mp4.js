/**
 * Comando: yt-mp4
 * Baixa vídeo do YouTube pelo link ou pelo nome do vídeo.
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

    const { stdout } = await execAsync(
        `yt-dlp "ytsearch1:${input.replace(/"/g, '')}" --get-id --no-playlist`,
        { timeout: 30000 }
    );

    const videoId = stdout.trim();
    if (!videoId) throw new Error('Nenhum vídeo encontrado para essa busca!');

    return `https://www.youtube.com/watch?v=${videoId}`;
}

export default {
    name: 'yt-mp4',
    description: 'Baixa vídeo do YouTube pelo link ou pelo nome do vídeo',
    category: 'downloads',
    aliases: ['youtube-mp4', 'yt-video', 'youtube-video', 'ytmp4'],

    async execute({ q, columbina, from, info, reply, reagir, prefix, getRandom }) {
        const entrada = (q || '').trim();

        if (!entrada) {
            await reagir('❌');
            return reply(`❌ Você precisa enviar uma URL ou o nome do vídeo!\n\nEx: ${prefix}yt-mp4 Nome do vídeo\nEx: ${prefix}yt-mp4 https://www.youtube.com/watch?v=mW8o_WDL91o`);
        }

        await reagir('⏳');

        const rawOutput = getRandom('.mp4');
        const fixedOutput = rawOutput.replace(/\.mp4$/, '_fixed.mp4');

        try {
            const url = await resolverUrl(entrada);

            // Baixa em mp4 puro, sem merge de formatos diferentes.
            // Isso evita que o ffmpeg precise re-encodar no Termux.
            await execAsync(
                `yt-dlp -f "best[ext=mp4][height<=480]/best[ext=mp4]/best" --no-playlist -o "${rawOutput}" "${url}"`,
                { timeout: 180000 }
            );

            if (!fs.existsSync(rawOutput)) {
                await reagir('❌');
                return reply('❌ Não foi possível baixar o vídeo. Tente novamente!');
            }

            // -c copy não re-encoda, apenas move o moov atom pro início.
            // Isso corrige o "arquivo corrompido" no WhatsApp sem precisar de libx264.
            let arquivoFinal = rawOutput;
            try {
                await execAsync(
                    `ffmpeg -i "${rawOutput}" -c copy -movflags +faststart -y "${fixedOutput}"`,
                    { timeout: 120000 }
                );
                if (fs.existsSync(fixedOutput)) arquivoFinal = fixedOutput;
            } catch (_) {
                // segue com o arquivo original
            }

            await columbina.sendMessage(from, {
                video: fs.readFileSync(arquivoFinal),
                caption: '🌸 Aqui está seu vídeo do YouTube!'
            }, { quoted: info });

            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(
                err.message.includes('Nenhum')
                    ? `❌ ${err.message}`
                    : `❌ Ocorreu um erro ao baixar o vídeo. Verifique o link ou o nome e tente novamente!\n\n(${err.message})`
            );
        } finally {
            limpar(rawOutput, fixedOutput);
        }
    }
};
