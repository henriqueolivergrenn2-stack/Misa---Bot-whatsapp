import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extrairImagemDaMensagem } from '../../arquivos/js/imageInput.js';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PASTA_TEMP = path.join(__dirname, '../../temp');

export default {
    name: 'blur',
    description: 'Aplica efeito de embaçado (blur) na imagem',
    category: 'efeitos',
    aliases: ['embaça', 'embaçar'],
    async execute({ columbina, from, info, reply, reagir, getFileBuffer }) {
        const buffer = await extrairImagemDaMensagem(info, getFileBuffer);
        if (!buffer) {
            await reagir('❌');
            return reply('❌ Marque uma imagem ou responda a uma imagem!\n\nEx: responda uma foto com .blur');
        }

        if (!fs.existsSync(PASTA_TEMP)) fs.mkdirSync(PASTA_TEMP, { recursive: true });
        const nome = `blur_${Date.now()}`;
        const entrada = path.join(PASTA_TEMP, `${nome}.jpg`);
        const saida = path.join(PASTA_TEMP, `${nome}_out.jpg`);

        try {
            fs.writeFileSync(entrada, buffer);
            await execPromise(`ffmpeg -y -i "${entrada}" -vf "boxblur=10:1" -frames:v 1 -q:v 2 "${saida}"`, { timeout: 30000 });
            if (!fs.existsSync(saida)) throw new Error('Imagem não gerada.');

            await columbina.sendMessage(from, { image: fs.readFileSync(saida) }, { quoted: info });
            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Erro ao aplicar blur.\n\n(${err.message})`);
        } finally {
            [entrada, saida].forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {} });
        }
    }
};
