import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMINHO_IMAGEM_MENU = path.join(__dirname, '../../arquivos/imagem/menu.jpg');

function extrairImagem(info) {
    const quotedMsg = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    return quotedMsg?.imageMessage || info.message?.imageMessage || null;
}

export default {
    name: 'setfotomenu',
    description: 'Troca a imagem usada nos menus do bot',
    category: 'dono',
    aliases: ['setmenuimg', 'fotodomenu', 'setfotomenu'],
    async execute({ info, prefix, reply, reagir, getFileBuffer }) {
        const imagemMsg = extrairImagem(info);

        if (!imagemMsg) {
            await reagir('❌');
            return reply(`❌ Marque ou responda uma imagem junto com o comando!\n\nEx: responda uma foto com *${prefix}trocarfotomenu*`);
        }

        try {
            const buffer = await getFileBuffer(imagemMsg, 'image');

            const pasta = path.dirname(CAMINHO_IMAGEM_MENU);
            if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });

            // Apaga a foto antiga primeiro, pra não dar conflito de escrita
            if (fs.existsSync(CAMINHO_IMAGEM_MENU)) {
                fs.unlinkSync(CAMINHO_IMAGEM_MENU);
            }

            fs.writeFileSync(CAMINHO_IMAGEM_MENU, buffer);

            // Confere se realmente gravou
            if (!fs.existsSync(CAMINHO_IMAGEM_MENU) || fs.statSync(CAMINHO_IMAGEM_MENU).size === 0) {
                throw new Error('O arquivo não foi salvo corretamente.');
            }

            await reagir('✅');
            return reply(`✅ Foto do menu atualizada! (${(buffer.length / 1024).toFixed(0)} KB salvos)\n\nEla já vai aparecer nos próximos menus (.menu, .menurpg, etc).`);
        } catch (err) {
            await reagir('❌');
            return reply(`❌ Erro ao trocar a foto do menu.\n\n(${err.message})`);
        }
    }
};
