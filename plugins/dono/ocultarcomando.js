import MenuSystem from '../../arquivos/js/menuSystem.js';

export default {
    name: 'ocultarcomando',
    description: 'Esconde um comando específico do menu (sem desativar ele)',
    category: 'dono',
    aliases: ['esconderdomenu'],
    async execute({ args, prefix, reply, reagir, commandManager }) {
        const categoria = (args[0] || '').toLowerCase();
        const nomeComando = (args[1] || '').toLowerCase();

        if (!categoria || !nomeComando) {
            await reagir('❌');
            return reply(
                `❌ *Uso correto:*\n\n${prefix}ocultarcomando <categoria> <comando>\n\n` +
                `📌 Exemplo:\n${prefix}ocultarcomando rpg cassino\n\n` +
                `💡 Categorias: admin, dono, cmds-aleatorios, resenha, downloads, efeitos, midias, inteligencia-ia, rpg, premium, menu`
            );
        }

        const menuSystem = new MenuSystem(commandManager);
        const ok = menuSystem.ocultarComando(categoria, nomeComando);

        if (!ok) {
            await reagir('⚠️');
            return reply(`⚠️ O comando *${nomeComando}* já estava oculto (ou não existe) na categoria *${categoria}*.`);
        }

        await reagir('✅');
        return reply(`✅ Comando *${prefix}${nomeComando}* agora está escondido do menu *${categoria}*.\n\nEle continua funcionando normalmente, só não aparece mais listado.`);
    }
};
