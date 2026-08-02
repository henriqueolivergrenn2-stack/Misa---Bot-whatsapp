/**
 * Comando: tik-tok / ttk / tik
 * Baixa vídeos do TikTok usando yt-dlp.
 * Instale/atualize com: pip install -U yt-dlp  (ou: pkg install yt-dlp)
 *
 * OBS: o TikTok muda a estrutura do site com frequência e isso quebra a
 * extração do yt-dlp de tempos em tempos (erro típico: "Unable to extract
 * webpage video data"). Se parar de funcionar do nada mesmo com link válido,
 * rode `pip install -U yt-dlp` — na maioria das vezes é isso.
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
    name: 'tik-tok',
    description: 'Baixa vídeos do TikTok pelo link',
    category: 'downloads',
    aliases: ['ttk', 'tik', 'tiktok'],

    async execute({ q, columbina, from, info, reply, reagir, prefix, getRandom }) {
        const url = (q || '').trim();

        if (!url) {
            await reagir('❌');
            return reply(`❌ Você precisa enviar uma URL do TikTok!\n\nEx: ${prefix}tik-tok https://www.tiktok.com/@user/video/123`);
        }

        // Busca por termo (ex: "tik nome da musica") nunca funciona de verdade:
        // "tiktoksearch1:" não existe no yt-dlp, então sempre cairia no catch
        // silenciosamente. Por isso avisamos o usuário em vez de tentar.
        if (!isTikTokUrl(url)) {
            await reagir('❌');
            return reply('❌ Envie um link válido do TikTok (não é possível buscar por termo).');
        }

        await reagir('⏳');

        const outputPath = getRandom('.mp4');
        const fixedPath = outputPath.replace(/\.mp4$/, '_fixed.mp4');

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

            // Garante que o vídeo abre corretamente em qualquer dispositivo.
            // Se o remux (cópia direta dos streams) falhar por algum motivo,
            // não desiste: envia o arquivo original em vez de travar tudo.
            let arquivoFinal = outputPath;
            try {
                await execFileAsync(
                    'ffmpeg',
                    ['-i', outputPath, '-c', 'copy', '-movflags', '+faststart', '-y', fixedPath],
                    { timeout: 60000, maxBuffer: MAX_BUFFER }
                );

                if (fs.existsSync(fixedPath) && fs.statSync(fixedPath).size > 0) {
                    arquivoFinal = fixedPath;
                }
            } catch (_) {
                // segue com o arquivo original
            }

            await columbina.sendMessage(from, {
                video: fs.readFileSync(arquivoFinal),
                caption: '🌸 Aqui está seu vídeo do TikTok!'
            }, { quoted: info });

            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Ocorreu um erro ao baixar o vídeo. Verifique o link!\n\nSe o link estiver certo e continuar falhando, o TikTok pode ter mudado algo no site — tente atualizar o yt-dlp (pip install -U yt-dlp).\n\n(${err.message})`);
        } finally {
            limpar(outputPath, fixedPath);
        }
    }
};
