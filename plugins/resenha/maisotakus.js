/**
 * Comando: maisotakus / top5otakus / rankotaku
 * Zoeira: sorteia 5 membros do grupo e monta um "ranking" de quem é mais
 * otaku, com uma frase de comédia diferente pra cada um. Não guarda nada,
 * é só resenha na hora — resultado muda toda vez que rodar o comando.
 */

const FRASES_OTAKU = [
    'aprendeu "arigatou" antes de aprender a arrumar a cama 🍥',
    'chora igual perdeu parente quando personagem favorito morre no anime 😭',
    'já assistiu o episódio de filler achando que era importante pro enredo 📺',
    'tem mais figure na estante do que prato na cozinha 🗿',
    'chama macarrão instantâneo de "ramen" com o maior orgulho 🍜',
    'sabe a abertura de anime de cor mas esquece a senha do próprio banco 🎶',
    'recusa dublagem e assiste tudo legendado, até desenho de criança 🈶',
    'já tentou explicar o multiverso de Naruto pra quem só perguntou "que horas são" ⏰',
    'tem o crush fictício mais definido que o crush de verdade 💭',
    'guarda print de personagem de anime igual guarda foto de família 📸',
    'sabe o nome de todos os arcos mas não sabe o nome do vizinho 🏠',
    'defende o "filler não é tão ruim assim" até com prova ao contrário na tela 🛡️',
    'tem playlist de opening/ending maior que a de música normal 🎧',
    'já quis aprender japonês só de tanto repetir frase de anime 🗾',
    'trata maratona de anime como compromisso inadiável, nem terremoto atrapalha 🌙',
];

function jidDoParticipante(p) {
    let raw = p.phoneNumber ?? p.id ?? p.jid;
    if (!raw) return null;
    if (raw.endsWith('@lid') && p.phoneNumber) raw = p.phoneNumber;
    return raw;
}

function embaralhar(lista) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

export default {
    name: 'otakus',
    description: 'Sorteia um ranking zoeira dos 5 membros mais "otakus" do grupo',
    category: 'resenha',
    aliases: ['rankotaku', 'otaku', 'otakus'],

    async execute({ from, info, columbina, reply, groupMembers, botNumber }) {
        if (!from?.endsWith('@g.us')) {
            return reply('❌ Esse comando só funciona dentro de grupos!');
        }

        const botNumeroPuro = (botNumber || '').split('@')[0].replace(/[^0-9]/g, '');

        const candidatos = (groupMembers || [])
            .map(jidDoParticipante)
            .filter(Boolean)
            .filter(jid => jid.split('@')[0].replace(/[^0-9]/g, '') !== botNumeroPuro);

        const unicos = [...new Set(candidatos)];

        if (unicos.length < 2) {
            return reply('📭 Não tem gente suficiente no grupo pra montar esse ranking! 😅');
        }

        const quantidade = Math.min(5, unicos.length);
        const sorteados = embaralhar(unicos).slice(0, quantidade);
        const frasesSorteadas = embaralhar(FRASES_OTAKU).slice(0, quantidade);

        const medalhas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

        let texto = `🍥 *TOP ${quantidade} MAIS OTAKUS DO GRUPO* 🍥\n\n`;
        sorteados.forEach((jid, i) => {
            texto += `${medalhas[i]} @${jid.split('@')[0]} — ${frasesSorteadas[i]}\n\n`;
        });
        texto += '_Resultado 100% científico, gerado na hora e sem compromisso com a realidade._ 😂';

        return columbina.sendMessage(from, {
            text: texto,
            mentions: sorteados
        }, { quoted: info });
    }
};
