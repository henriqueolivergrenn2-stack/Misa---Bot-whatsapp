import { getUsuario, formatarMoeda, getOuCriarUsuario} from '../../arquivos/js/rpgCore.js';

export default {
    name: 'saldo',
    description: 'Mostra sua carteira, banco e total',
    category: 'rpg',
    aliases: ['carteira'],
    async execute({ sender, prefix, reply, reagir, pushname}) {
        const usuario = getOuCriarUsuario(sender, pushname);

        return reply(
            `💰 *SALDO*\n\n` +
            `💵 Carteira: ${formatarMoeda(usuario.carteira)}\n` +
            `🏦 Banco: ${formatarMoeda(usuario.banco)}\n` +
            `📊 Total: ${formatarMoeda(usuario.carteira + usuario.banco)}`
        );
    }
};
