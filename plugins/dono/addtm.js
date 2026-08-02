import fs from 'fs';
import path from 'path';

const TRANSMISSAO_FILE = './database/transmissao.json';

function carregarTransmissao() {
try {
if (fs.existsSync(TRANSMISSAO_FILE)) {
const data = fs.readFileSync(TRANSMISSAO_FILE);
return JSON.parse(data);
}
} catch (e) {
console.error('Erro ao carregar transmissao.json:', e);
}
return { grupos: [], numeros: [] };
}

function salvarTransmissao(data) {
try {
const dir = path.dirname(TRANSMISSAO_FILE);
if (!fs.existsSync(dir)) {
fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(TRANSMISSAO_FILE, JSON.stringify(data, null, 2));
return true;
} catch (e) {
console.error('Erro ao salvar transmissao.json:', e);
return false;
}
}

export default {
name: 'addtm',
description: 'Adiciona um grupo ou número na lista de transmissão',
category: 'dono',
aliases: ['addtransmissao', 'addtransm'],
async execute({ columbina, from, args, reply, isDono, sender, q }) {
if (!isDono()) return reply('❌ Apenas o dono pode usar este comando!');

const target = q.trim();

if (!target) {
return reply(`❌ *Uso correto:*

📌 Para adicionar um GRUPO:
\`addtm ID_DO_GRUPO\`

📌 Para adicionar um NÚMERO:
\`addtm NUMERO_SEM_+_E_SEM_-\``);
}

const transmissao = carregarTransmissao();
let adicionado = false;
let tipo = '';

if (target.includes('@g.us') || target.startsWith('120363')) {
if (!transmissao.grupos.includes(target)) {
try {
const groups = await columbina.groupFetchAllParticipating();
const groupExists = Object.values(groups).some(g => g.id === target);

if (!groupExists) {
return reply(`❌ A bot não está presente no grupo com ID: ${target}

Use \`listgp\` para ver os grupos disponíveis.`);
}

transmissao.grupos.push(target);
salvarTransmissao(transmissao);
adicionado = true;
tipo = 'grupo';
} catch (e) {
return reply(`❌ Erro ao verificar grupo: ${e.message}`);
}
} else {
return reply(`⚠️ O grupo \`${target}\` já está na lista de transmissão.`);
}
} else {
let numero = target.replace(/[^0-9]/g, '');

if (numero.length < 10) {
return reply(`❌ Número inválido! Use o formato: 5512988047370 (sem + e sem -)`);
}

let numeroJid = numero;
if (!numeroJid.includes('@')) {
numeroJid = `${numero}@s.whatsapp.net`;
}

if (!transmissao.numeros.includes(numeroJid)) {
transmissao.numeros.push(numeroJid);
salvarTransmissao(transmissao);
adicionado = true;
tipo = 'número';
} else {
return reply(`⚠️ O número \`${numero}\` já está na lista de transmissão.`);
}
}

if (adicionado) {
const totalGrupos = transmissao.grupos.length;
const totalNumeros = transmissao.numeros.length;

const mensagem = `✅ *${tipo.charAt(0).toUpperCase() + tipo.slice(1)} adicionado à transmissão!*

📌 *Adicionado:* \`${target}\`
━━━━━━━━━━━━━━━━━━
📊 *Status da Transmissão:*
🔹 Grupos: ${totalGrupos}
🔹 Números: ${totalNumeros}
🔹 Total: ${totalGrupos + totalNumeros}`;

await reply(mensagem, from);
}
}
};