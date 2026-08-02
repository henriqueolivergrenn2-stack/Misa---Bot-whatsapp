import MenuSystem from '../../arquivos/js/menuSystem.js';

export default {
    name: 'mostrarcomando',
    description: 'Faz um comando escondido voltar a aparecer no menu',
    category: 'dono',
    aliases: ['restaurarcomando'],
    async execute({ args, prefix, reply, reagir, commandManager }) {
        const categoria = (args[0] || '').toLowerCase();
        const nomeComando = (args[1] || '').toLowerCase();

        if (!categoria || !nomeComando) {
            await reagir('❌');
            return reply(
                `❌ *Uso correto:*\n\n${prefix}mostrarcomando <categoria> <comando>\n\n` +
                `📌 Exemplo:\n${prefix}mostrarcomando rpg cassino`
            );
        }

        const menuSystem = new MenuSystem(commandManager);
        const ok = menuSystem.restaurarComando(categoria, nomeComando);

        if (!ok) {
            await reagir('⚠️');
            return reply(`⚠️ O comando *${nomeComando}* não estava escondido na categoria *${categoria}*.`);
        }

        await reagir('✅');
        return reply(`✅ Comando *${prefix}${nomeComando}* voltou a aparecer no menu *${categoria}*.`);
    }
};
