const FRASES = [
    'Jurou que era só amizade colorida, mas a colorida já tinha CEP na casa dele 💀',
    'Descobriu pelo Instagram antes de descobrir pelo coração 📲💔',
    'Ainda paga o plano de internet da ex "por educação" 🙃',
    'Foi no churrasco da firma dela sem saber que era "a firma" mesmo 🍖',
    'Tem o Face Ativo 24h só pra ver o "visto por último" dela 👀',
    'Chamava ele de "meu escudo" — literalmente, ele só servia de escudo 🛡️',
    'Rezou pra São Longuinho achar o celular dela, mas era pra achar as conversas 📿',
    'Deu boa noite pro grupo da igreja e amém pro puxadinho dela 🙏',
    'É fã número 1 do stories dela… que nunca é sobre ele 📵',
    'Cantou parabéns pra ela na festa que era dele mesmo 🎂',
    'Trocou a senha do wifi e nem assim ela parou de usar o wifi do vizinho 📶',
    'Guarda o buquê do casamento junto com o processo de separação 💐📄',
    'Comprou aliança no cartão e ainda tá pagando, ela já trocou de dedo 💍',
    'Falou "confio de olhos fechados" e ela aproveitou o intervalo 😴',
    'Foi barrado até no perfil fake que ele mesmo criou pra espiar 🕵️'
];

function nomeDoParticipante(id, groupMembers) {
    const membro = (groupMembers || []).find(m => m.id === id);
    return membro?.notify || membro?.name || id.split('@')[0];
}

export default {
    name: 'cornos',
    description: 'Sorteia um ranking de zoeira "top 5 cornos" do grupo (é tudo brincadeira!)',
    category: 'resenha',
    aliases: ['corno', 'rankcornos', 'cornos'],
    async execute({ from, info, columbina, groupMembers, botNumber, reply, reagir }) {
        if (!from?.endsWith('@g.us')) {
            return reply('❌ Esse comando só funciona dentro de grupos!');
        }

        const participantes = (groupMembers || [])
            .map(m => m.id)
            .filter(id => id && id !== botNumber);

        if (participantes.length < 3) {
            return reply('❌ O grupo precisa ter pelo menos 3 pessoas pra rolar esse ranking! 😂');
        }

        const embaralhados = [...participantes].sort(() => Math.random() - 0.5);
        const sorteados = embaralhados.slice(0, Math.min(5, participantes.length));
        const frasesEmbaralhadas = [...FRASES].sort(() => Math.random() - 0.5);

        const MEDALHAS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

        let texto = `🐂 *TOP ${sorteados.length} CORNOS DO GRUPO* 🐂\n_(zoeira, não é sério, relaxa)_\n\n`;
        sorteados.forEach((id, i) => {
            texto += `${MEDALHAS[i]} @${id.split('@')[0]}\n"_${frasesEmbaralhadas[i]}_"\n\n`;
        });

        await reagir('🐂');
        return columbina.sendMessage(from, { text: texto.trim(), mentions: sorteados }, { quoted: info });
    }
};
