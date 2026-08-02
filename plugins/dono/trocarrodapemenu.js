import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMINHO_CONFIG = path.join(__dirname, '../../database/config.json');

export default {
    name: 'trocarrodapemenu',
    description: 'Troca a fraseszinha que aparece embaixo do nome do bot nos menus',
    category: 'dono',
    aliases: ['setrodape', 'fraseemenu'],
    async execute({ q, prefix, reply, reagir }) {
        const novoTexto = (q || '').trim();

        if (!novoTexto) {
            const configAtual = JSON.parse(fs.readFileSync(CAMINHO_CONFIG));
            await reagir('❌');
            return reply(
                `❌ Digite a frase nova!\n\n` +
                `📌 Atual: *${configAtual.RodapeMenu || '(nenhuma)'}*\n\n` +
                `Ex: ${prefix}trocarrodapemenu 🌸 Bot da galera 🌸`
            );
        }
        if (novoTexto.length > 50) {
            await reagir('❌');
            return reply('❌ Texto muito longo! Máximo de 50 caracteres.');
        }

        try {
            const config = JSON.parse(fs.readFileSync(CAMINHO_CONFIG));
            config.RodapeMenu = novoTexto;
            fs.writeFileSync(CAMINHO_CONFIG, JSON.stringify(config, null, 2));

            await reagir('✅');
            return reply(`✅ Frase do menu alterada pra:\n*${novoTexto}*\n\nJá aparece nos menus a partir de agora.`);
        } catch (err) {
            await reagir('❌');
            return reply(`❌ Erro ao trocar a frase.\n\n(${err.message})`);
        }
    }
};
