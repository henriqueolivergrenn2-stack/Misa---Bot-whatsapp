export default {
    name: 'limpar',
    description: 'Limpa a tela do chat do grupo (efeito visual)',
    category: 'admin',
    aliases: ['limpa', 'clear', 'clear-chat'],
    async execute({ columbina, from, reagir }) {
        await reagir('🧹');
        await new Promise((r) => setTimeout(r, 1000));

        const mensagemLimpeza = {
            botInvokeMessage: {
                message: {
                    messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} },
                    conversation: '🧹 Chat limpo ✅'
                },
                expiration: 0
            }
        };

        try {
            await columbina.relayMessage(from, mensagemLimpeza, {});
        } catch (e) {}
    }
};
