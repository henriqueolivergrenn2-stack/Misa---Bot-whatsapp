import fs from 'fs';

export default {
name: 'listgp',
description: 'Lista todos os grupos onde a bot está presente com nome e ID',
category: 'dono',
aliases: ['grupos', 'listgroups'],
async execute({ columbina, from, reply, isDono, sender }) {
if (!isDono()) return reply('❌ Apenas o dono pode usar este comando!');

try {
const groups = await columbina.groupFetchAllParticipating();
const groupList = Object.values(groups);

if (groupList.length === 0) {
return reply('❌ A bot não está em nenhum grupo no momento.');
}

let message = `📋 *LISTA DE GRUPOS*
━━━━━━━━━━━━━━━━━━
🔹 *Total:* ${groupList.length} grupo(s)

`;

for (let i = 0; i < groupList.length; i++) {
const group = groupList[i];
const groupName = group.subject || 'Sem nome';
const groupId = group.id;
const memberCount = group.participants?.length || 0;

message = message + `┌──────────────────
│ 📌 *Grupo ${i + 1}*
│ 📛 Nome: ${groupName}
│ 🆔 ID: ${groupId}
│ 👥 Membros: ${memberCount}
└──────────────────

`;
}

if (message.length > 65536) {
const chunks = message.match(/[\s\S]{1,65000}/g) || [];
for (const chunk of chunks) {
await reply(chunk, from);
}
} else {
await reply(message, from);
}

} catch (error) {
console.error('Erro ao listar grupos:', error);
reply(`❌ Erro ao listar grupos: ${error.message}`);
}
}
};