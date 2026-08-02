import { getUsuario, atualizarUsuario, formatarMoeda, getOuCriarUsuario} from '../../arquivos/js/rpgCore.js';

const NAIPES = ['♠️', '♥️', '♦️', '♣️'];
const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function novoDeck() {
    const d = [];
    for (const n of NAIPES) for (const v of VALORES) d.push({ n, v });
    return d.sort(() => Math.random() - 0.5);
}

function valorCarta(v) {
    if (['J', 'Q', 'K'].includes(v)) return 10;
    if (v === 'A') return 11;
    return Number(v);
}

function somaMao(mao) {
    let total = 0, ases = 0;
    for (const c of mao) {
        total += valorCarta(c.v);
        if (c.v === 'A') ases++;
    }
    while (total > 21 && ases > 0) { total -= 10; ases--; }
    return total;
}

function exibirMao(mao, ocultar = false) {
    if (ocultar) return `${mao[0].v}${mao[0].n} 🂠`;
    return mao.map(c => `${c.v}${c.n}`).join(' ');
}

// Sessões de jogo em memória (zeram se o bot reiniciar)
const JOGOS = new Map();

export default {
    name: 'blackjack',
    description: 'Jogue Blackjack (21) apostando na sua carteira',
    category: 'rpg',
    aliases: ['bj', '21'],
    async execute({ sender, args, prefix, reply, reagir, pushname}) {
        const usuario = getOuCriarUsuario(sender, pushname);

        const acao = (args[0] || '').toLowerCase();
        const jogo = JOGOS.get(sender);

        // ── HIT ──
        if (acao === 'hit' || acao === 'carta' || acao === 'pedir') {
            if (!jogo) return reply(`⚠️ Nenhum jogo ativo! Use *${prefix}blackjack <aposta>*`);

            jogo.player.push(jogo.deck.pop());
            const total = somaMao(jogo.player);
            if (total > 21) {
                atualizarUsuario(sender, { carteira: usuario.carteira - jogo.bet });
                JOGOS.delete(sender);
                await reagir('💥');
                return reply(`🃏 *BLACKJACK — ESTOUROU!*\n\nSua mão: ${exibirMao(jogo.player)} = *${total}*\n\n💸 Você perdeu *${formatarMoeda(jogo.bet)}*`);
            }
            return reply(
                `🃏 *BLACKJACK — HIT*\n\n` +
                `Sua mão: ${exibirMao(jogo.player)} = *${total}*\n` +
                `Dealer: ${exibirMao(jogo.dealer, true)}\n\n` +
                `_${prefix}bj hit para mais | ${prefix}bj stand para parar_`
            );
        }

        // ── STAND ──
        if (acao === 'stand' || acao === 'parar' || acao === 'stop') {
            if (!jogo) return reply(`⚠️ Nenhum jogo ativo! Use *${prefix}blackjack <aposta>*`);

            while (somaMao(jogo.dealer) < 17) jogo.dealer.push(jogo.deck.pop());
            const pTotal = somaMao(jogo.player);
            const dTotal = somaMao(jogo.dealer);
            JOGOS.delete(sender);

            let msg;
            if (dTotal > 21 || pTotal > dTotal) {
                atualizarUsuario(sender, { carteira: usuario.carteira + jogo.bet });
                await reagir('🏆');
                msg = `🏆 *VOCÊ GANHOU!*\n\n+*${formatarMoeda(jogo.bet)}*`;
            } else if (pTotal === dTotal) {
                msg = `🤝 *EMPATE!*\n\nAposta devolvida.`;
            } else {
                atualizarUsuario(sender, { carteira: usuario.carteira - jogo.bet });
                await reagir('💀');
                msg = `💀 *DEALER GANHOU!*\n\n-*${formatarMoeda(jogo.bet)}*`;
            }

            return reply(
                `🃏 *BLACKJACK — RESULTADO*\n\n` +
                `Sua mão: ${exibirMao(jogo.player)} = *${pTotal}*\n` +
                `Dealer: ${exibirMao(jogo.dealer)} = *${dTotal}*\n\n${msg}`
            );
        }

        // ── NOVO JOGO ──
        if (jogo) {
            return reply(`⚠️ Você já tem um jogo ativo!\n*${prefix}bj hit* ou *${prefix}bj stand*`);
        }

        const bet = parseInt(args[0], 10);
        if (!bet || isNaN(bet) || bet < 10) {
            await reagir('❌');
            return reply(`❌ Aposta mínima de *${formatarMoeda(10)}*.\n\nUso: ${prefix}blackjack <valor>`);
        }
        if (bet > usuario.carteira) {
            await reagir('❌');
            return reply('❌ Você não tem esse valor na carteira!');
        }

        const deck = novoDeck();
        const player = [deck.pop(), deck.pop()];
        const dealer = [deck.pop(), deck.pop()];
        JOGOS.set(sender, { deck, player, dealer, bet });

        const total = somaMao(player);
        if (total === 21) {
            const ganho = Math.floor(bet * 1.5);
            atualizarUsuario(sender, { carteira: usuario.carteira + ganho });
            JOGOS.delete(sender);
            await reagir('🏆');
            return reply(`🃏 *BLACKJACK NATURAL!*\n\nSua mão: ${exibirMao(player)} = *21*\n\n🏆 *+${formatarMoeda(ganho)}* (1.5x)`);
        }

        return reply(
            `🃏 *BLACKJACK*\n\n` +
            `Sua mão: ${exibirMao(player)} = *${total}*\n` +
            `Dealer: ${exibirMao(dealer, true)}\n\n` +
            `💰 Aposta: *${formatarMoeda(bet)}*\n\n` +
            `_${prefix}bj hit para pedir carta | ${prefix}bj stand para parar_`
        );
    }
};
