import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMINHO_CONFIG = path.join(__dirname, '../../database/config.json');

export default {
    name: 'setnomebot',
    description: 'Troca o nome do bot exibido no menu',
    category: 'dono',
    aliases: ['setnomebot', 'nomedobot'],
    async execute({ q, prefix, reply, reagir }) {
        const novoNome = (q || '').trim();

        if (!novoNome) {
            const configAtual = JSON.parse(fs.readFileSync(CAMINHO_CONFIG));
            await reagir('❌');
            return reply(
                `❌ Digite o novo nome!\n\n` +
                `📌 Nome atual: *${configAtual.NomeDoBot}*\n\n` +
                `Ex: ${prefix}trocarnomebot Misaki Bot`
            );
        }
        if (novoNome.length > 40) {
            await reagir('❌');
            return reply('❌ Nome muito longo! Máximo de 40 caracteres.');
        }

        try {
            const config = JSON.parse(fs.readFileSync(CAMINHO_CONFIG));
            config.NomeDoBot = novoNome;
            fs.writeFileSync(CAMINHO_CONFIG, JSON.stringify(config, null, 2));

            await reagir('✅');
            return reply(`✅ Nome do bot alterado pra *${novoNome}*!\n\nJá aparece no *.menu* a partir de agora.`);
        } catch (err) {
            await reagir('❌');
            return reply(`❌ Erro ao trocar o nome.\n\n(${err.message})`);
        }
    }
};
