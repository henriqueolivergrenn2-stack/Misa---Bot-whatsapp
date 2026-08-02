import fs from 'fs';
import path from 'path';
import { PASTA_PERFIS, estaRegistrado, getUsuario, criarUsuario, atualizarUsuario, formatarMoeda } from '../../arquivos/js/rpgCore.js';

function extrairImagem(info) {
    const quotedMsg = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    return quotedMsg?.imageMessage || info.message?.imageMessage || null;
}

function normalizarGenero(texto) {
    const t = (texto || '').trim().toLowerCase();
    const mapa = {
        '1': 'Masculino', 'm': 'Masculino', 'masculino': 'Masculino', 'homem': 'Masculino',
        '2': 'Feminino', 'f': 'Feminino', 'feminino': 'Feminino', 'mulher': 'Feminino',
        '3': 'Prefiro não dizer', 'outro': 'Prefiro não dizer', 'prefiro nao dizer': 'Prefiro não dizer'
    };
    return mapa[t] || (texto || '').trim();
}

export default {
    name: 'rg',
    description: 'Cria ou personaliza sua conta no RPG: nome/idade/gênero (+ foto opcional). Não é obrigatório pra jogar!',
    category: 'rpg',
    aliases: ['registrar', 'cadastrar', 'editarperfil'],
    async execute({ sender, from, info, q, prefix, columbina, reply, reagir, getFileBuffer }) {
        const partes = (q || '').split('/').map(p => p.trim());

        if (partes.length !== 3 || !partes[0] || !partes[1] || !partes[2]) {
            await reagir('❌');
            return reply(
                `❌ *Uso correto:*\n\n` +
                `${prefix}rg Nome/Idade/Gênero\n\n` +
                `📌 Exemplo:\n${prefix}rg Henrique/22/Masculino\n\n` +
                `💡 Gênero pode ser: Masculino, Feminino ou Outro\n` +
                `📸 Se quiser, marque ou responda uma foto junto com o comando pra usar como avatar!\n\n` +
                `ℹ️ _Você não precisa disso pra jogar — o RPG já cria uma conta automática com seu nome do WhatsApp. Use *${prefix}rg* só se quiser personalizar!_`
            );
        }

        const nome = partes[0];
        const idade = parseInt(partes[1], 10);
        const genero = normalizarGenero(partes[2]);

        if (nome.length < 2 || nome.length > 30) {
            await reagir('❌');
            return reply('❌ O nome deve ter de 2 a 30 caracteres.');
        }
        if (isNaN(idade) || idade < 1 || idade > 120) {
            await reagir('❌');
            return reply('❌ Idade inválida! Use só o número (ex: 22).');
        }

        const jaTinhaConta = estaRegistrado(sender);
        const usuarioExistente = jaTinhaConta ? getUsuario(sender) : null;

        let foto = usuarioExistente?.foto || null;
        const imagemMsg = extrairImagem(info);
        if (imagemMsg) {
            try {
                const buffer = await getFileBuffer(imagemMsg, 'image');
                if (!fs.existsSync(PASTA_PERFIS)) fs.mkdirSync(PASTA_PERFIS, { recursive: true });
                const numeroLimpo = sender.split('@')[0].replace(/[^0-9]/g, '');
                const caminhoFoto = path.join(PASTA_PERFIS, `${numeroLimpo}.jpg`);
                fs.writeFileSync(caminhoFoto, buffer);
                foto = caminhoFoto;
            } catch (err) {
                // se der erro na foto, mantém a que já tinha (ou segue sem foto)
            }
        }

        const usuario = jaTinhaConta
            ? atualizarUsuario(sender, { nome, idade, genero, foto })
            : criarUsuario(sender, { nome, idade, genero, foto });

        await reagir('✅');
        await reply(
            `🎉 *${jaTinhaConta ? 'Perfil atualizado!' : 'Cadastro concluído!'}*\n\n` +
            `👤 Nome: ${usuario.nome}\n` +
            `🎂 Idade: ${usuario.idade}\n` +
            `⚧ Gênero: ${usuario.genero}\n` +
            (jaTinhaConta ? `💰 Carteira: ${formatarMoeda(usuario.carteira)}\n` : `💰 Carteira inicial: ${formatarMoeda(usuario.carteira)}\n`) +
            `📸 Foto: ${foto ? 'salva ✅' : 'sem foto (use *.fotoperfil* pra adicionar)'}\n\n` +
            `Use *.trabalhar* pra ganhar dinheiro, *.perfil* pra ver seu perfil e *.rank* pra ver o ranking global!`
        );
    }
};
