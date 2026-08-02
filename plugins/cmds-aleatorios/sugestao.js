import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMINHO_JSON = path.join(__dirname, '../../arquivos/json/sugestoes.json');

function carregarSugestoes() {
    try {
        if (fs.existsSync(CAMINHO_JSON)) {
            const data = JSON.parse(fs.readFileSync(CAMINHO_JSON));
            return Array.isArray(data.sugestoes) ? data.sugestoes : [];
        }
    } catch (e) {}
    return [];
}

function salvarSugestoes(lista) {
    fs.writeFileSync(CAMINHO_JSON, JSON.stringify({ sugestoes: lista }, null, 2));
}

export default {
    name: 'sugestao',
    description: 'Envia uma sugestão para o dono do bot',
    category: 'cmds-aleatorios',
    aliases: ['sugerir', 'sugestoes-enviar'],
    async execute({ q, prefix, sender, pushname, from, isGroup, groupName, reply, reagir }) {

        const texto = (q || '').trim();

        if (texto.length < 5) {
            await reagir('❌');
            return reply(`❌ Escreva sua sugestão.\n\nExemplo: ${prefix}sugestao adicionar comando de figurinhas animadas`);
        }

        const lista = carregarSugestoes();

        const novaSugestao = {
            id: lista.length > 0 ? lista[lista.length - 1].id + 1 : 1,
            texto,
            autor: sender,
            autorNome: pushname || 'Desconhecido',
            origem: isGroup ? (groupName || 'Grupo') : 'PV',
            data: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        };

        lista.push(novaSugestao);
        salvarSugestoes(lista);

        await reagir('✅');
        return reply(`✅ Sugestão #${novaSugestao.id} enviada com sucesso!\n\nObrigado por ajudar a melhorar o bot 🌸`);
    }
};
