import { getUsuario, atualizarUsuario, formatarMoeda, randomEntre, getOuCriarUsuario} from '../../arquivos/js/rpgCore.js';

const VERMELHOS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export default {
    name: 'roleta',
    description: 'Aposta na roleta: vermelho, preto, verde, par, ímpar ou um número exato',
    category: 'rpg',
    aliases: ['roulette'],
    async execute({ sender, args, prefix, reply, reagir, pushname}) {
        const usuario = getOuCriarUsuario(sender, pushname);

        const tipo = (args[0] || '').toLowerCase();
        let numeroEscolhido, aposta;

        if (tipo === 'numero') {
            numeroEscolhido = parseInt(args[1], 10);
            aposta = parseInt(args[2], 10);
            if (isNaN(numeroEscolhido) || numeroEscolhido < 0 || numeroEscolhido > 36) {
                await reagir('❌');
                return reply('❌ O número precisa estar entre 0 e 36!');
            }
        } else {
            aposta = parseInt(args[1], 10);
        }

        if (!['vermelho', 'preto', 'verde', 'par', 'impar', 'numero'].includes(tipo)) {
            await reagir('❌');
            return reply(
                `🎡 *ROLETA*\n\n` +
                `Tipos válidos: *vermelho, preto, verde, par, impar, numero*\n\n` +
                `📌 *Exemplos:*\n` +
                `${prefix}roleta vermelho 100\n` +
                `${prefix}roleta par 100\n` +
                `${prefix}roleta numero 7 100`
            );
        }
        if (!aposta || isNaN(aposta) || aposta < 10) {
            await reagir('❌');
            return reply(`❌ Aposta mínima de *${formatarMoeda(10)}*!`);
        }
        if (aposta > usuario.carteira) {
            await reagir('❌');
            return reply('❌ Você não tem esse valor na carteira!');
        }

        const numero = randomEntre(0, 36);
        const vermelho = VERMELHOS.includes(numero);
        const cor = numero === 0 ? '🟢 Verde' : vermelho ? '🔴 Vermelho' : '⚫ Preto';

        let ganhou = false, mult = 1;
        switch (tipo) {
            case 'vermelho': ganhou = vermelho && numero !== 0; mult = 2; break;
            case 'preto': ganhou = !vermelho && numero !== 0; mult = 2; break;
            case 'verde': ganhou = numero === 0; mult = 14; break;
            case 'par': ganhou = numero !== 0 && numero % 2 === 0; mult = 2; break;
            case 'impar': ganhou = numero % 2 !== 0; mult = 2; break;
            case 'numero': ganhou = numero === numeroEscolhido; mult = 35; break;
        }

        if (ganhou) {
            const premio = aposta * mult;
            atualizarUsuario(sender, { carteira: usuario.carteira + premio });
            await reagir('🎉');
            return reply(`🎡 *ROLETA — NÚMERO ${numero} (${cor})*\n\n✅ *GANHOU!* ✖️${mult}x\n+*${formatarMoeda(premio)}*`);
        }

        atualizarUsuario(sender, { carteira: usuario.carteira - aposta });
        await reagir('💸');
        return reply(`🎡 *ROLETA — NÚMERO ${numero} (${cor})*\n\n❌ *PERDEU!*\n-*${formatarMoeda(aposta)}*`);
    }
};
