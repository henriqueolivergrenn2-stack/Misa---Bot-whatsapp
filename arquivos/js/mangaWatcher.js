import fs from 'fs';
import axios from 'axios';
import { Jimp } from 'jimp';
import { getUrlInfo } from '@whiskeysockets/baileys';
import { CyanLog, RedLog } from './logger.js';

// ════════════════════════════════════════════════════════════
// Monitor automático de novos capítulos — Manga Absoluto
// Site: https://manga-absoluto.vercel.app
//
// Como funciona:
//  1. A cada 10 segundos, busca /api/latest-releases (pra descobrir títulos
//     novos) e também revisita TODOS os títulos já conhecidos (guardados no
//     state), comparando a contagem real de capítulos de cada um com o que
//     foi salvo da última vez. Isso garante que um título continue sendo
//     monitorado mesmo depois de sair do "top 3" de lançamentos recentes.
//  2. Se algum mangá tem MAIS capítulos que antes, busca os detalhes
//     completos em /api/manga/<id> (nome, capa, descrição, capítulos)
//     e posta um aviso bonito nos canais ativados.
//  3. Na PRIMEIRA vez que um mangá é visto, só registra a contagem —
//     não anuncia (senão o catálogo inteiro seria "anunciado" de uma vez
//     assim que alguém ligar o recurso).
// ════════════════════════════════════════════════════════════

const SITE_BASE = 'https://manga-absoluto.vercel.app';
const CANAIS_FILE = './database/canaisManga.json';
const STATE_FILE = './database/mangaCapitulosState.json';
const LOCK_FILE = './database/mangaWatcher.lock';
const INTERVALO_MS = 60 * 1000; // checa a cada 1 minuto
const QTD_MONITORADA_PADRAO = 3; // quantos títulos do /api/latest-releases são checados por ciclo pra DESCOBRIR lançamentos novos (títulos já conhecidos continuam sendo checados sempre, veja checarAtualizacoes)

// ── Rede de segurança pra "Unhandled Rejection: Error: Connection Closed" ──
// IMPORTANTE (transparência): revisei TODO o fluxo assíncrono deste arquivo
// (busca de dados, download de capa, envio de mensagem) — tudo já está
// dentro de try/catch ou com .catch(...). Ou seja, esse erro específico
// muito provavelmente NÃO vem do mangaWatcher, e sim do próprio Baileys
// (ou do conexao.js, que não temos acesso aqui) reagindo à queda de conexão
// por conta própria. O "reiniciar o processo inteiro ao perder conexão"
// também parece ser intencional em outro arquivo, não algo que dá pra
// mudar só daqui.
// Mesmo assim, esse listener funciona como rede de segurança: se algum dia
// uma promise relacionada à conexão escapar sem tratamento por aqui, ela
// fica logada de forma clara em vez de virar um crash "misterioso". Isso
// NÃO impede o restart intencional feito em outro arquivo — só evita que
// UM erro a mais (esse) contribua pra travar/crashar de um jeito pior.
process.on('unhandledRejection', (motivo) => {
    const msg = motivo?.message || String(motivo);
    if (/connection closed|connection.*408|conexao fechada/i.test(msg)) {
        RedLog(`[MangaWatcher] Rejeição não tratada relacionada à conexão do WhatsApp (não é um bug do monitor de mangá — é a conexão caindo): ${msg}`);
    }
});

function lerJson(caminho, padrao) {
    try {
        if (!fs.existsSync(caminho)) {
            fs.writeFileSync(caminho, JSON.stringify(padrao, null, 2));
            return padrao;
        }
        const data = JSON.parse(fs.readFileSync(caminho, 'utf-8'));
        return data && typeof data === 'object' ? data : padrao;
    } catch (e) {
        RedLog(`[MangaWatcher] Erro ao ler ${caminho}: ${e.message}`);
        return padrao;
    }
}

function salvarJson(caminho, dados) {
    try {
        fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
    } catch (e) {
        RedLog(`[MangaWatcher] Erro ao salvar ${caminho}: ${e.message}`);
    }
}

// ── Canais ativados (persistido — fica ligado até desativar manualmente) ──

export function getCanais() {
    const data = lerJson(CANAIS_FILE, { canais: [] });
    return Array.isArray(data.canais) ? data.canais : [];
}

export function adicionarCanal(jid) {
    const data = lerJson(CANAIS_FILE, { canais: [] });
    if (!Array.isArray(data.canais)) data.canais = [];
    if (data.canais.includes(jid)) return false;
    data.canais.push(jid);
    salvarJson(CANAIS_FILE, data);
    return true;
}

export function removerCanal(jid) {
    const data = lerJson(CANAIS_FILE, { canais: [] });
    if (!Array.isArray(data.canais) || !data.canais.includes(jid)) return false;
    data.canais = data.canais.filter(c => c !== jid);
    salvarJson(CANAIS_FILE, data);
    return true;
}

// ── Helpers de fetch/parse (compatíveis com o formato usado no seu site) ──

async function buscarJson(url) {
    let res;
    try {
        res = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(20000)
        });
    } catch (e) {
        // "fetch failed" sozinho não diz nada — o motivo real (DNS, conexão
        // recusada/resetada, TLS, timeout, etc.) fica escondido dentro de
        // `e.cause`. Sem isso, é impossível saber se é o site que caiu, a
        // internet do servidor, DNS, etc. Agora isso aparece no log.
        const causa = e?.cause?.code || e?.cause?.message || e?.cause || e.message;
        throw new Error(`fetch falhou em ${url} — causa real: ${causa}`);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
    return res.json();
}

function extrairLista(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return data.works || data.docs || data.mangas || [];
    return [];
}

// ── Retry genérico com espera entre tentativas ────────────────────────
// Usado tanto pra buscar dados do site quanto pra enviar mensagem no
// WhatsApp. O motivo de existir: o bot às vezes derruba a conexão (erro
// 408) bem no meio de um ciclo e reinicia o processo inteiro uns
// segundos depois. Se uma chamada falhar por causa disso, meia chance é
// só um soluço passageiro — tentando de novo com um pequeno intervalo,
// muitas vezes dá certo antes mesmo do restart acontecer, em vez de já
// desistir/perder aquele aviso na primeira falha.
async function comRetry(fn, { tentativas = 2, delayMs = 1500, onFalha } = {}) {
    let ultimoErro;
    for (let i = 0; i <= tentativas; i++) {
        try {
            return await fn();
        } catch (e) {
            ultimoErro = e;
            if (onFalha) onFalha(e, i);
            if (i < tentativas) await new Promise(r => setTimeout(r, delayMs));
        }
    }
    throw ultimoErro;
}

function pegarId(w) { return w._id || w.id || ''; }
function pegarNome(w) { return w.name || w.title || 'Sem título'; }
function pegarCapa(w) { return (w.poster || {}).default_url || w.cover || w.image || ''; }

// ── Envio pra CANAL (newsletter) ──────────────────────────────────────
// BUG CONHECIDO do Baileys (issues #2199 e #2086 no repo oficial): mensagem
// de IMAGEM enviada pra canal/newsletter sobe com sucesso (não dá erro),
// mas a mídia nunca aparece no canal — só funciona em grupo/DM normal.
// Mensagem de TEXTO funciona normal em canal, e usando "link preview" a
// capa aparece do mesmo jeito, sem passar pelo upload de mídia quebrado.
//
// CAUSA DO BUG "capa não chega junto do texto": o getUrlInfo do Baileys faz
// o próprio fetch da imagem/página por baixo dos panos, SEM header de
// User-Agent de navegador. Vários sites (inclusive o manga-absoluto) tratam
// requisição sem User-Agent como bot e devolvem erro/bloqueio ou demoram
// demais e estouram o timeout — aí o preview falha silenciosamente e a
// mensagem cai sempre no fallback só-texto, mesmo com a capa existindo e
// sendo uma URL válida.
//
// Correção: baixamos a capa NÓS MESMOS com axios (com User-Agent de
// navegador) e convertemos pra JPEG com o jimp — daí montamos o
// linkPreview manualmente com esse jpegThumbnail, sem depender do fetch
// interno do getUrlInfo. Isso resolve tanto o bloqueio por User-Agent
// quanto capas que vêm em WebP/PNG (o WhatsApp só aceita JPEG no preview).
const TMP_CAPAS_DIR = './database/tmp_capas';
const DELAY_EXCLUSAO_CAPA_MS = 60 * 1000; // tempo de sobra antes de apagar o arquivo baixado

function garantirPastaTmp() {
    try {
        if (!fs.existsSync(TMP_CAPAS_DIR)) fs.mkdirSync(TMP_CAPAS_DIR, { recursive: true });
    } catch (e) {
        RedLog(`[MangaWatcher] Não consegui criar ${TMP_CAPAS_DIR}: ${e.message}`);
    }
}

// Apaga o arquivo temporário da capa depois de um tempo — dá folga o
// suficiente pra qualquer retry/reenvio ainda em andamento terminar de usar
// o arquivo antes dele sumir do disco.
function agendarExclusao(caminho, delayMs = DELAY_EXCLUSAO_CAPA_MS) {
    if (!caminho) return;
    setTimeout(() => {
        fs.unlink(caminho, (e) => {
            if (e && e.code !== 'ENOENT') {
                RedLog(`[MangaWatcher] Não consegui apagar capa temporária ${caminho}: ${e.message}`);
            }
        });
    }, delayMs);
}

// Baixa a capa, converte pra JPEG (ver comentário grande acima sobre o
// motivo) e SALVA em disco (pedido do usuário — assim o arquivo existe de
// verdade no `database/tmp_capas` em vez de só viver em memória), retornando
// tanto o buffer quanto o caminho, pra quem chamar decidir quando apagar.
async function baixarCapaComoJpeg(capaUrl, idParaNomeArquivo = 'capa') {
    if (!capaUrl) return { buffer: null, caminho: null };
    try {
        const resp = await axios.get(capaUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                Referer: SITE_BASE
            }
        });

        const imagem = await Jimp.read(Buffer.from(resp.data));

        // Reduz pra um tamanho de thumbnail (evita mandar a capa em
        // resolução cheia como "preview", o que deixaria a mensagem pesada).
        try {
            const largura = imagem.bitmap?.width;
            const altura = imagem.bitmap?.height;
            if (largura && altura && largura > 192) {
                imagem.resize(192, Math.round((altura / largura) * 192));
            }
        } catch (_) {
            // se o resize falhar por qualquer motivo, manda a imagem no
            // tamanho original — melhor isso do que não mandar capa nenhuma
        }
        try { imagem.quality(60); } catch (_) { /* método pode variar entre versões, ignora se não existir */ }

        const buffer = await imagem.getBuffer('image/jpeg');

        let caminho = null;
        try {
            garantirPastaTmp();
            caminho = `${TMP_CAPAS_DIR}/${idParaNomeArquivo}-${Date.now()}.jpg`;
            fs.writeFileSync(caminho, buffer);
        } catch (e) {
            RedLog(`[MangaWatcher] Baixei a capa mas não consegui salvar em disco (${e.message}) — seguindo só com o buffer em memória.`);
            caminho = null;
        }

        return { buffer, caminho };
    } catch (e) {
        RedLog(`[MangaWatcher] Não consegui baixar/converter a capa (${capaUrl}): ${e?.message || e}`);
        return { buffer: null, caminho: null };
    }
}

async function montarConteudoCanal(texto, link, nome, capa, idParaNomeArquivo) {
    // 1ª tentativa (principal): baixa a capa manualmente, salva em disco e
    // converte pra JPEG.
    const { buffer: jpegThumbnail, caminho: caminhoTemp } = await baixarCapaComoJpeg(capa, idParaNomeArquivo);
    if (jpegThumbnail) {
        return {
            conteudo: {
                text: texto,
                linkPreview: {
                    'canonical-url': link,
                    'matched-text': link,
                    title: nome,
                    jpegThumbnail
                }
            },
            caminhoTemp
        };
    }

    // 2ª tentativa (fallback): getUrlInfo do próprio Baileys, tentando a
    // página do mangá e depois a URL da capa direto — cobre o caso raro de
    // a capa falhar no download manual mas a página ter um og:image que o
    // getUrlInfo consiga puxar sozinho.
    for (const alvo of [link, capa].filter(Boolean)) {
        try {
            const preview = await getUrlInfo(alvo, {
                thumbnailWidth: 192,
                fetchOpts: { timeout: 10000 }
            });
            if (preview?.jpegThumbnail) {
                return {
                    conteudo: {
                        text: texto,
                        linkPreview: {
                            ...preview,
                            'matched-text': link,
                            title: nome || preview.title
                        }
                    },
                    caminhoTemp: null
                };
            }
        } catch (e) {
            RedLog(`[MangaWatcher] Não consegui gerar preview (${alvo}) pra "${nome}": ${e?.message || e}`);
        }
    }
    return { conteudo: { text: texto }, caminhoTemp: null }; // sem preview não é motivo pra falhar o envio todo
}

// ── Checagem principal ──
//
// BUG CORRIGIDO: antes, só os IDs que apareciam em /api/latest-releases
// NAQUELE ciclo específico (top 3) eram verificados. Isso quebrava a
// detecção automática assim: quando um título ainda não estava no state
// (nunca tinha sido visto antes) e subia pro topo JUNTO com o capítulo
// novo, o código tratava como "primeira vez que vejo esse título" — só
// gravava a contagem atual como base, SEM avisar (porque não tinha nada
// anterior pra comparar). Só que, na prática, era exatamente esse capítulo
// novo que deveria ter sido anunciado. Como o site tem vários mangás
// alternando no topo, isso fazia o automático quase nunca publicar nada.
//
// Correção: além de descobrir títulos novos via /api/latest-releases,
// TODO id que já está salvo no state continua sendo checado em todo ciclo,
// independente de estar ou não no "top 3" agora. Assim, a detecção de
// capítulo novo não depende mais do título estar no topo no instante exato
// do ciclo — uma vez conhecido, ele fica monitorado de verdade.
const MAX_IDS_POR_CICLO = 60; // trava de segurança pra não explodir requisições se o catálogo acompanhado crescer demais

// TRAVA CONTRA CICLOS SOBREPOSTOS — provável causa de "tem capítulo novo
// mas não publica": o ciclo agora revisita TODO título já conhecido (não só
// o top 3), o que pode facilmente passar de 10 segundos pra rodar se o
// catálogo acompanhado crescer (cada título = 1 requisição pro
// /api/manga/<id>). Sem essa trava, o setInterval dispara o próximo ciclo
// mesmo com o anterior ainda rodando — os dois leem o mesmo state.json no
// início, e o que terminar POR ÚLTIMO sobrescreve o arquivo, apagando
// silenciosamente qualquer atualização/anúncio que o outro ciclo já tinha
// feito. Isso não dá erro nenhum, só faz o aviso "sumir".
let cicloEmAndamento = false;

async function checarAtualizacoes(columbina, quantidade = QTD_MONITORADA_PADRAO) {
    if (cicloEmAndamento) {
        RedLog('[MangaWatcher] Ciclo anterior ainda rodando (provavelmente demorando mais que 10s) — pulando esse tick pra não sobrepor.');
        return;
    }
    cicloEmAndamento = true;
    try {
        await executarCicloDeChecagem(columbina, quantidade);
    } finally {
        cicloEmAndamento = false;
    }
}

async function executarCicloDeChecagem(columbina, quantidade) {
    const canais = getCanais();
    if (!canais.length) {
        RedLog('[MangaWatcher] Nenhum canal ativado (.canalmanga on) — automático não vai publicar nada até ativar um canal.');
        return;
    }

    const state = lerJson(STATE_FILE, {});

    // 1) Descobre lançamentos recentes no site (pega títulos NOVOS que ainda
    // não estão sendo acompanhados, e também os nomes/dados mais frescos dos
    // que já são).
    let listaRecente = [];
    try {
        const dataLatest = await comRetry(
            () => buscarJson(`${SITE_BASE}/api/latest-releases`),
            { tentativas: 2, delayMs: 2000 }
        );
        listaRecente = extrairLista(dataLatest).slice(0, quantidade);
    } catch (e) {
        RedLog(`[MangaWatcher] Erro ao buscar lançamentos (após retry): ${e.message}`);
        // mesmo se isso falhar, ainda vale a pena continuar e checar os IDs
        // que já são conhecidos do state — não faz `return` aqui de propósito
    }

    // 2) Monta o conjunto de IDs a checar nesse ciclo: os recentes do site
    // + TODOS os que já estão sendo acompanhados (é essa parte que corrige
    // o bug — ver comentário acima).
    const idsParaChecar = new Map(); // id -> nome (fallback pra log, se o /api/manga/<id> falhar)
    for (const w of listaRecente) {
        const id = pegarId(w);
        if (id) idsParaChecar.set(id, pegarNome(w));
    }
    for (const id of Object.keys(state)) {
        if (!idsParaChecar.has(id)) idsParaChecar.set(id, state[id]?.nome || 'Sem título');
    }

    if (idsParaChecar.size > MAX_IDS_POR_CICLO) {
        RedLog(`[MangaWatcher] Acompanhando ${idsParaChecar.size} títulos, acima do limite de segurança (${MAX_IDS_POR_CICLO}) — considere rodar ${'`'}.canalmanga recalibrar${'`'} ou revisar o STATE_FILE.`);
    }

    let falhas = 0;
    let primeiraChamada = true;

    for (const [id, nomeFallback] of idsParaChecar) {
        // pequeno respiro entre as chamadas — bater no /api/manga/<id> de
        // vários títulos em sequência sem pausa nenhuma, a cada 10s, é o
        // tipo de padrão que APIs (principalmente em Vercel free tier)
        // costumam começar a limitar/bloquear (429), o que faria TODO
        // detalhe falhar silenciosamente e nada nunca ser publicado.
        if (!primeiraChamada) await new Promise(r => setTimeout(r, 300));
        primeiraChamada = false;

        let detalhe;
        try {
            detalhe = await comRetry(
                () => buscarJson(`${SITE_BASE}/api/manga/${id}`),
                { tentativas: 2, delayMs: 1500 }
            );
        } catch (e) {
            falhas++;
            RedLog(`[MangaWatcher] Erro ao buscar detalhes de "${nomeFallback}" (após retries): ${e.message}`);
            continue; // pula esse mangá nesse ciclo, tenta de novo no próximo
        }

        const nome = pegarNome(detalhe) || nomeFallback;

        // IMPORTANTE: a contagem que vem de /api/latest-releases é limitada/
        // truncada (ex.: sempre mostra no máximo os últimos capítulos daquela
        // listagem), então NÃO é confiável pra detectar capítulo novo — por
        // isso a comparação usa sempre a contagem REAL vinda de
        // /api/manga/<id>.
        const capitulosDetalhe = Array.isArray(detalhe.chapters) ? detalhe.chapters : [];
        const contagemAtual = detalhe.chaptersCount || capitulosDetalhe.length || 0;

        const anterior = state[id];

        if (!anterior) {
            state[id] = { nome, contagem: contagemAtual };
            salvarJson(STATE_FILE, state); // salva já — ver comentário abaixo
            continue;
        }

        if (contagemAtual > anterior.contagem) {
            // IMPORTANTE: atualiza e SALVA o state ANTES de anunciar, não
            // depois. Se salvássemos só depois de enviar (ou só no fim do
            // ciclo inteiro, como era antes), um crash/restart do processo
            // bem no meio do envio faria o bot "esquecer" que esse capítulo
            // já tinha sido avisado, e ele seria reenviado no próximo boot
            // — foi exatamente esse o bug relatado (mesmo manhwa repetindo
            // os mesmos capítulos várias vezes). Marcar como "já sabido"
            // antes de enviar significa que, na pior das hipóteses, um
            // crash no meio do envio faz o bot pular esse aviso (melhor do
            // que duplicar spam no canal).
            state[id] = { nome, contagem: contagemAtual };
            salvarJson(STATE_FILE, state);

            await anunciarNovosCapitulos({
                columbina, id, nome, canais,
                contagemAnterior: anterior.contagem,
                contagemAtual,
                detalhe // já buscado acima, evita bater na API duas vezes
            });
        }
    }

    // Se MUITAS chamadas falharam nesse ciclo, é sinal forte de que o site
    // está bloqueando/limitando o bot (ou está fora do ar) — isso explica
    // "tem capítulo novo mas não publica" sem nenhum erro óbvio aparecer,
    // porque cada falha individual só loga em vermelho e segue o ciclo.
    if (falhas > 0 && falhas >= idsParaChecar.size / 2) {
        RedLog(`[MangaWatcher] ${falhas}/${idsParaChecar.size} títulos falharam ao buscar detalhes nesse ciclo — se isso persistir, o site pode estar bloqueando/limitando as requisições (considere aumentar o intervalo).`);
    }
}

async function anunciarNovosCapitulos({ columbina, id, nome, canais, contagemAnterior, contagemAtual, detalhe }) {
    if (!detalhe) {
        try {
            detalhe = await buscarJson(`${SITE_BASE}/api/manga/${id}`);
        } catch (e) {
            RedLog(`[MangaWatcher] Erro ao buscar detalhes de "${nome}": ${e.message}`);
            return;
        }
    }

    const capa = detalhe.cover || pegarCapa(detalhe) || '';
    const descricao = (detalhe.description || '').trim();
    const descricaoCurta = descricao.length > 300 ? descricao.slice(0, 300).trim() + '…' : descricao;
    const capitulos = Array.isArray(detalhe.chapters) ? detalhe.chapters : [];

    // O array "chapters" retornado por /api/manga/<id> não é confiável pra
    // achar o capítulo mais recente (pode vir truncado/fora de ordem).
    // Em vez disso, usamos a CONTAGEM TOTAL de capítulos como "número do
    // capítulo mais recente" — se o mangá tem 127 capítulos, mostra 127.
    const numeroMaisRecente = detalhe.chaptersCount || capitulos.length || contagemAtual;
    const link = `${SITE_BASE}/work/${id}`;

    // se a contagem aumentou mais de 1 desde a última checagem, avisa cada
    // capítulo numerado individualmente (127, 128, 129...); senão manda só um aviso.
    // LIMITE DE SEGURANÇA: se o salto for grande demais (ex.: bot ficou off
    // por um tempo, ou o baseline salvo estava desatualizado/incorreto),
    // NÃO manda uma mensagem por capítulo — isso viraria spam gigante no
    // canal. Em vez disso, manda um único aviso consolidado.
    const LIMITE_AVISOS_INDIVIDUAIS = 5;
    const qtdNovos = Math.max(1, contagemAtual - contagemAnterior);

    let mensagens; // array de { numero: string, texto: string }
    if (qtdNovos > LIMITE_AVISOS_INDIVIDUAIS) {
        const primeiro = numeroMaisRecente - qtdNovos + 1;
        mensagens = [{
            texto:
                `📖 *VÁRIOS CAPÍTULOS NOVOS!*\n\n` +
                `🏷️ *${nome}*\n` +
                `📄 Capítulos *${primeiro}* até *${numeroMaisRecente}*\n` +
                (descricaoCurta ? `\n📝 ${descricaoCurta}\n` : '') +
                `\n🔗 Leia agora: ${link}`
        }];
    } else {
        const numerosNovos = [];
        for (let i = qtdNovos - 1; i >= 0; i--) {
            const n = numeroMaisRecente - i;
            if (n > 0) numerosNovos.push(n);
        }
        mensagens = numerosNovos.map(numero => ({
            texto:
                `📖 *NOVO CAPÍTULO DISPONÍVEL!*\n\n` +
                `🏷️ *${nome}*\n` +
                `📄 Capítulo *${numero}*\n` +
                (descricaoCurta ? `\n📝 ${descricaoCurta}\n` : '') +
                `\n🔗 Leia agora: ${link}`
        }));
    }

    let enviosOk = 0, enviosErro = 0;
    for (const { texto } of mensagens) {
        const { conteudo, caminhoTemp } = await montarConteudoCanal(texto, link, nome, capa, id);
        for (const canalJid of canais) {
            // se o socket já está claramente fechado, nem tenta — evita
            // esperar os 2 retries à toa sabendo que vai falhar de novo.
            if (columbina?.ws?.readyState === 3 /* CLOSED */) {
                enviosErro++;
                RedLog(`[MangaWatcher] Conexão fechada, pulando envio de "${nome}" pro canal ${canalJid} (o estado já foi salvo como avisado, então esse envio específico não vai ser reenviado automaticamente — é o preço de evitar duplicar mensagem; se isso acontecer com frequência, considere aumentar o INTERVALO_MS).`);
                continue;
            }
            try {
                // retry: se a conexão estiver instável (ex.: prestes a cair
                // com erro 408), uma segunda tentativa alguns segundos
                // depois frequentemente já pega a reconexão funcionando, em
                // vez de perder o aviso de vez.
                //
                // CORREÇÃO: "diz que enviou mas não chega" — o Baileys às
                // vezes RESOLVE a promise do sendMessage (sem lançar erro)
                // mesmo quando a mensagem não foi de fato confirmada pelo
                // servidor (comum bem no meio de uma reconexão instável).
                // Antes o código só olhava se deu exceção ou não; agora
                // exige que o retorno tenha um `key.id` válido — se vier
                // vazio/undefined, trata como falha e entra no retry, em
                // vez de contar como sucesso só porque não explodiu.
                const resultado = await comRetry(
                    async () => {
                        const r = await columbina.sendMessage(canalJid, conteudo);
                        if (!r?.key?.id) throw new Error('sendMessage retornou sem confirmação (key.id vazio) — provável falha silenciosa de conexão');
                        return r;
                    },
                    {
                        tentativas: 2,
                        delayMs: 2000,
                        onFalha: (e, tentativa) => RedLog(`[MangaWatcher] Falha ao postar "${nome}" no canal ${canalJid} (tentativa ${tentativa + 1}): ${e?.message || e}`)
                    }
                );
                enviosOk++;
            } catch (e) {
                enviosErro++;
                RedLog(`[MangaWatcher] Erro ao postar "${nome}" no canal ${canalJid} (desistindo após retries): ${e?.message || e}`);
            }

            // respiro entre cada CANAL, não só entre capítulos — mandar várias
            // mensagens em rajada pro socket do WhatsApp é um padrão que pode
            // contribuir pra conexão cair (erro 408) no meio do ciclo.
            if (canalJid !== canais[canais.length - 1]) {
                await new Promise(r => setTimeout(r, 1200));
            }
        }

        // apaga a capa baixada em disco depois de um tempo — dá folga pros
        // retries acima (e pra qualquer outra tentativa em paralelo) ainda
        // conseguirem usar o arquivo antes dele ser removido.
        agendarExclusao(caminhoTemp);

        await new Promise(r => setTimeout(r, 2000)); // respiro entre mensagens/capítulos
    }

    // O log de "sucesso" antes disparava mesmo quando TODO envio falhava
    // (o erro só ia pro catch, mas o Cyan log de baixo rodava do mesmo jeito
    // sem checar nada). Agora só fala que anunciou se pelo menos um envio
    // realmente deu certo, e avisa em vermelho se todos falharam — isso é o
    // sinal de que o ID do canal salvo pode estar errado/desatualizado.
    if (enviosOk > 0) {
        CyanLog(`📖 [MangaWatcher] "${nome}" — capítulo(s) ${contagemAnterior + 1}${qtdNovos > 1 ? `–${contagemAtual}` : ''} anunciado(s): ${enviosOk} envio(s) ok${enviosErro ? `, ${enviosErro} falha(s)` : ''}`);
    } else {
        RedLog(`📖 [MangaWatcher] "${nome}" — NENHUM envio deu certo (${canais.length} canal(is) configurado(s)). Confira o ID salvo com .canalmanga listar — o canal pode ter mudado ou o ID estar errado.`);
    }
}

// ── Postar manualmente no(s) canal(is) ativado(s) (.canalmanga postar) ──
// Igual ao testar, mas manda pros CANAIS ativados (não pro chat atual) e
// não interfere no mangaCapitulosState.json — pode rodar quantas vezes
// quiser, os capítulos podem até repetir se você mandar de novo.
export async function postarUltimosLancamentos({ columbina, quantidade = 3 }) {
    const canais = getCanais();
    if (!canais.length) return { enviados: 0, falhas: 0, canais: 0, total: 0 };

    const dataLatest = await buscarJson(`${SITE_BASE}/api/latest-releases`);
    const lista = extrairLista(dataLatest).slice(0, quantidade);
    if (!lista.length) return { enviados: 0, falhas: 0, canais: canais.length, total: 0 };

    let enviados = 0, falhas = 0;
    for (const w of lista) {
        const id = pegarId(w);
        const nome = pegarNome(w);
        if (!id) continue;

        try {
            const detalhe = await buscarJson(`${SITE_BASE}/api/manga/${id}`);
            const capa = detalhe.cover || pegarCapa(detalhe) || '';
            const descricao = (detalhe.description || '').trim();
            const descricaoCurta = descricao.length > 300 ? descricao.slice(0, 300).trim() + '…' : descricao;
            const capitulos = Array.isArray(detalhe.chapters) ? detalhe.chapters : [];
            const numero = detalhe.chaptersCount || capitulos.length || w.chapters_count || w.chaptersCount || '?';
            const link = `${SITE_BASE}/work/${id}`;

            const texto =
                `📖 *LANÇAMENTO EM DESTAQUE*\n\n` +
                `🏷️ *${nome}*\n` +
                `📄 Capítulo *${numero}*\n` +
                (descricaoCurta ? `\n📝 ${descricaoCurta}\n` : '') +
                `\n🔗 Leia agora: ${link}`;

            for (const canalJid of canais) {
                try {
                    const { conteudo, caminhoTemp } = await montarConteudoCanal(texto, link, nome, capa, id);
                    const r = await columbina.sendMessage(canalJid, conteudo);
                    if (!r?.key?.id) throw new Error('sendMessage retornou sem confirmação (key.id vazio)');
                    agendarExclusao(caminhoTemp);
                    enviados++;
                } catch (e) {
                    falhas++;
                    RedLog(`[MangaWatcher] Erro ao postar "${nome}" no canal ${canalJid}: ${e?.message || e}`);
                }
            }
        } catch (e) {
            RedLog(`[MangaWatcher] Erro ao buscar detalhes de "${nome}" pra postar: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 1500));
    }
    return { enviados, falhas, canais: canais.length, total: lista.length };
}

// ── Recalibrar o estado salvo, SEM anunciar nada (.canalmanga recalibrar) ──
// Usa isso quando o baseline salvo tiver ficado desatualizado/errado (como
// aconteceu com o bug antigo da contagem capada) — em vez de deixar o
// automático "descobrir" isso aos poucos e ficar mandando enxurrada de
// avisos ciclo após ciclo, essa função sincroniza tudo de uma vez, quieto.
export async function recalibrarEstado() {
    const state = lerJson(STATE_FILE, {});
    const ids = Object.keys(state);
    let atualizados = 0, erros = 0;

    for (const id of ids) {
        try {
            const detalhe = await buscarJson(`${SITE_BASE}/api/manga/${id}`);
            const capitulos = Array.isArray(detalhe.chapters) ? detalhe.chapters : [];
            const contagemReal = detalhe.chaptersCount || capitulos.length;
            if (typeof contagemReal === 'number' && contagemReal !== state[id].contagem) {
                state[id].contagem = contagemReal;
                atualizados++;
            }
        } catch (e) {
            erros++;
        }
        await new Promise(r => setTimeout(r, 250));
    }

    salvarJson(STATE_FILE, state);
    return { total: ids.length, atualizados, erros };
}

// ── Trava de instância única (lockfile com PID) ──────────────────────
// BUG CORRIGIDO: "mesmo manhwa/mesmos capítulos repetindo várias vezes,
// espaçados por minutos (não por 10s)". Causa raiz: se o processo do bot
// reinicia (crash, redeploy, `.canalmanga` sendo chamado num 2º processo
// que ficou vivo, etc.) DEPOIS de já ter enviado um anúncio mas ANTES de
// salvar o mangaCapitulosState.json no fim do ciclo, o capítulo enviado
// nunca fica registrado como "já avisado" — no próximo boot o state ainda
// mostra a contagem antiga e o mesmo aviso é reenviado. Isso é agravado
// se por acidente existirem DOIS processos do bot rodando ao mesmo tempo
// (cada um com seu próprio `cicloEmAndamento` em memória, que não protege
// contra outro processo).
//
// Correção: (1) o estado agora é salvo IMEDIATAMENTE depois de cada
// título processado, não só uma vez no fim do ciclo inteiro — isso fecha
// a janela de "enviei mas não salvei" (ver executarCicloDeChecagem).
// (2) essa trava de lockfile garante que só UM processo por vez rode o
// monitor: ao iniciar, grava o próprio PID em LOCK_FILE; se já existir um
// lock de um PID que ainda está vivo, esse processo NÃO inicia um segundo
// monitor (evita ciclos duplicados/concorrentes gerando envios repetidos).
function pidVivo(pid) {
    try {
        process.kill(pid, 0); // não mata, só testa se o processo existe
        return true;
    } catch (_) {
        return false;
    }
}

function adquirirLockDeInstancia() {
    try {
        if (fs.existsSync(LOCK_FILE)) {
            const conteudo = fs.readFileSync(LOCK_FILE, 'utf-8').trim();
            const pidAntigo = parseInt(conteudo, 10);
            if (pidAntigo && pidAntigo !== process.pid && pidVivo(pidAntigo)) {
                return false; // outro processo já está rodando o monitor
            }
        }
        fs.writeFileSync(LOCK_FILE, String(process.pid));
        return true;
    } catch (e) {
        RedLog(`[MangaWatcher] Não consegui gerenciar o lockfile (${e.message}) — seguindo mesmo assim.`);
        return true; // não trava o bot inteiro por causa disso
    }
}

// Chame isso UMA VEZ, depois que a conexão com o WhatsApp já estiver pronta.
export function iniciarMonitorManga(columbina) {
    if (!adquirirLockDeInstancia()) {
        RedLog('[MangaWatcher] Já existe outro processo rodando o monitor de mangá (mesmo LOCK_FILE) — este processo NÃO vai iniciar um segundo monitor, pra evitar avisos duplicados. Se isso for um lock "preso" de um processo morto, apague o database/mangaWatcher.lock e reinicie o bot.');
        return;
    }

    CyanLog('📖 Monitor de mangá/manhwa iniciado (checagem a cada 10 segundos)');
    checarAtualizacoes(columbina).catch(e => RedLog(`[MangaWatcher] ${e.message}`));
    setInterval(() => {
        checarAtualizacoes(columbina).catch(e => RedLog(`[MangaWatcher] ${e.message}`));
    }, INTERVALO_MS);
}

// ── Teste manual (.canalmanga testar) ──
// Busca os N lançamentos mais recentes e manda direto pro chat informado
// (não precisa ter canal ativado). NÃO mexe no mangaCapitulosState.json,
// então não interfere na detecção automática de capítulo novo.
export async function testarUltimosLancamentos({ columbina, from, quantidade = 3 }) {
    const dataLatest = await buscarJson(`${SITE_BASE}/api/latest-releases`);
    const lista = extrairLista(dataLatest).slice(0, quantidade);
    if (!lista.length) return 0;

    let enviados = 0;
    for (const w of lista) {
        const id = pegarId(w);
        const nome = pegarNome(w);
        if (!id) continue;

        try {
            const detalhe = await buscarJson(`${SITE_BASE}/api/manga/${id}`);
            const capa = detalhe.cover || pegarCapa(detalhe) || '';
            const descricao = (detalhe.description || '').trim();
            const descricaoCurta = descricao.length > 300 ? descricao.slice(0, 300).trim() + '…' : descricao;
            const capitulos = Array.isArray(detalhe.chapters) ? detalhe.chapters : [];
            // usa a contagem total de capítulos (mais confiável que tentar
            // achar o "último" dentro do array de chapters)
            const numero = detalhe.chaptersCount || capitulos.length || w.chapters_count || w.chaptersCount || '?';
            const link = `${SITE_BASE}/work/${id}`;

            const texto =
                `🧪 *TESTE — ÚLTIMO LANÇAMENTO*\n\n` +
                `🏷️ *${nome}*\n` +
                `📄 Capítulo *${numero}*\n` +
                (descricaoCurta ? `\n📝 ${descricaoCurta}\n` : '') +
                `\n🔗 Leia agora: ${link}`;

            if (capa) {
                await columbina.sendMessage(from, { image: { url: capa }, caption: texto });
            } else {
                await columbina.sendMessage(from, { text: texto });
            }
            enviados++;
        } catch (e) {
            RedLog(`[MangaWatcher] Erro no teste de "${nome}": ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 1500));
    }
    return enviados;
}
