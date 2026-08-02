/**
 * Comando: brincadeira
 * Ativa ou desativa o modo resenha no grupo.
 *
 * A persistência em disco (database/resenha.json) e o carregamento desse
 * estado ao ligar o bot agora são feitos direto pelo gerenciadorComandos
 * (comandos.js), no MESMO momento em que ele é criado — ou seja, antes de
 * qualquer mensagem ser processada. Esse plugin só chama
 * commandManager.DefinirResenhaAtiva(), que já salva sozinho.
 *
 * (Antes, esse plugin lia/escrevia o resenha.json por conta própria e só
 * sincronizava o Map em memória quando alguém rodava ".brincadeira" de novo
 * depois de reiniciar o bot — se ninguém rodasse, o modo resenha continuava
 * "desligado" pro filtro de comandos mesmo estando salvo como true no JSON.)
 */
export default {
    name: 'brincadeira',
    description: 'Ativa ou desativa o modo resenha no grupo (fica salvo mesmo se o bot reiniciar)',
    category: 'admin',
    aliases: [],

    async execute({ from, args, prefix, reply, reagir, commandManager }) {
        const opcao = (args[0] || '').trim();
        const ativo = commandManager.ResenhaAtiva.get(from) === true;

        if (opcao === '1') {
            commandManager.DefinirResenhaAtiva(from, true);
            await reagir('🎐');
            return reply('🎐 *Modo resenha ativado!* Agora os comandos de resenha do grupo estão liberados.');
        }

        if (opcao === '2') {
            commandManager.DefinirResenhaAtiva(from, false);
            await reagir('🔒');
            return reply('🔒 *Modo resenha desativado.*');
        }

        return reply(
            `🎐 *MODO RESENHA*\n\n` +
            `Status atual: *${ativo ? 'ativado ✅' : 'desativado ❌'}*\n\n` +
            `1️⃣ ${prefix}brincadeira 1 — ativa\n` +
            `2️⃣ ${prefix}brincadeira 2 — desativa`
        );
    }
};
