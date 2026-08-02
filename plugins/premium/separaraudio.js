import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PASTA_TEMP = path.join(__dirname, '../../temp');

function extrairVideo(info) {
    const quoted = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const doQuoted = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessage?.message || quoted;
    const direto = info.message?.viewOnceMessageV2?.message || info.message?.viewOnceMessage?.message || info.message;

    return doQuoted?.videoMessage || direto?.videoMessage || null;
}

export default {
    name: 'separaraudio',
    description: 'Separa o áudio e o vídeo de um vídeo e manda os dois separados',
    category: 'cmds-aleatorios',
    aliases: ['separarvideo', 'extrairaudio', 'tirarsom'],
    async execute({ columbina, from, info, prefix, reply, reagir, getFileBuffer }) {
        const videoMsg = extrairVideo(info);

        if (!videoMsg) {
            await reagir('❌');
            return reply(`❌ Envie ou responda um vídeo com este comando!\n\nEx: responda um vídeo com ${prefix}separaraudio`);
        }

        await reagir('⏳');
        await reply('⏳ Separando o áudio e o vídeo, aguarde um instante...');

        if (!fs.existsSync(PASTA_TEMP)) fs.mkdirSync(PASTA_TEMP, { recursive: true });
        const nome = `sep_${Date.now()}`;
        const entrada = path.join(PASTA_TEMP, `${nome}.mp4`);
        const saidaAudio = path.join(PASTA_TEMP, `${nome}.mp3`);
        const saidaVideo = path.join(PASTA_TEMP, `${nome}_mudo.mp4`);

        try {
            const buffer = await getFileBuffer(videoMsg, 'video');
            fs.writeFileSync(entrada, buffer);

            await Promise.all([
                execPromise(`ffmpeg -y -i "${entrada}" -vn -acodec libmp3lame -ab 192k "${saidaAudio}"`, { timeout: 120000 }),
                execPromise(`ffmpeg -y -i "${entrada}" -an -vcodec copy "${saidaVideo}"`, { timeout: 120000 })
            ]);

            if (!fs.existsSync(saidaAudio) || !fs.existsSync(saidaVideo)) {
                throw new Error('Não consegui gerar os arquivos separados.');
            }

            await columbina.sendMessage(from, {
                audio: fs.readFileSync(saidaAudio),
                mimetype: 'audio/mpeg'
            }, { quoted: info });

            await columbina.sendMessage(from, {
                video: fs.readFileSync(saidaVideo),
                caption: '🎬 Vídeo *sem áudio*!'
            }, { quoted: info });

            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Erro ao separar o vídeo.\n\n(${err.message})\n\n💡 Confira se o ffmpeg está instalado no Termux:\n*pkg install ffmpeg*`);
        } finally {
            [entrada, saidaAudio, saidaVideo].forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {} });
        }
    }
};
