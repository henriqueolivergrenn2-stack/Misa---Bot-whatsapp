import { getUsuario, atualizarUsuario, formatarMoeda, getOuCriarUsuario} from '../../arquivos/js/rpgCore.js';

const TAMANHO = 5;
const TOTAL_NAVIOS = 3;
const MAX_TENTATIVAS = 10;
const AGUA = '🟦', ACERTO = '💥', ERRO = '⬜', NAVIO_REVELADO = '🚢';
const COLUNAS = ['A', 'B', 'C', 'D', 'E'];
const NUMEROS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

function criarTabuleiro() {
    return Array.from({ length: TAMANHO }, () => Array(TAMANHO).fill(0));
}

function posicionarNavios(tabuleiro) {
    let colocados = 0;
    while (colocados < TOTAL_NAVIOS) {
        const row = Math.floor(Math.random() * TAMANHO);
        const col = Math.floor(Math.random() * TAMANHO);
        if (tabuleiro[row][col] === 0) {
            tabuleiro[row][col] = 1;
            colocados++;
        }
    }
    return tabuleiro;
}

function renderTabuleiro(tabuleiro, revelado = false) {
    let texto = '➖A　B　C　D　E\n';
    for (let r = 0; r < TAMANHO; r++) {
        texto += NUMEROS[r];
        for (let c = 0; c < TAMANHO; c++) {
            const cel = tabuleiro[r][c];
            if (cel === 2) texto += ACERTO;
            else if (cel === 3) texto += ERRO;
            else if (cel === 1 && revelado) texto += NAVIO_REVELADO;
            else texto += AGUA;
        }
        texto += '\n';
    }
    return texto;
}

function parseCoordenada(input) {
    const clean = input.toUpperCase().replace(/\s/g, '');
    const match = clean.match(/^([A-E])([1-5])$/) || clean.match(/^([1-5])([A-E])$/);
    if (!match) return null;

    let letra, numero;
    if (isNaN(match[1])) { letra = match[1]; numero = match[2]; }
    else { numero = match[1]; letra = match[2]; }

    return { row: parseInt(numero) - 1, col: COLUNAS.indexOf(letra) };
}

// Sessões em memória: chave = sender
const JOGOS = new Map();

export default {
    name: 'batalhanaval',
    description: 'Minigame de batalha naval — ache os navios escondidos (aposta opcional)',
    category: 'rpg',
    aliases: ['naval', 'bn'],
    async execute({ sender, args, q, prefix, reply, reagir, pushname}) {
        const entrada = (q || '').trim().toLowerCase();
        const jogo = JOGOS.get(sender);

        // ── DESISTIR ──
        if (['desistir', 'sair', 'cancelar'].includes(entrada)) {
            if (!jogo) return reply('⚠️ Você não tem nenhum jogo em andamento!');
            const tabuleiroFinal = renderTabuleiro(jogo.tabuleiro, true);
            JOGOS.delete(sender);
            await reagir('🏳️');
            return reply(`🏳️ *Você desistiu!*\n\nOs navios estavam em:\n\n${tabuleiroFinal}`);
        }

        const pareceComando = ['novo', 'iniciar', 'start'].includes(entrada);
        const pareceAposta = entrada && !isNaN(parseInt(entrada, 10)) && parseCoordenada(entrada) === null;

        if (jogo && (!entrada || pareceComando || pareceAposta)) {
            return reply(`⚠️ Você já tem um jogo em andamento!\n\nUse *${prefix}bn <coordenada>* pra jogar (ex: ${prefix}bn A3)\nOu *${prefix}bn desistir* pra abandonar.`);
        }

        // ── NOVO JOGO ──
        if (!jogo && (!entrada || pareceComando || pareceAposta)) {            let aposta = 0;
            if (entrada && entrada !== 'novo' && entrada !== 'iniciar' && entrada !== 'start') {
                const usuario = getOuCriarUsuario(sender, pushname);
                aposta = parseInt(entrada, 10);
                if (isNaN(aposta) || aposta < 10) {
                    await reagir('❌');
                    return reply(`❌ Aposta mínima de *${formatarMoeda(10)}*!`);
                }
                if (aposta > usuario.carteira) {
                    await reagir('❌');
                    return reply('❌ Você não tem esse valor na carteira!');
                }
            }

            const tabuleiro = posicionarNavios(criarTabuleiro());
            JOGOS.set(sender, { tabuleiro, tentativas: 0, acertos: 0, aposta });

            await reagir('⚓');
            return reply(
                `⚓ *BATALHA NAVAL* ⚓\n\n` +
                `🎯 Encontre e afunde os *${TOTAL_NAVIOS} navios* escondidos!\n` +
                `💣 Você tem *${MAX_TENTATIVAS} tentativas*\n` +
                (aposta > 0 ? `💰 Aposta: *${formatarMoeda(aposta)}* (paga 2x se vencer)\n\n` : '\n') +
                `${renderTabuleiro(tabuleiro)}\n` +
                `📍 Digite a coordenada: *${prefix}bn A1*\n` +
                `Coluna (A-E) + Linha (1-5)\n\n` +
                `${ACERTO} = Acerto | ${ERRO} = Erro | ${AGUA} = Água`
            );
        }

        // ── JOGADA ──
        if (!jogo) {
            return reply(`⚠️ Você não tem nenhum jogo em andamento!\n\nUse *${prefix}batalhanaval* pra começar!`);
        }

        const coord = parseCoordenada(entrada);
        if (!coord) {
            await reagir('❌');
            return reply(`❌ Coordenada inválida! Use letra (A-E) + número (1-5)\n\nEx: ${prefix}bn A3`);
        }

        const { row, col } = coord;
        if (jogo.tabuleiro[row][col] === 2 || jogo.tabuleiro[row][col] === 3) {
            return reply('⚠️ Você já jogou nessa casa! Tenta outra.');
        }

        jogo.tentativas++;
        const acertou = jogo.tabuleiro[row][col] === 1;
        jogo.tabuleiro[row][col] = acertou ? 2 : 3;
        if (acertou) jogo.acertos++;

        // ── VITÓRIA ──
        if (jogo.acertos === TOTAL_NAVIOS) {
            let premio = 0;
            if (jogo.aposta > 0) {
                premio = jogo.aposta * 2;
                const usuario = getUsuario(sender);
                atualizarUsuario(sender, { carteira: usuario.carteira + premio });
            }
            JOGOS.delete(sender);
            await reagir('🏆');
            return reply(
                `🏆 *VOCÊ AFUNDOU TODOS OS NAVIOS!*\n\n` +
                `Tentativas usadas: *${jogo.tentativas}/${MAX_TENTATIVAS}*\n` +
                (premio > 0 ? `💰 Prêmio: *+${formatarMoeda(premio)}*\n\n` : '\n') +
                renderTabuleiro(jogo.tabuleiro, true)
            );
        }

        // ── DERROTA (acabaram as tentativas) ──
        if (jogo.tentativas >= MAX_TENTATIVAS) {
            if (jogo.aposta > 0) {
                const usuario = getUsuario(sender);
                atualizarUsuario(sender, { carteira: usuario.carteira - jogo.aposta });
            }
            const tabuleiroFinal = renderTabuleiro(jogo.tabuleiro, true);
            JOGOS.delete(sender);
            await reagir('💀');
            return reply(
                `💀 *SUAS TENTATIVAS ACABARAM!*\n\n` +
                (jogo.aposta > 0 ? `💸 Você perdeu *${formatarMoeda(jogo.aposta)}*\n\n` : '\n') +
                `Os navios estavam em:\n\n${tabuleiroFinal}`
            );
        }

        // ── CONTINUA ──
        await reagir(acertou ? '💥' : '⬜');
        return reply(
            `${acertou ? '💥 *ACERTOU!*' : '⬜ *Água...*'}\n\n` +
            `${renderTabuleiro(jogo.tabuleiro)}\n` +
            `🎯 Navios afundados: *${jogo.acertos}/${TOTAL_NAVIOS}*\n` +
            `💣 Tentativas: *${jogo.tentativas}/${MAX_TENTATIVAS}*`
        );
    }
};
