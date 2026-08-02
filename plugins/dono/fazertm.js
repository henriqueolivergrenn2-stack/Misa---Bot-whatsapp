import fs from 'fs';
import path from 'path';
import moment from 'moment';

const TRANSMISSAO_FILE = './database/transmissao.json';
const AGENDAMENTOS_FILE = './database/agendamentos.json';

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

function carregarAgendamentos() {
try {
if (fs.existsSync(AGENDAMENTOS_FILE)) {
const data = fs.readFileSync(AGENDAMENTOS_FILE);
return JSON.parse(data);
}
} catch (e) {
console.error('Erro ao carregar agendamentos.json:', e);
}
return [];
}

function salvarAgendamentos(agendamentos) {
try {
const dir = path.dirname(AGENDAMENTOS_FILE);
if (!fs.existsSync(dir)) {
fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(AGENDAMENTOS_FILE, JSON.stringify(agendamentos, null, 2));
return true;
} catch (e) {
console.error('Erro ao salvar agendamentos.json:', e);
return false;
}
}

async function enviarTransmissao(columbina, mensagem) {
const transmissao = carregarTransmissao();
const resultados = {
enviados: 0,
erros: 0,
detalhes: []
};

for (const grupoId of transmissao.grupos) {
try {
await columbina.sendMessage(grupoId, { text: mensagem });
resultados.enviados++;
} catch (e) {
resultados.erros++;
}
}

for (const numero of transmissao.numeros) {
try {
await columbina.sendMessage(numero, { text: mensagem });
resultados.enviados++;
} catch (e) {
resultados.erros++;
}
}

return resultados;
}

export default {
name: 'fazertm',
description: 'Agenda uma transmissão com data/hora ou "sempre"',
category: 'dono',
aliases: ['transmitir', 'tm'],
async execute({ columbina, from, args, reply, isDono, sender, q }) {
if (!isDono()) return reply('❌ Apenas o dono pode usar este comando!');

const input = q.trim();

if (!input) {
return reply(`❌ *Uso correto:*

📌 Para enviar agora (SEM SALVAR):
\`fazertm MENSAGEM AQUI\`

📌 Para enviar SEMPRE:
\`fazertm SEMPRE|HORA:MINUTO|MENSAGEM AQUI\`

📌 Para agendar com data/hora:
\`fazertm DIA|MÊS|ANO|HORA:MINUTO|MENSAGEM AQUI\``);
}

const transmissao = carregarTransmissao();
if (transmissao.grupos.length === 0 && transmissao.numeros.length === 0) {
return reply(`❌ A lista de transmissão está vazia!

Use \`addtm\` para adicionar grupos ou números primeiro.`);
}

const partes = input.split('|').map(p => p.trim());
const mensagem = partes[partes.length - 1];

if (partes.length === 3 && partes[0].toUpperCase() === 'SEMPRE') {
const horaMinuto = partes[1].split(':');
const hora = parseInt(horaMinuto[0]);
const minuto = parseInt(horaMinuto[1]);

if (isNaN(hora) || isNaN(minuto) || hora < 0 || hora > 23 || minuto < 0 || minuto > 59) {
return reply(`❌ Horário inválido! Use o formato: HORA:MINUTO

Exemplo: \`fazertm SEMPRE|14:30|Mensagem aqui\``);
}

const agendamentos = carregarAgendamentos();
const novosAgendamentos = agendamentos.filter(a => a.tipo !== 'sempre');

const novoAgendamento = {
id: Date.now().toString(),
tipo: 'sempre',
hora: hora,
minuto: minuto,
mensagem: mensagem,
criadoEm: moment().toISOString(),
ultimoEnvio: null
};

novosAgendamentos.push(novoAgendamento);
salvarAgendamentos(novosAgendamentos);

const agora = moment();
let proximo = moment().set({ hour: hora, minute: minuto, second: 0, millisecond: 0 });
if (proximo <= agora) {
proximo = proximo.add(1, 'day');
}

const diff = moment.duration(proximo.diff(agora));
const horas = Math.floor(diff.asHours());
const minutos = diff.minutes();

let tempoMsg = '';
if (horas > 0) tempoMsg = tempoMsg + `${horas} hora(s) `;
tempoMsg = tempoMsg + `${minutos} minuto(s)`;

const resposta = `✅ *Transmissão SEMPRE agendada!*

⏰ *Horário:* ${hora}:${minuto.toString().padStart(2, '0')}
⏳ *Próxima execução em:* ${tempoMsg}
📨 *Mensagem:* ${mensagem.substring(0, 100)}${mensagem.length > 100 ? '...' : ''}
━━━━━━━━━━━━━━━━━━
🔄 *Esta transmissão será enviada todos os dias neste horário.`;

await reply(resposta, from);
return;
}

if (partes.length === 5) {
const dia = parseInt(partes[0]);
const mes = parseInt(partes[1]);
const ano = parseInt(partes[2]);
const horaMinuto = partes[3].split(':');
const hora = parseInt(horaMinuto[0]);
const minuto = parseInt(horaMinuto[1]);

if (isNaN(dia) || isNaN(mes) || isNaN(ano) || isNaN(hora) || isNaN(minuto)) {
return reply(`❌ Datas inválidas! Use números.

Exemplo: \`fazertm 27|07|2026|14:30|Mensagem aqui\``);
}

if (dia < 1 || dia > 31 || mes < 1 || mes > 12 || ano < 2000 || hora < 0 || hora > 23 || minuto < 0 || minuto > 59) {
return reply(`❌ Valores inválidos!

Dia: 1-31
Mês: 1-12
Ano: 2000+
Hora: 0-23
Minuto: 0-59`);
}

const dataAlvo = moment(`${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')} ${hora}:${minuto.toString().padStart(2, '0')}`, 'YYYY-MM-DD HH:mm');
const agora = moment();

if (dataAlvo <= agora) {
return reply(`❌ A data informada já passou!

Data informada: ${dia}/${mes}/${ano} ${hora}:${minuto.toString().padStart(2, '0')}
Data atual: ${agora.format('DD/MM/YYYY HH:mm')}`);
}

const agendamentos = carregarAgendamentos();

const novoAgendamento = {
id: Date.now().toString(),
tipo: 'agendado',
data: dataAlvo.toISOString(),
dia, mes, ano, hora, minuto,
mensagem: mensagem,
criadoEm: moment().toISOString(),
enviado: false
};

agendamentos.push(novoAgendamento);
salvarAgendamentos(agendamentos);

const diff = moment.duration(dataAlvo.diff(agora));
const dias = Math.floor(diff.asDays());
const horas = diff.hours();
const minutos = diff.minutes();

let tempoMsg = '';
if (dias > 0) tempoMsg = tempoMsg + `${dias} dia(s) `;
if (horas > 0) tempoMsg = tempoMsg + `${horas} hora(s) `;
tempoMsg = tempoMsg + `${minutos} minuto(s)`;

const resposta = `✅ *Transmissão agendada com sucesso!*

📅 *Data:* ${dia}/${mes}/${ano} ${hora}:${minuto.toString().padStart(2, '0')}
⏰ *Faltam:* ${tempoMsg}
📨 *Mensagem:* ${mensagem.substring(0, 100)}${mensagem.length > 100 ? '...' : ''}
━━━━━━━━━━━━━━━━━━
🆔 *ID do agendamento:* ${novoAgendamento.id}

📌 A transmissão será enviada automaticamente na data agendada.`;

await reply(resposta, from);
return;
}

const mensagemAgora = input;
const resultados = await enviarTransmissao(columbina, mensagemAgora);

const resposta = `✅ *Transmissão enviada agora!*

📨 *Mensagem:* ${mensagemAgora.substring(0, 100)}${mensagemAgora.length > 100 ? '...' : ''}
━━━━━━━━━━━━━━━━━━
📊 *Resultado:*
✅ Enviados: ${resultados.enviados}
❌ Erros: ${resultados.erros}`;

await reply(resposta, from);
}
};