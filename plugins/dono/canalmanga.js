import { getCanais, adicionarCanal, removerCanal, testarUltimosLancamentos, postarUltimosLancamentos, recalibrarEstado } from '../../arquivos/js/mangaWatcher.js';

// Aceita: jid pronto (@newsletter), link de convite (whatsapp.com/channel/XXXX)
// ou o código cru do convite.
function extrairAlvoCanal(texto) {
    const t = (texto || '').trim();
    if (!t) return null;
    if (t.endsWith('@newsletter')) return t;
    const m = t.match(/channel\/([A-Za-z0-9]+)/i);
    if (m) return m[1];
    if (/^[A-Za-z0-9]{10,}$/.test(t)) return t;
    return null;
}

export default {
    name: 'canalmanga',
    description: 'Ativa/desativa o aviso automático de novos capítulos de mangá/manhwa (Manga Absoluto) em um canal do WhatsApp',
    category: 'dono',
    aliases: ['mangacanal', 'canalatt'],
    async execute({ q, reply, reagir, columbina, from, prefix }) {
        const partes = (q || '').trim().split(/\s+/);
        const acao = (partes.shift() || '').toLowerCase();
        const arg = partes.join(' ').trim();

        // ── TESTAR (manda os últimos lançamentos na hora, só pra teste) ──
        if (acao === 'testar' || acao === 'test') {
            const qtd = parseInt(arg, 10);
            const quantidade = (!isNaN(qtd) && qtd > 0 && qtd <= 10) ? qtd : 3;

            await reagir('🧪');
            reply(`🧪 Buscando os ${quantidade} últimos lançamentos pra testar...`);

            try {
                const enviados = await testarUltimosLancamentos({ columbina, from, quantidade });
                if (!enviados) {
                    await reagir('❌');
                    return reply('❌ Não consegui buscar nenhum lançamento (site fora do ar ou resposta em formato inesperado).');
                }
                await reagir('✅');
            } catch (e) {
                await reagir('❌');
                return reply(`❌ Erro ao testar: ${e.message}`);
            }
            return;
        }

        // ── POSTAR (manda os últimos lançamentos de verdade pro(s) canal(is) ativado(s), quando você quiser) ──
        if (acao === 'postar' || acao === 'enviar') {
            const canaisAtivos = getCanais();
            if (!canaisAtivos.length) {
                await reagir('❌');
                return reply(`❌ Nenhum canal ativado ainda. Use *${prefix}canalmanga on <link ou ID do canal>* primeiro.`);
            }

            const qtd = parseInt(arg, 10);
            const quantidade = (!isNaN(qtd) && qtd > 0 && qtd <= 10) ? qtd : 3;

            await reagir('📤');
            reply(`📤 Postando os ${quantidade} últimos lançamentos no(s) canal(is) ativado(s)...`);

            try {
                const { enviados, falhas, canais: qtdCanais, total } = await postarUltimosLancamentos({ columbina, quantidade });
                if (!total) {
                    await reagir('❌');
                    return reply('❌ Não consegui buscar nenhum lançamento (site fora do ar ou resposta em formato inesperado).');
                }
                if (enviados === 0) {
                    await reagir('❌');
                    return reply(`❌ Nenhuma mensagem foi entregue em nenhum dos ${qtdCanais} canal(is) ativado(s). O ID do canal salvo pode estar errado ou desatualizado — confira com *${prefix}canalmanga listar* e o link do canal atual.`);
                }
                await reagir('✅');
                return reply(`✅ Postado! ${enviados} envio(s) confirmado(s)${falhas ? ` (${falhas} falha(s) — veja o log)` : ''} em ${qtdCanais} canal(is).`);
            } catch (e) {
                await reagir('❌');
                return reply(`❌ Erro ao postar: ${e.message}`);
            }
        }

        // ── RECALIBRAR (sincroniza a contagem salva com a real, sem anunciar nada) ──
        if (acao === 'recalibrar' || acao === 'sync') {
            await reagir('🔄');
            reply('🔄 Recalibrando a contagem salva de todos os mangás monitorados (isso NÃO manda nada pro canal, só ajusta os números guardados)...');

            try {
                const { total, atualizados, erros } = await recalibrarEstado();
                await reagir('✅');
                return reply(
                    `✅ Recalibrado!\n\n` +
                    `📚 Mangás verificados: ${total}\n` +
                    `🔧 Contagens corrigidas: ${atualizados}\n` +
                    (erros ? `⚠️ Erros ao verificar: ${erros}\n` : '') +
                    `\nA partir de agora o automático só vai anunciar capítulo genuinamente novo, um de cada vez.`
                );
            } catch (e) {
                await reagir('❌');
                return reply(`❌ Erro ao recalibrar: ${e.message}`);
            }
        }

        // ── LISTAR ──
        if (acao === 'listar' || acao === 'status') {
            const canais = getCanais();
            if (!canais.length) {
                return reply(`📭 Nenhum canal ativado ainda (desligado por padrão).\n\nUse: *${prefix}canalmanga on <link ou ID do canal>*`);
            }
            return reply(`📡 *Canais com aviso de mangá ativado:*\n\n${canais.map(c => `• ${c}`).join('\n')}`);
        }

        // ── ATIVAR ──
        if (acao === 'on' || acao === 'ativar') {
            const bruto = extrairAlvoCanal(arg);
            if (!bruto) {
                await reagir('❌');
                return reply(
                    `❌ Me manda o link ou ID do canal.\n\n` +
                    `📌 Exemplo: *${prefix}canalmanga on https://whatsapp.com/channel/0029Vxxxxxxxxxxx*\n` +
                    `📌 Ou, se já souber o ID: *${prefix}canalmanga on 12345678@newsletter*`
                );
            }

            let jid = bruto;
            if (!jid.endsWith('@newsletter')) {
                try {
                    if (typeof columbina.newsletterMetadata !== 'function') {
                        throw new Error('a versão atual da lib de conexão não expõe newsletterMetadata pra resolver o link em ID de canal');
                    }
                    const meta = await columbina.newsletterMetadata('invite', bruto);
                    if (!meta?.id) throw new Error('não encontrei nenhum canal com esse link/código');
                    jid = meta.id;
                } catch (e) {
                    await reagir('❌');
                    return reply(
                        `❌ Não consegui resolver esse canal pelo link.\n\n(${e.message})\n\n` +
                        `💡 Alternativa: pegue o ID do canal (termina com @newsletter) e mande ele direto:\n*${prefix}canalmanga on IDDOCANAL@newsletter*`
                    );
                }
            }

            const novo = adicionarCanal(jid);
            await reagir(novo ? '✅' : 'ℹ️');
            return reply(novo
                ? `✅ *Ativado!* A partir de agora, sempre que sair capítulo novo de mangá/manhwa, esse canal recebe o aviso com capa, nome, número do capítulo e descrição — automaticamente, sem precisar fazer nada.\n\n📡 ID salvo: ${jid}\n\nFica ligado até você desativar com *${prefix}canalmanga off*.`
                : `ℹ️ Esse canal já estava ativado.`);
        }

        // ── DESATIVAR ──
        if (acao === 'off' || acao === 'desativar') {
            const canais = getCanais();
            if (!arg) {
                if (!canais.length) return reply('📭 Nenhum canal ativado no momento.');
                return reply(
                    `⚠️ Especifique qual canal desativar:\n\n${canais.map(c => `• ${c}`).join('\n')}\n\n` +
                    `Ex: *${prefix}canalmanga off ${canais[0]}*`
                );
            }
            const bruto = extrairAlvoCanal(arg) || arg;
            const removido = removerCanal(bruto);
            await reagir(removido ? '✅' : '❌');
            return reply(removido ? '✅ Canal desativado — não vai mais receber avisos.' : '❌ Esse canal não estava na lista de ativados.');
        }

        // ── AJUDA ──
        return reply(
            `📖 *Aviso automático de capítulos — Manga Absoluto*\n\n` +
            `Fica *desligado por padrão*. Uma vez ativado num canal, continua ligado até você desativar manualmente (mesmo se o bot reiniciar).\n\n` +
            `*${prefix}canalmanga on <link ou ID do canal>* — ativa nesse canal\n` +
            `*${prefix}canalmanga off <ID do canal>* — desativa\n` +
            `*${prefix}canalmanga listar* — mostra os canais ativos\n` +
            `*${prefix}canalmanga testar [quantidade]* — manda os últimos lançamentos aqui mesmo, na hora, só pra testar (padrão: 3)\n` +
            `*${prefix}canalmanga postar [quantidade]* — manda os últimos lançamentos DE VERDADE pro(s) canal(is) ativado(s), na hora, quando você quiser (padrão: 3)\n` +
            `*${prefix}canalmanga recalibrar* — sincroniza a contagem salva com a real de cada mangá, SEM mandar nada pro canal (usa se o automático começar a mandar avisos demais de uma vez)\n\n` +
            `O automático agora só acompanha os *3 lançamentos mais recentes* do site a cada checagem (a cada 10 segundos), e só avisa quando um deles realmente ganha capítulo novo — um capítulo de cada vez, sempre priorizando o número mais recente.\n\n` +
            `Checagem automática de novos capítulos a cada 10 segundos, direto de manga-absoluto.vercel.app.`
        );
    }
};
