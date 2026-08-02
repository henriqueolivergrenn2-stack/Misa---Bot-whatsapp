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
    name: 'sugestoes',
    description: 'Lista, mostra ou remove as sugestões enviadas pelos usuários',
    category: 'dono',
    aliases: ['versugestoes', 'listasugestoes'],
    async execute({ args, prefix, reply, reagir }) {

        const lista = carregarSugestoes();
        const subComando = (args[0] || '').toLowerCase();

        // .sugestoes  ou  .sugestoes listar
        if (!subComando || subComando === 'listar') {
            if (lista.length === 0) {
                await reagir('📭');
                return reply('📭 Nenhuma sugestão registrada ainda.');
            }

            let texto = `📋 *SUGESTÕES RECEBIDAS* (${lista.length})\n\n`;
            for (const s of lista) {
                const preview = s.texto.length > 60 ? s.texto.slice(0, 60) + '...' : s.texto;
                texto += `#${s.id} — ${preview}\n`;
            }
            texto += `\n💡 Use ${prefix}sugestoes ver <id> para o texto completo\n💡 Use ${prefix}sugestoes del <id> para apagar`;

            await reagir('📋');
            return reply(texto);
        }

        // .sugestoes ver <id>
        if (subComando === 'ver') {
            const id = parseInt(args[1]);
            const s = lista.find(item => item.id === id);

            if (!s) {
                await reagir('❌');
                return reply(`❌ Sugestão #${id || '?'} não encontrada.`);
            }

            await reagir('🔎');
            return reply(
                `📌 *Sugestão #${s.id}*\n\n` +
                `👤 De: ${s.autorNome} (@${s.autor.split('@')[0]})\n` +
                `📍 Origem: ${s.origem}\n` +
                `🕒 Data: ${s.data}\n\n` +
                `💬 ${s.texto}`
            );
        }

        // .sugestoes del <id>
        if (subComando === 'del' || subComando === 'remover' || subComando === 'apagar') {
            const id = parseInt(args[1]);
            const index = lista.findIndex(item => item.id === id);

            if (index === -1) {
                await reagir('❌');
                return reply(`❌ Sugestão #${id || '?'} não encontrada.`);
            }

            lista.splice(index, 1);
            salvarSugestoes(lista);

            await reagir('🗑️');
            return reply(`🗑️ Sugestão #${id} removida.`);
        }

        return reply(
            `❌ Comando inválido.\n\n` +
            `▸ ${prefix}sugestoes — lista todas\n` +
            `▸ ${prefix}sugestoes ver <id> — mostra o texto completo\n` +
            `▸ ${prefix}sugestoes del <id> — remove uma sugestão`
        );
    }
};
