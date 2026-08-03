import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RedLog } from '../../arquivos/js/logger.js';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PASTA_TEMP = path.join(__dirname, '../../temp');

function extrairAudio(info) {
    const quotedMsg = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    return quotedMsg?.audioMessage || info.message?.audioMessage || null;
}

export default {
    name: 'esquilo',
    description: 'Deixa o áudio com voz de esquilo',
    category: 'efeitos',
    aliases: [],
    async execute({ columbina, from, info, prefix, reply, reagir, getFileBuffer }) {
        const audioMsg = extrairAudio(info);

        if (!audioMsg) {
            await reagir('❌');
            return reply(`❌ Marque um áudio ou envie junto com o comando!\n\nEx: responda um áudio com ${prefix}esquilo`);
        }

        await reagir('🐿️');

        if (!fs.existsSync(PASTA_TEMP)) fs.mkdirSync(PASTA_TEMP, { recursive: true });
        const nomeArq = `esquilo_${Date.now()}`;
        const entrada = path.join(PASTA_TEMP, `${nomeArq}.ogg`);
        const saida = path.join(PASTA_TEMP, `${nomeArq}_out.ogg`);

        try {
            const buffer = await getFileBuffer(audioMsg, 'audio');
            fs.writeFileSync(entrada, buffer);

            await execPromise(
                `ffmpeg -i "${entrada}" -filter:a "atempo=0.7,asetrate=65100" -c:a libopus -b:a 64k -vn -f ogg -y "${saida}"`,
                { timeout: 60000 }
            );
            if (!fs.existsSync(saida)) throw new Error('Áudio não gerado.');

            await columbina.sendMessage(from, {
                audio: fs.readFileSync(saida),
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            }, { quoted: info });

            await reagir('✅');
        } catch (err) {
            RedLog(`[Esquilo] Erro ao processar o áudio: ${err.message}\n${err.stack}`);
            await reagir('❌');
            reply(`❌ Erro ao processar o áudio.`);
        } finally {
            [entrada, saida].forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {} });
        }
    }
};
