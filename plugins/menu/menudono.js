import fs from 'fs';
import path from 'path';
import MenuSystem from '../../arquivos/js/menuSystem.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'menudono',
    description: 'Mostra todos os comandos do dono',
    category: 'menu',
    aliases: ['dono', 'ownermenu', 'donomenu'],
    async execute({ columbina, from, info, prefix, reply, reagir, commandManager, isDono }) {
        if (!isDono) return reply('❌ Apenas o dono pode usar este comando!');

        await reagir('👑');

        const menuSystem = new MenuSystem(commandManager);
        /* PUXA TODOS OS COMANDOS DA PASTA plugins/dono/ */
        const comandos = menuSystem.getCommandsByFolder('dono');

        const menuTexto = menuSystem.gerarMenuCustom(comandos, prefix, 'MENU DONO', '👑');

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