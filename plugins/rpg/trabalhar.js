import { getUsuario, atualizarUsuario, formatarMoeda, formatarTempo, randomEntre, TRABALHOS, getOuCriarUsuario} from '../../arquivos/js/rpgCore.js';

const COOLDOWN_TRABALHO = 30 * 60 * 1000; // 30 min

export default {
    name: 'trabalhar',
    description: 'Trabalha e ganha um dinheiro aleatório (cooldown de 30min)',
    category: 'rpg',
    aliases: ['trampo', 'trabalho'],
    async execute({ sender, prefix, reply, reagir, pushname}) {
        const usuario = getOuCriarUsuario(sender, pushname);

        const agora = Date.now();
        const passou = agora - (usuario.ultimoTrabalho || 0);
        if (passou < COOLDOWN_TRABALHO) {
            await reagir('⏳');
            return reply(`⏳ Você já trabalhou recentemente! Volte em *${formatarTempo(COOLDOWN_TRABALHO - passou)}*.`);
        }

        const job = TRABALHOS[randomEntre(0, TRABALHOS.length - 1)];
        const ganho = randomEntre(job.min, job.max);

        atualizarUsuario(sender, {
            carteira: usuario.carteira + ganho,
            ultimoTrabalho: agora,
            trabalhos: (usuario.trabalhos || 0) + 1
        });

        await reagir('💼');
        return reply(`💼 ${job.texto} e ganhou *${formatarMoeda(ganho)}*!\n\n💵 Carteira: ${formatarMoeda(usuario.carteira + ganho)}`);
    }
};
