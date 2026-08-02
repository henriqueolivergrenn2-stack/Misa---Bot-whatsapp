import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMINHO_JSON = path.join(__dirname, '../../database/config.json');

export function pvEstaBloqueado() {
    try {
        const data = JSON.parse(fs.readFileSync(CAMINHO_JSON));
        return data.PvBloqueado === true;
    } catch (e) {}
    return false;
}

function salvarEstado(bloqueado) {
    const data = JSON.parse(fs.readFileSync(CAMINHO_JSON));
    data.PvBloqueado = bloqueado;
    fs.writeFileSync(CAMINHO_JSON, JSON.stringify(data, null, 2));
}

export default {
    name: 'pv',
    description: 'Bloqueia ou libera o uso de comandos no privado (PV)',
    category: 'dono',
    aliases: ['bloquearpv', 'liberarpv', 'pvbloqueio'],
    async execute({ args, prefix, reply, reagir }) {
        const acao = (args[0] || '').toLowerCase();

        // ativa o bloqueio
        if (acao === 'on' || acao === 'bloquear' || acao === 'ativar') {
            salvarEstado(true);
            await reagir('🔒');
            return reply('🔒 Comandos no privado foram *bloqueados*.\n\nAgora só o dono consegue usar o bot no PV. Os grupos continuam funcionando normalmente.');
        }

        // desativa o bloqueio
        if (acao === 'off' || acao === 'liberar' || acao === 'desativar') {
            salvarEstado(false);
            await reagir('🔓');
            return reply('🔓 Comandos no privado foram *liberados*.\n\nO bot voltou a funcionar normalmente no PV pra todo mundo.');
        }

        // sem argumento ou argumento inválido -> mostra status
        const estadoAtual = pvEstaBloqueado();
        return reply(
            `📌 Status atual do PV: *${estadoAtual ? 'BLOQUEADO 🔒' : 'LIBERADO 🔓'}*\n\n` +
            `▸ ${prefix}pv on — bloqueia comandos no privado\n` +
            `▸ ${prefix}pv off — libera comandos no privado`
        );
    }
};
