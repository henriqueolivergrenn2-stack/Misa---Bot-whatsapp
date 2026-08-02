import { listarFrasesAtivas } from '../../arquivos/js/frasesCore.js';

export default {
    name: 'listafrases',
    description: 'Mostra as frases/palavras registradas por outros grupos nas últimas 24h',
    category: 'cmds-aleatorios',
    aliases: ['verfrases', 'frases'],
    async execute({ reply, reagir }) {
        const lista = listarFrasesAtivas();

        if (!lista.length) {
            await reagir('📭');
            return reply('📭 Nenhuma frase registrada nas últimas 24h ainda.\n\nSeja o primeiro com *.registrarfrase*!');
        }

        let texto = `📋 *FRASES REGISTRADAS (últimas 24h)*\n\n`;
        lista.forEach((f, i) => {
            texto += `${i + 1}. 💬 "${f.frase}"\n`;
            texto += `   📍 ${f.grupoNome}\n`;
            texto += `   👤 ${f.nickname} (${f.numero})\n`;
            texto += `   🕒 ${f.dataFormatada}\n\n`;
        });

        return reply(texto.trim());
    }
};
