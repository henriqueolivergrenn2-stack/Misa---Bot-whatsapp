import fs from 'fs';
import path from 'path';
import MenuSystem from '../../arquivos/js/menuSystem.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'menupremium',
    description: 'Mostra todos os comandos premium',
    category: 'menu',
    aliases: ['premium', 'vipmenu', 'vip'],
    async execute({ columbina, from, info, prefix, reply, reagir, commandManager, isDono, sender }) {
        const isPremiumUser = commandManager.isPremium(sender, '');
        if (!isPremiumUser && !isDono) return reply('❌ Este menu é apenas para usuários premium!');

        await reagir('💎');

        const menuSystem = new MenuSystem(commandManager);
        /* PUXA TODOS OS COMANDOS DA PASTA plugins/premium/ */
        const comandos = menuSystem.getCommandsByFolder('premium');

        const menuTexto = menuSystem.gerarMenuCustom(comandos, prefix, 'MENU PREMIUM', '💎');

        const imageUrl = path.join(__dirname, '../../arquivos/imagem/menu.jpg');

        try {
            await columbina.sendMessage(from, {
                image: fs.readFileSync(imageUrl),
                caption: menuTexto
            }, { quoted: info });
        } catch (err) {
            console.error(err);
            reply('❌ Erro ao carregar a imagem do menu. Verifique se o arquivo existe em: ' + imageUrl);
        }
    }
};