import fs from 'fs';
import { getUsuario, formatarMoeda, getOuCriarUsuario} from '../../arquivos/js/rpgCore.js';

export default {
    name: 'perfil',
    description: 'Mostra seu perfil no RPG (nome, idade, saldo e foto)',
    category: 'rpg',
    aliases: ['profile'],
    async execute({ sender, from, info, columbina, prefix, reply, reagir, pushname}) {
        const usuario = getOuCriarUsuario(sender, pushname);

        const texto =
            `👤 *PERFIL*\n\n` +
            `📛 Nome: ${usuario.nome}\n` +
            `🎂 Idade: ${usuario.idade}\n` +
            `⚧ Gênero: ${usuario.genero}\n` +
            `💵 Carteira: ${formatarMoeda(usuario.carteira)}\n` +
            `🏦 Banco: ${formatarMoeda(usuario.banco)}\n` +
            `💼 Trabalhos feitos: ${usuario.trabalhos || 0}\n` +
            `🔪 Roubos com sucesso: ${usuario.roubosSucesso || 0}\n` +
            `📅 Desde: ${usuario.dataCadastro}`;

        if (usuario.foto && fs.existsSync(usuario.foto)) {
            await columbina.sendMessage(from, { image: fs.readFileSync(usuario.foto), caption: texto }, { quoted: info });
        } else {
            await reply(texto);
        }
    }
};
