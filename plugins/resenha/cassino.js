import { getUsuario, atualizarUsuario, formatarMoeda, getOuCriarUsuario} from '../../arquivos/js/rpgCore.js';

export default {
    name: 'cassino',
    description: 'Aposta dinheiro no cassino (dobra ou perde)',
    category: 'rpg',
    aliases: ['casino'],
    async execute({ sender, args, prefix, reply, reagir, pushname}) {
        const usuario = getOuCriarUsuario(sender, pushname);

        const valor = parseInt(args[0], 10);

        if (!valor || isNaN(valor) || valor < 10) {
            await reagir('❌');
            return reply(`❌ Aposte um valor válido (mínimo R$ 10)!\n\nEx: ${prefix}cassino 100`);
        }
        if (valor > 2000) {
            await reagir('❌');
            return reply('❌ Aposta máxima permitida: *R$ 2.000*.');
        }
        if (valor > usuario.carteira) {
            await reagir('❌');
            return reply('❌ Você não tem esse valor na carteira!');
        }

        const ganhou = Math.random() < 0.45; // casa sempre leva vantagem
        const novoSaldo = ganhou ? usuario.carteira + valor : usuario.carteira - valor;
        atualizarUsuario(sender, { carteira: novoSaldo });

        await reagir(ganhou ? '🎉' : '💸');
        return reply(
            ganhou
                ? `🎰 *VITÓRIA!* Você dobrou a aposta e ganhou *${formatarMoeda(valor)}*!\n\n💵 Carteira: ${formatarMoeda(novoSaldo)}`
                : `🎰 *Você perdeu* ${formatarMoeda(valor)} no cassino... 😢\n\n💵 Carteira: ${formatarMoeda(novoSaldo)}`
        );
    }
};
