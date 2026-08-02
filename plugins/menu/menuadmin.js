import fs from 'fs';
import path from 'path';
import MenuSystem from '../../arquivos/js/menuSystem.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'menuadmin',
    description: 'Mostra todos os comandos de administração',
    category: 'menu',
    aliases: ['adm', 'admmenu', 'menuadm', 'admin'],
    async execute({ columbina, from, info, prefix, reply, reagir, commandManager, isAdm, isDono }) {
        if (!isAdm && !isDono) return reply('❌ Apenas administradores podem usar este comando!');

        await reagir('🛡️');

        const menuSystem = new MenuSystem(commandManager);
        /* PUXA TODOS OS COMANDOS DA PASTA plugins/admin/ */
        const comandos = menuSystem.getCommandsByFolder('admin');

        const menuTexto = menuSystem.gerarMenuCustom(comandos, prefix, 'MENU ADMIN', '🛡️');

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