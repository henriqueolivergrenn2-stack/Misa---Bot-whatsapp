import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PASTA_TEMP = path.join(__dirname, '../../temp');

function extrairMidiaUnica(info) {
    const quoted = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return null;

    // Cobre tanto mensagem "crua" quanto embrulhada em viewOnce/viewOnceV2
    // (é assim que a maioria das visualizações únicas chega de verdade)
    const conteudo = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message || quoted;

    if (conteudo.imageMessage) return { tipo: 'image', midia: conteudo.imageMessage, ext: 'jpg' };
    if (conteudo.videoMessage) return { tipo: 'video', midia: conteudo.videoMessage, ext: 'mp4' };
    if (conteudo.audioMessage) return { tipo: 'audio', midia: conteudo.audioMessage, ext: 'mp3' };
    return null;
}

export default {
    name: 'revisu',
    description: 'Revela uma mídia de visualização única (foto, vídeo ou áudio)',
    category: 'cmds-aleatorios',
    aliases: ['revelarvis', 'rv2', 'revelarvisu', 'visu'],
    async execute({ columbina, from, info, prefix, reply, reagir, getFileBuffer }) {
        const item = extrairMidiaUnica(info);

        if (!item) {
            await reagir('❌');
            return reply(
                `❌ Responda uma *visualização única* (foto, vídeo ou áudio) com este comando!\n\n` +
                `📌 *Como usar:*\n1️⃣ Responda a mensagem de "visu"\n2️⃣ Mande *${prefix}revisu*`
            );
        }

        await reagir('👀');

        if (!fs.existsSync(PASTA_TEMP)) fs.mkdirSync(PASTA_TEMP, { recursive: true });
        const caminho = path.join(PASTA_TEMP, `revisu_${Date.now()}.${item.ext}`);

        try {
            const buffer = await getFileBuffer(item.midia, item.tipo);
            fs.writeFileSync(caminho, buffer);

            if (item.tipo === 'image') {
                await columbina.sendMessage(from, { image: fs.readFileSync(caminho), caption: '👀 Foto de visualização única revelada!' }, { quoted: info });
            } else if (item.tipo === 'video') {
                await columbina.sendMessage(from, { video: fs.readFileSync(caminho), caption: '👀 Vídeo de visualização única revelado!' }, { quoted: info });
            } else {
                await columbina.sendMessage(from, { audio: fs.readFileSync(caminho), mimetype: 'audio/mpeg', ptt: false }, { quoted: info });
            }

            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Não consegui revelar essa mídia.\n\n(${err.message})\n\nDica: a visualização única precisa ainda estar "disponível" — se já foi aberta ou expirou, não dá mais pra recuperar.`);
        } finally {
            try { if (fs.existsSync(caminho)) fs.unlinkSync(caminho); } catch (_) {}
        }
    }
};
