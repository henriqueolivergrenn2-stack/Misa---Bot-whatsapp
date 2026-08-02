/**
 * Comando: maisgados / top5gados / rankgado
 * Zoeira: sorteia 5 membros do grupo e monta um "ranking" de quem é mais
 * gado, com uma frase de comédia diferente pra cada um. Não guarda nada,
 * é só resenha na hora — resultado muda toda vez que rodar o comando.
 */

const FRASES_GADO = [
    'paga o motoboy, paga o pix e ainda pergunta "chegou bem?" 🐄',
    'dá bom dia todo dia pra pessoa que nem salvou seu contato 📵',
    'já comprou presente de aniversário pra quem nem lembra do seu 🎁',
    'curte todos os stories há 2 anos e nunca ganhou nem um "oi" de volta 👀',
    'acha que "vamos ver" é sinônimo de "sim" e vive esperando 📆',
    'empresta dinheiro sabendo que não vai receber de volta, só pra continuar conversando 💸',
    'é o motorista oficial de graça de quem só chama quando precisa 🚗',
    'jura que dessa vez é diferente… pela quinta vez esse mês 🔁',
    'vira terapeuta grátis 24h pra ouvir desabafo de quem nunca pergunta como ele/ela está 🛋️',
    'compra o combo pro encontro e come sozinho porque "surgiu um imprevisto" 🍽️',
    'faz o trabalho da faculdade inteiro e ainda divide os créditos igual 📚',
    'manda áudio de 5 minutos e recebe só "kkkk" de resposta 🎙️',
    'é o banco 24h ambulante da amizade: empresta, cobre, resolve e não recebe volta 🏧',
    'aceita ser "só amigo" com a esperança escondida atrás do sorriso 🎭',
    'defende quem nem tava na treta só pra aparecer bonzinho 🛡️',
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
    name: 'gados',
    description: 'Sorteia um ranking zoeira dos 5 membros mais "gados" do grupo',
    category: 'resenha',
    aliases: ['gado', 'rankgado', 'gados'],

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
        const frasesSorteadas = embaralhar(FRASES_GADO).slice(0, quantidade);

        const medalhas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

        let texto = `🐄 *TOP ${quantidade} MAIS GADOS DO GRUPO* 🐄\n\n`;
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
