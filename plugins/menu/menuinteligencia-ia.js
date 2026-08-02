import fs from 'fs';
import path from 'path';
import MenuSystem from '../../arquivos/js/menuSystem.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'menuia',
    description: 'Mostra todos os comandos de inteligência artificial',
    category: 'menu',
    aliases: ['aimenu', 'inteligenciamenu', 'ia'],
    async execute({ columbina, from, info, prefix, reply, reagir, commandManager }) {
        await reagir('🤖');

        const menuSystem = new MenuSystem(commandManager);
        /* PUXA TODOS OS COMANDOS DA PASTA plugins/inteligencia-ia/ */
        const comandos = menuSystem.getCommandsByFolder('inteligencia-ia');

        const menuTexto = menuSystem.gerarMenuCustom(comandos, prefix, 'INTELIGÊNCIA IA', '🤖');

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