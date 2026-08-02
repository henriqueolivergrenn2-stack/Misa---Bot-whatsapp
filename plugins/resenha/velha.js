import { getUsuario, getUsuarioPorMencao, atualizarUsuario, formatarMoeda, getOuCriarUsuario} from '../../arquivos/js/rpgCore.js';
import { getPhoneNumberFromId } from '../../arquivos/js/exports.js';

const LINHAS_VITORIA = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function renderTabuleiro(board) {
    const s = (i) => board[i] || `${i + 1}️⃣`;
    return `${s(0)}${s(1)}${s(2)}\n${s(3)}${s(4)}${s(5)}\n${s(6)}${s(7)}${s(8)}`;
}

function checarVencedor(board) {
    for (const [a, b, c] of LINHAS_VITORIA) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    if (board.every(c => c !== null)) return 'empate';
    return null;
}

// Sessão em memória: chave = from (grupo/chat)
const JOGOS = new Map();
const ULTIMO_FIM = new Map(); // from -> timestamp do fim da última partida
const COOLDOWN_ENTRE_JOGOS = 60 * 1000; // 1 minuto de intervalo entre partidas no mesmo grupo

export default {
    name: 'velha',
    description: 'Jogo da velha 2 jogadores — desafie alguém, com aposta opcional',
    category: 'rpg',
    aliases: ['jogodavelha', 'jv'],
    async execute({ sender, from, info, q, prefix, reply, reagir, columbina, convertWhatsAppUser, groupMembers, pushname}) {
        const entrada = (q || '').trim().toLowerCase();
        const jogo = JOGOS.get(from);

        // ── ACEITAR ──
        if (entrada === 'aceitar') {
            if (!jogo || jogo.status !== 'pendente') {
                return reply('⚠️ Nenhum desafio pendente pra aceitar!');
            }
            if (sender === jogo.p1) {
                return reply('⚠️ Você não pode aceitar o próprio desafio! 😅');
            }

            const candidatos = [sender];
            const mesmaPessoa = candidatos.some(c => c === jogo.p2Convidado) ||
                getPhoneNumberFromId(sender, groupMembers) === getPhoneNumberFromId(jogo.p2Convidado, groupMembers);

            if (!mesmaPessoa) {
                return reply('⚠️ Esse desafio não é pra você!');
            }

            if (jogo.aposta > 0) {
                const usuario = getOuCriarUsuario(sender, pushname);
                if (usuario.carteira < jogo.aposta) {
                    await reagir('❌');
                    return reply(`❌ Você não tem ${formatarMoeda(jogo.aposta)} pra cobrir a aposta!`);
                }
                atualizarUsuario(sender, { carteira: usuario.carteira - jogo.aposta });
                const p1Usuario = getUsuario(jogo.p1);
                atualizarUsuario(jogo.p1, { carteira: p1Usuario.carteira - jogo.aposta });
            }

            jogo.p2 = sender;
            jogo.status = 'jogando';
            jogo.turno = jogo.p1;

            await reagir('🎮');
            return columbina.sendMessage(from, {
                text: `🎮 *Jogo iniciado!*${jogo.aposta > 0 ? `\n💰 Aposta: *${formatarMoeda(jogo.aposta)}* cada` : ''}\n\n${renderTabuleiro(jogo.board)}\n\nVez de @${jogo.p1.split('@')[0]} (❌) — jogue com *${prefix}velha <número>*`,
                mentions: [jogo.p1, jogo.p2]
            }, { quoted: info });
        }

        // ── DESISTIR ──
        if (['desistir', 'sair', 'cancelar'].includes(entrada)) {
            if (!jogo) return reply('⚠️ Nenhum jogo em andamento neste chat!');
            if (sender !== jogo.p1 && sender !== jogo.p2) {
                return reply('⚠️ Você não está participando desse jogo!');
            }

            if (jogo.status === 'jogando' && jogo.aposta > 0) {
                const vencedor = sender === jogo.p1 ? jogo.p2 : jogo.p1;
                const usuarioVencedor = getUsuario(vencedor);
                if (usuarioVencedor) atualizarUsuario(vencedor, { carteira: usuarioVencedor.carteira + jogo.aposta * 2 });
                JOGOS.delete(from);
            ULTIMO_FIM.set(from, Date.now());
                await reagir('🏳️');
                return columbina.sendMessage(from, {
                    text: `🏳️ @${sender.split('@')[0]} desistiu!\n\n🏆 @${vencedor.split('@')[0]} ganhou *${formatarMoeda(jogo.aposta * 2)}*!`,
                    mentions: [sender, vencedor]
                }, { quoted: info });
            }

            if (jogo.status === 'pendente' && jogo.aposta > 0) {
                const usuario = getUsuario(jogo.p1);
                if (usuario) atualizarUsuario(jogo.p1, { carteira: usuario.carteira + jogo.aposta });
            }

            JOGOS.delete(from);
            ULTIMO_FIM.set(from, Date.now());
            await reagir('❌');
            return reply('❌ Jogo cancelado.');
        }

        // ── JOGADA (número 1-9) ──
        const numero = parseInt(entrada, 10);
        if (!isNaN(numero) && numero >= 1 && numero <= 9) {
            if (!jogo || jogo.status !== 'jogando') {
                return reply(`⚠️ Nenhum jogo em andamento! Desafie alguém: *${prefix}velha @pessoa*`);
            }
            if (sender !== jogo.p1 && sender !== jogo.p2) {
                return reply('⚠️ Você não está participando desse jogo!');
            }
            if (sender !== jogo.turno) {
                return reply('⏳ Não é sua vez ainda!');
            }

            const idx = numero - 1;
            if (jogo.board[idx]) {
                return reply('⚠️ Essa casa já foi jogada!');
            }

            const simbolo = sender === jogo.p1 ? '❌' : '⭕';
            jogo.board[idx] = simbolo;

            const resultado = checarVencedor(jogo.board);

            if (resultado === 'empate') {
                if (jogo.aposta > 0) {
                    const u1 = getUsuario(jogo.p1);
                    const u2 = getUsuario(jogo.p2);
                    atualizarUsuario(jogo.p1, { carteira: u1.carteira + jogo.aposta });
                    atualizarUsuario(jogo.p2, { carteira: u2.carteira + jogo.aposta });
                }
                JOGOS.delete(from);
            ULTIMO_FIM.set(from, Date.now());
                await reagir('🤝');
                return reply(`🤝 *EMPATE!*\n\n${renderTabuleiro(jogo.board)}\n\n${jogo.aposta > 0 ? 'Apostas devolvidas.' : ''}`);
            }

            if (resultado) {
                const vencedor = sender;
                const perdedor = sender === jogo.p1 ? jogo.p2 : jogo.p1;
                let premio = 0;
                if (jogo.aposta > 0) {
                    premio = jogo.aposta * 2;
                    const uVenc = getUsuario(vencedor);
                    atualizarUsuario(vencedor, { carteira: uVenc.carteira + premio });
                }
                JOGOS.delete(from);
            ULTIMO_FIM.set(from, Date.now());
                await reagir('🏆');
                return columbina.sendMessage(from, {
                    text: `🏆 *@${vencedor.split('@')[0]} VENCEU!*\n\n${renderTabuleiro(jogo.board)}\n\n` +
                        (premio > 0 ? `💰 Prêmio: *+${formatarMoeda(premio)}*` : 'GG! 🎮'),
                    mentions: [vencedor, perdedor]
                }, { quoted: info });
            }

            jogo.turno = sender === jogo.p1 ? jogo.p2 : jogo.p1;
            await reagir(simbolo);
            return columbina.sendMessage(from, {
                text: `${renderTabuleiro(jogo.board)}\n\nVez de @${jogo.turno.split('@')[0]}`,
                mentions: [jogo.turno]
            }, { quoted: info });
        }

        // ── DESAFIAR (menção) ──
        const ctx = info.message?.extendedTextMessage?.contextInfo;
        const mencionado = ctx?.mentionedJid?.[0] || ctx?.participant || null;

        if (!mencionado) {
            if (jogo) {
                const status = jogo.status === 'pendente'
                    ? `⏳ Desafio pendente. Use *${prefix}velha aceitar* pra jogar.`
                    : `🎮 Jogo em andamento entre @${jogo.p1.split('@')[0]} e @${jogo.p2.split('@')[0]}.`;
                return reply(status);
            }
            return reply(
                `🎮 *JOGO DA VELHA*\n\n` +
                `Desafie alguém: *${prefix}velha @pessoa*\n` +
                `Com aposta: *${prefix}velha @pessoa 100*\n\n` +
                `Comandos:\n*${prefix}velha aceitar* — aceita o desafio\n*${prefix}velha desistir* — encerra o jogo\n*${prefix}velha <1-9>* — joga na casa`
            );
        }

        if (jogo) {
            return reply(`⚠️ Já tem um jogo em andamento neste chat! Use *${prefix}velha desistir* pra encerrar.`);
        }

        const ultimoFim = ULTIMO_FIM.get(from) || 0;
        const faltaEspera = COOLDOWN_ENTRE_JOGOS - (Date.now() - ultimoFim);
        if (faltaEspera > 0) {
            await reagir('⏳');
            return reply(`⏳ Calma aí! Espera mais *${Math.ceil(faltaEspera / 1000)}s* pra começar outro jogo da velha neste grupo.`);
        }

        const alvoResolvido = getPhoneNumberFromId(mencionado, groupMembers) || mencionado;

        if (alvoResolvido === sender || mencionado === sender) {
            return reply('⚠️ Você não pode desafiar a si mesmo! 😅');
        }

        let aposta = 0;
        const args = entrada.split(' ');
        const apostaArg = args.find(a => !isNaN(parseInt(a, 10)) && parseInt(a, 10) > 0);
        if (apostaArg) {
            const usuario = getOuCriarUsuario(sender, pushname);
            aposta = parseInt(apostaArg, 10);
            if (aposta < 20) {
                await reagir('❌');
                return reply(`❌ Aposta mínima de *${formatarMoeda(20)}*!`);
            }
            if (aposta > usuario.carteira) {
                await reagir('❌');
                return reply('❌ Você não tem esse valor na carteira!');
            }
        }

        JOGOS.set(from, {
            p1: sender, p2: null, p2Convidado: mencionado,
            board: Array(9).fill(null), turno: null, status: 'pendente', aposta
        });

        await reagir('⏳');
        return columbina.sendMessage(from, {
            text:
                `🎮 *JOGO DA VELHA — DESAFIO!*\n\n` +
                `❌ @${sender.split('@')[0]} desafia ⭕ @${mencionado.split('@')[0]}!\n` +
                (aposta > 0 ? `💰 Aposta: *${formatarMoeda(aposta)}* cada\n\n` : '\n') +
                `Digite *${prefix}velha aceitar* pra jogar!\n` +
                (aposta > 0 ? `_⚠️ Você vai precisar de ${formatarMoeda(aposta)} pra aceitar!_\n\n` : '\n') +
                `_${prefix}velha desistir pra cancelar_`,
            mentions: [sender, mencionado]
        }, { quoted: info });
    }
};
