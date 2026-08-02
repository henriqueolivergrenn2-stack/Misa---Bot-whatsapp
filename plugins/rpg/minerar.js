import { getUsuario, atualizarUsuario, formatarMoeda, formatarTempo, randomEntre, getOuCriarUsuario } from '../../arquivos/js/rpgCore.js';

const COOLDOWN_MINERAR = 20 * 60 * 1000; // 20 min

// Progressão de picareta — cada tier multiplica o valor dos minérios achados
const PICARETAS = {
    madeira:  { nome: 'Picareta de Madeira 🪵',  multiplicador: 1,   proxima: 'pedra',    custoProxima: 300  },
    pedra:    { nome: 'Picareta de Pedra 🪨',    multiplicador: 1.4, proxima: 'ferro',    custoProxima: 800  },
    ferro:    { nome: 'Picareta de Ferro ⛏️',    multiplicador: 1.9, proxima: 'diamante', custoProxima: 2000 },
    diamante: { nome: 'Picareta de Diamante 💎', multiplicador: 2.6, proxima: null,       custoProxima: null }
};

// Tabela de minérios (peso = chance relativa de sair)
const MINERIOS = [
    { nome: 'Pedra comum', emoji: '🪨', peso: 40, min: 10,  max: 30  },
    { nome: 'Carvão',      emoji: '⚫', peso: 25, min: 25,  max: 60  },
    { nome: 'Ferro',       emoji: '⛓️', peso: 18, min: 50,  max: 120 },
    { nome: 'Ouro',        emoji: '🟡', peso: 10, min: 100, max: 220 },
    { nome: 'Esmeralda',   emoji: '🟢', peso: 5,  min: 200, max: 400 },
    { nome: 'Diamante',    emoji: '💎', peso: 2,  min: 450, max: 900 }
];

const CHANCE_DESABAMENTO = 0.07; // 7% de chance de dar ruim

function sortearMinerio() {
    const pesoTotal = MINERIOS.reduce((s, m) => s + m.peso, 0);
    let roll = Math.random() * pesoTotal;
    for (const m of MINERIOS) {
        if (roll < m.peso) return m;
        roll -= m.peso;
    }
    return MINERIOS[0];
}

function getPicareta(usuario) {
    return PICARETAS[usuario.picareta] || PICARETAS.madeira;
}

export default {
    name: 'minerar',
    description: 'Vai minerar em busca de minérios pra vender (cooldown de 20min). Use ".minerar upgrade" pra melhorar sua picareta.',
    category: 'rpg',
    aliases: ['mina', 'miner', 'minerar'],
    async execute({ sender, prefix, reply, reagir, pushname, q }) {
        const usuario = getOuCriarUsuario(sender, pushname);
        const entrada = (q || '').trim().toLowerCase();

        // ── UPGRADE DE PICARETA ──
        if (['upgrade', 'melhorar', 'loja'].includes(entrada)) {
            const atual = getPicareta(usuario);
            if (!atual.proxima) {
                await reagir('💎');
                return reply(`⛏️ Você já tem a picareta máxima: *${atual.nome}*!`);
            }
            const proxima = PICARETAS[atual.proxima];
            if (usuario.carteira < atual.custoProxima) {
                await reagir('❌');
                return reply(
                    `❌ Você precisa de *${formatarMoeda(atual.custoProxima)}* na carteira pra evoluir sua picareta!\n\n` +
                    `⛏️ Atual: ${atual.nome}\n` +
                    `⬆️ Próxima: ${proxima.nome} (${proxima.multiplicador}x nos minérios)\n` +
                    `💵 Sua carteira: ${formatarMoeda(usuario.carteira)}`
                );
            }
            atualizarUsuario(sender, {
                carteira: usuario.carteira - atual.custoProxima,
                picareta: atual.proxima
            });
            await reagir('⛏️');
            return reply(`⛏️✨ Picareta evoluída para *${proxima.nome}*!\n\n💸 -${formatarMoeda(atual.custoProxima)}\n📈 Multiplicador nos minérios: *${proxima.multiplicador}x*`);
        }

        // ── MINERAR ──
        const agora = Date.now();
        const passou = agora - (usuario.ultimoMinerio || 0);
        if (passou < COOLDOWN_MINERAR) {
            await reagir('⏳');
            return reply(`⏳ Sua picareta ainda tá cansada! Volte em *${formatarTempo(COOLDOWN_MINERAR - passou)}*.`);
        }

        const picareta = getPicareta(usuario);

        // chance de desabamento (dá errado, perde uma grana)
        if (Math.random() < CHANCE_DESABAMENTO) {
            const perda = Math.min(usuario.carteira, randomEntre(20, 80));
            atualizarUsuario(sender, {
                carteira: usuario.carteira - perda,
                ultimoMinerio: agora
            });
            await reagir('💥');
            return reply(
                `💥 *DESABAMENTO!*\n\nA mina desabou em cima de você e você perdeu *${formatarMoeda(perda)}* correndo pra fora! 🏃\n\n` +
                `💵 Carteira: ${formatarMoeda(usuario.carteira - perda)}`
            );
        }

        const minerio = sortearMinerio();
        const ganhoBase = randomEntre(minerio.min, minerio.max);
        const ganho = Math.round(ganhoBase * picareta.multiplicador);

        atualizarUsuario(sender, {
            carteira: usuario.carteira + ganho,
            ultimoMinerio: agora,
            mineracoes: (usuario.mineracoes || 0) + 1
        });

        await reagir(minerio.emoji);
        return reply(
            `${minerio.emoji} Você minerou *${minerio.nome}* usando sua ${picareta.nome} e vendeu por *${formatarMoeda(ganho)}*!\n\n` +
            `💵 Carteira: ${formatarMoeda(usuario.carteira + ganho)}` +
            (picareta.proxima ? `\n\n💡 Use *${prefix}minerar upgrade* pra evoluir sua picareta!` : '')
        );
    }
};
