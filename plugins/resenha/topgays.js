const FRASES_GAY = [
    'já sabe o nome de todas as musas do pop e ainda corrige a pronúncia 🎤',
    'tem mais glitter no bolso do que dinheiro na conta ✨',
    'chama todo mundo de "amiga" e ninguém estranha 💅',
    'já mudou o wallpaper do celular pra bandeira do orgulho 3 vezes 🏳️‍🌈',
    'sabe o ranking oficial de melhores bumbuns da academia 🏋️',
    'tem playlist só de Pabllo, Gloria Groove e Anitta no repeat 🔥',
    'já foi chamado de "viado" no futebol e respondeu "obrigay" ⚽',
    'conhece o cardápio do Grindr melhor que o do iFood 📱',
    'já chorou ouvindo Lady Gaga no chuveiro e não se arrepende 🛁',
    'tem opinião formada sobre corte de cabelo de todo boy do grupo ✂️',
    'manda "ai que delícia" pra tudo, inclusive pra pizza 🍕',
    'já arrumou o look da amiga hétero pro role e ficou melhor que ela 👗',
    'sabe a diferença entre ativo, passivo e versátil melhor que matemática 📐',
    'tem histórico de "só amizade" que durou exatamente 2 dias ⏳',
    'já foi o único que gostou do reality show de drag queens no grupo 👑',
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
    name: 'rankgay',
    description: 'Sorteia um ranking zoeira dos 5 membros mais "gays" do grupo',
    category: 'resenha',
    aliases: ['topgay', 'rankgay'],

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
        const frasesSorteadas = embaralhar(FRASES_GAY).slice(0, quantidade);

        const medalhas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

        let texto = `🌈 *TOP ${quantidade} MAIS GAY DO GRUPO* 🌈\n\n`;
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
