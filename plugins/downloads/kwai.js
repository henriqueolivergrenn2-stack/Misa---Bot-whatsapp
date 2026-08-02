/**
 * Comando: kwai
 * Baixa vídeos do Kwai (sem marca d'água) usando yt-dlp.
 * Instale/atualize com: pip install -U yt-dlp  (ou: pkg install yt-dlp)
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs';

const execFileAsync = promisify(execFile);
const MAX_BUFFER = 1024 * 1024 * 20; // 20MB

// Alguns ambientes (ex.: Termux rodando como serviço/boot) iniciam o
// processo Node com um PATH reduzido, sem as pastas onde o yt-dlp/ffmpeg
// foram instalados (pkg install ou pip install --user). Isso causa o erro
// "spawn yt-dlp ENOENT" mesmo com o binário instalado. Aqui garantimos que
// os caminhos mais comuns estejam sempre disponíveis para o processo filho.
const EXTRA_BIN_DIRS = [
    process.env.PREFIX ? `${process.env.PREFIX}/bin` : null,
    '/data/data/com.termux/files/usr/bin',
    process.env.HOME ? `${process.env.HOME}/.local/bin` : null,
    '/usr/local/bin',
    '/usr/bin'
].filter(Boolean);

const execEnv = {
    ...process.env,
    PATH: [process.env.PATH || '', ...EXTRA_BIN_DIRS].join(':')
};

function limpar(...arquivos) {
    for (const f of arquivos) {
        try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {}
    }
}

export default {
    name: 'kwai',
    description: "Baixa vídeos do Kwai sem marca d'água",
    category: 'downloads',
    aliases: [],

    async execute({ q, columbina, from, info, reply, reagir, prefix, getRandom }) {
        const url = (q || '').trim();

        if (!url) {
            await reagir('❌');
            return reply(`❌ Você precisa enviar uma URL do Kwai!\n\nEx: ${prefix}kwai https://k.kwai.com/p/XvBCuvbR`);
        }

        if (!url.includes('kwai.com') && !url.includes('kw.ai')) {
            await reagir('❌');
            return reply('❌ O link não é do Kwai!');
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
                { timeout: 120000, maxBuffer: MAX_BUFFER, env: execEnv }
            );

            if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
                await reagir('❌');
                return reply('❌ Não foi possível baixar o vídeo. Tente novamente!');
            }

            await columbina.sendMessage(from, {
                video: fs.readFileSync(outputPath),
                caption: '🌸 Aqui está seu vídeo do Kwai!'
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
