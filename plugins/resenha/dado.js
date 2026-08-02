import { getUsuario, atualizarUsuario, formatarMoeda, randomEntre } from '../../arquivos/js/rpgCore.js';

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// Anima uma mensagem "rolando" o dado até o valor final, editando a mesma mensagem
async function animarDado(columbina, from, info, textoBase, valorFinal) {
    const sent = await columbina.sendMessage(from, {
        text: `${textoBase}\n\n🎲 Rolando...`
    }, { quoted: info });

    if (!sent?.key) return null;

    const passos = 6;
    for (let i = 0; i < passos; i++) {
        await new Promise((r) => setTimeout(r, 220 + i * 70)); // vai desacelerando
        const faceAleatoria = FACES[randomEntre(0, 5)];
        try {
            await columbina.sendMessage(from, {
                text: `${textoBase}\n\n${faceAleatoria}`,
                edit: sent.key
            });
        } catch (e) {}
    }

    await new Promise((r) => setTimeout(r, 300));
    try {
        await columbina.sendMessage(from, {
            text: `${textoBase}\n\n${FACES[valorFinal - 1]} — *${valorFinal}*`,
            edit: sent.key
        });
    } catch (e) {}

    return sent.key;
}

export default {
    name: 'dado',
    description: 'Joga um dado (com animação!). Sem aposta é só por diversão, com aposta você duela contra o bot',
    category: 'rpg',
    aliases: ['dice', 'd6'],
    async execute({ sender, from, info, columbina, args, prefix, reply, reagir }) {
        const r = randomEntre(1, 6);

        if (!args[0]) {
            await reagir('🎲');
            await animarDado(columbina, from, info, '🎲 *DADO*', r);
            return;
        }

        const usuario = getUsuario(sender);
        if (!usuario) {
            await reagir('❌');
            return reply(`❌ Pra apostar você precisa de conta! Use *${prefix}rg Nome/Idade/Gênero*.\n\n(sem aposta, é só *${prefix}dado*)`);
        }

        const aposta = parseInt(args[0], 10);
        if (!aposta || isNaN(aposta) || aposta < 10) {
            await reagir('❌');
            return reply(`❌ Aposta mínima de *${formatarMoeda(10)}*!\n\nEx: ${prefix}dado 50`);
        }
        if (aposta > usuario.carteira) {
            await reagir('❌');
            return reply('❌ Você não tem esse valor na carteira!');
        }

        const bot = randomEntre(1, 6);

        await reagir('🎲');
        await animarDado(columbina, from, info, '🎲 *SEU DADO*', r);
        await animarDado(columbina, from, info, '🎲 *DADO DO BOT*', bot);

        if (r > bot) {
            atualizarUsuario(sender, { carteira: usuario.carteira + aposta });
            await reagir('🎉');
            return reply(`🎲 *DUELO DE DADOS*\n\nVocê: ${FACES[r - 1]} *${r}* vs Bot: ${FACES[bot - 1]} *${bot}*\n\n✅ Você venceu! *+${formatarMoeda(aposta)}*`);
        }
        if (r === bot) {
            return reply(`🎲 *DUELO DE DADOS — EMPATE*\n\nVocê: ${FACES[r - 1]} *${r}* vs Bot: ${FACES[bot - 1]} *${bot}*\n\n🤝 Empate! Aposta devolvida.`);
        }
        atualizarUsuario(sender, { carteira: usuario.carteira - aposta });
        await reagir('💸');
        return reply(`🎲 *DUELO DE DADOS*\n\nVocê: ${FACES[r - 1]} *${r}* vs Bot: ${FACES[bot - 1]} *${bot}*\n\n❌ Você perdeu! *-${formatarMoeda(aposta)}*`);
    }
};
