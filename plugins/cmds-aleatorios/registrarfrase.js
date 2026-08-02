import { registrarFrase } from '../../arquivos/js/frasesCore.js';

export default {
    name: 'registrarfrase',
    description: 'Registra uma frase/palavra pra outros grupos verem (fica disponível por 1 dia)',
    category: 'cmds-aleatorios',
    aliases: ['addfrase', 'novafrase'],
    async execute({ sender, q, prefix, groupName, isGroup, pushname, reply, reagir }) {
        const frase = (q || '').trim();

        if (!frase) {
            await reagir('❌');
            return reply(`❌ Escreva a frase ou palavra!\n\nEx: ${prefix}registrarfrase Hoje o dia tá lindo`);
        }
        if (frase.length > 300) {
            await reagir('❌');
            return reply('❌ Frase muito longa! Máximo de 300 caracteres.');
        }

        const numero = sender.split('@')[0];
        const grupoNome = isGroup ? (groupName || 'Grupo sem nome') : 'Privado (PV)';

        registrarFrase({ grupoNome, frase, numero, nickname: pushname });

        await reagir('✅');
        return reply(`✅ Frase registrada!\n\n💬 "${frase}"\n📍 ${grupoNome}\n\n_Fica visível pra outros grupos por 24 horas via *${prefix}listafrases*_`);
    }
};
