/*   ⚠ ANTES DE TUDO QUERO QUE LEMBRE QUE NAO DEIXO DAREM CONTINUIDADE NA COLUMBINA NEM NA HIYUKI, POIS A COLUMBINA É MINHA BOT ATUAL QUE JÁ ESTÁ NA V2 QUE INCLUSIVE ESSA É A VERSÃO BASE DELA. JÁ A HIYUKI É OUTRA BOT MINHA QUE USEI PRA TEMA DA BASE E PRETENDO DAR CONTINUIDADE POR EU MESMO! ENTÃO USE A BASE PARA FAZER SEU PRÓPRIO BOT COM SEU PRÓPRIO TEMA. ⚠️

            HIYUKI SUPREME V1 

[=====/=====/=====/=====/=====/=====/=====/]
Uma base de bot criada totalmente do zero por mim, MisheruModz</>, focada em desempenho, organizacao e facilidade na criacao de comandos via plugins.

A estrutura foi desenvolvida para deixar tudo mais simples e pratico, permitindo adicionar novas funcoes sem baguncar o sistema. Cada comando funciona em modulos/plugins independentes, deixando a base mais limpa, rapida e facil de editar.

Uma base feita para quem quer criar e evoluir sua bot sem complicacao.

Tudo que peço é que deixem os direitos autorais da base usada na criação do seu/sua bot e o devido criador da base vulgo MisheruModz</>

Criador: MisheruModz</>
Numero: +55 12 98804-7370

Faça um bom proveito da base 😉🌸
[=====/=====/=====/=====/=====/=====/=====/]
*/

import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import readline from 'readline';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import colors from 'colors';
import moment from 'moment';
import { CyanLog, GreenLog, RedLog, MagentaLog } from './arquivos/js/logger.js';
import { fileURLToPath } from 'url';
import qrcode from 'qrcode-terminal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const msgRetryCounterCache = new NodeCache();
const groupCache = new NodeCache({ stdTTL: 300, useClones: false });
const AUTH_DIR = './database/Hiyuki-QR';

if (!fs.existsSync('./temp')) fs.mkdirSync('./temp', { recursive: true });
if (!fs.existsSync('./database/users')) fs.mkdirSync('./database/users', { recursive: true });
if (!fs.existsSync('./arquivos/json')) fs.mkdirSync('./arquivos/json', { recursive: true });
if (!fs.existsSync('./plugins')) {
for (const cat of ['admin', 'dono', 'cmds-aleatorios', 'resenha', 'downloads', 'efeitos', 'midias', 'inteligencia-ia', 'rpg', 'premium', 'menu']) {
fs.mkdirSync(`./plugins/${cat}`, { recursive: true });
}
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

let isReconnecting = false;
let reconnectTimer = null;

async function verificarAgendamentos(conn) {
try {
const AGENDAMENTOS_FILE = './database/agendamentos.json';
if (!fs.existsSync(AGENDAMENTOS_FILE)) return;

const data = fs.readFileSync(AGENDAMENTOS_FILE);
const agendamentos = JSON.parse(data);
const agora = new Date();
let alterado = false;
const TRANSMISSAO_FILE = './database/transmissao.json';

for (const agend of agendamentos) {
if (agend.tipo === 'sempre') {
if (!fs.existsSync(TRANSMISSAO_FILE)) continue;
const transmissao = JSON.parse(fs.readFileSync(TRANSMISSAO_FILE));
for (const grupoId of transmissao.grupos) {
try {
await conn.sendMessage(grupoId, { text: agend.mensagem });
} catch(e) {}
}
for (const numero of transmissao.numeros) {
try {
await conn.sendMessage(numero, { text: agend.mensagem });
} catch(e) {}
}
continue;
}

if (agend.tipo === 'agendado' && !agend.enviado) {
const dataAgend = new Date(agend.data);
if (dataAgend <= agora) {
if (!fs.existsSync(TRANSMISSAO_FILE)) continue;
const transmissao = JSON.parse(fs.readFileSync(TRANSMISSAO_FILE));
for (const grupoId of transmissao.grupos) {
try {
await conn.sendMessage(grupoId, { text: agend.mensagem });
} catch(e) {}
}
for (const numero of transmissao.numeros) {
try {
await conn.sendMessage(numero, { text: agend.mensagem });
} catch(e) {}
}
agend.enviado = true;
alterado = true;
}
}
}

if (alterado) {
fs.writeFileSync(AGENDAMENTOS_FILE, JSON.stringify(agendamentos, null, 2));
}
} catch (e) {
console.error('Erro ao verificar agendamentos:', e);
}
}

async function startConnection(NucleoDeCmds, config) {

if (isReconnecting) {
CyanLog('🌸❄️Reconexão já em andamento, aguarde...');
return null;
}

isReconnecting = true;

const usePairingCode = process.argv.includes('--code');
const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
const { version } = await fetchLatestBaileysVersion();
const logger = pino({ level: 'silent' });

const columbina = makeWASocket({
version, logger,
auth: {
creds: state.creds,
keys: makeCacheableSignalKeyStore(state.keys, logger)
},
printQRInTerminal: !usePairingCode,
browser: Browsers.windows('Chrome'),
msgRetryCounterCache,
connectTimeoutMs: 60000,
defaultQueryTimeoutMs: 0,
keepAliveIntervalMs: 10000,
emitOwnEvents: true,
fireInitQueries: false,
generateHighQualityLinkPreview: true,
markOnlineOnConnect: true,
syncFullHistory: false,
cachedGroupMetadata: async (jid) => groupCache.get(jid),
getMessage: async (key) => {
return undefined;
}
});

if (usePairingCode && !state.creds.registered) {
let phoneNumber = await question('Digite o numero do WhatsApp no qual vc conectará a bot (com DDD, ex: 5512988047370):');
phoneNumber = phoneNumber.replace(/\D/g, '');
if (!phoneNumber || phoneNumber.length < 12) {
console.log(colors.red('Numero invalido! Use formato tipo: 5512988047370'));
process.exit(0);
}
console.log(colors.yellow(`Solicitando codigo para: ${phoneNumber}`));
let code = await columbina.requestPairingCode(phoneNumber);
code = code?.match(/.{1,4}/g)?.join('-') || code;
console.log(colors.green(`Codigo de pareamento: ${code}`));
rl.close();
}

columbina.ev.on('creds.update', saveCreds);

columbina.ev.on('connection.update', async (update) => {
const { connection, lastDisconnect, qr } = update;
if (qr && !usePairingCode) {
console.log(colors.yellow('QR Code gerado, escaneie com o WhatsApp:'));
qrcode.generate(qr, { small: true });
}

if (connection === 'open') {
GreenLog(`✅ ${config.NomeDoBot} conectado com sucesso!`);
const botNumber = columbina.user.id.split(':')[0];
GreenLog(`📱 Bot Numero: ${botNumber}`);

if (!fs.existsSync('./arquivos/json/welkon.json')) {
fs.writeFileSync('./arquivos/json/welkon.json', JSON.stringify([]));
}
if (!fs.existsSync('./arquivos/json/legendas.json')) {
fs.writeFileSync('./arquivos/json/legendas.json', JSON.stringify({}));
}

await verificarAgendamentos(columbina);

setInterval(() => verificarAgendamentos(columbina), 60000);

isReconnecting = false;
if (reconnectTimer) {
clearTimeout(reconnectTimer);
reconnectTimer = null;
}
}

if (connection === 'close') {
const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
RedLog(`Conexao fechada - Codigo: ${statusCode}`);

if (statusCode !== DisconnectReason.loggedOut) {
RedLog('🌸 Reiniciando a Hiyuki Supreme em 3 segundos devido a falha na conexao... 🔄');

try {
const donoJid = config.NumeroDoDono?.replace(/\D/g, '') + '@s.whatsapp.net';
await columbina.sendMessage(donoJid, {text: `⚠️ *HIYUKI SUPREME REINICIANDO*

Motivo: Conexao fechada (codigo ${statusCode})
⏰ A Hiyuki sera reiniciada automaticamente em 3 segundos.`
}).catch(() => {});
} catch(e) {}

if (reconnectTimer) clearTimeout(reconnectTimer);

reconnectTimer = setTimeout(() => {
CyanLog('🌸🧧Encerrando processo para reiniciar completamente...');
process.exit(0);
}, 3000);
} else {
RedLog('🌸🧊 Sessao expirada! Exclua a pasta Hiyuki-QR e reinicie a Hiyuki manualmente.');
RedLog('❄️Reiniciando para gerar novo QR Code em 5 segundos...');

if (reconnectTimer) clearTimeout(reconnectTimer);
reconnectTimer = setTimeout(() => {
process.exit(0);
}, 5000);
}
}
});

columbina.ev.on('group-participants.update', async (update) => {
const { id, participants, action } = update;

if (!fs.existsSync('./arquivos/json/welkon.json')) return;
const welcomeGroups = JSON.parse(fs.readFileSync('./arquivos/json/welkon.json'));
if (!welcomeGroups.includes(id)) return;

if (participants[0] === columbina.user.id?.split(':')[0]) return;

let groupMetadata;
try {
groupMetadata = await columbina.groupMetadata(id);
} catch (e) { return; }

const legendasPath = './arquivos/json/legendas.json';

let legendas = {};
if (fs.existsSync(legendasPath)) {
legendas = JSON.parse(fs.readFileSync(legendasPath));
}

const legenda = legendas[id] || 'Bem-vindo(a) ao grupo!';

const part = participants[0];
const jid = part?.phoneNumber || part?.id || part?.jid;
if (!jid) return;
const numeroParticipante = jid.split("@")[0];

if (action === 'add') {
await columbina.sendMessage(id, {
image: { url: 'https://files.catbox.moe/mjxxwp.jpeg' },
caption: `╭᯽༊·˚༊·˚˚₊‧꒰ა ᯽ ໒꒱ ‧₊˚˚༊·˚༊᯽╮
            𝗕𝗲𝗺-𝘃𝗶𝗻𝗱𝗼(𝗮):
@${numeroParticipante}!

*Legenda:* ${legenda}

╰᯽༊·˚༊·˚˚₊‧꒰ა ᯽ ໒꒱ ‧₊˚˚༊·˚༊᯽╯`,
mentions: [jid]
});
} else if (action === 'remove') {
await columbina.sendMessage(id, {
image: { url: 'https://files.catbox.moe/9i38ij.jpeg' },
caption: `╭᯽༊·˚༊·˚˚₊‧꒰ა ᯽ ໒꒱ ‧₊˚˚༊·˚༊᯽╮
            *SAYŌNARA*
@${numeroParticipante}

╰᯽༊·˚༊·˚˚₊‧꒰ა ᯽ ໒꒱ ‧₊˚˚༊·˚༊᯽╯`,
mentions: [jid]
});
}
});

isReconnecting = false;
return columbina;
}

export default startConnection;