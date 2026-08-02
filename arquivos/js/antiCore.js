import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CAMINHO_DB = path.join(__dirname, '../../database/antiConfig.json');

// Modos: 0 = desativado | 1 = apaga a mensagem | 2 = apaga a mensagem + bane quem mandou
export const MODOS = { OFF: 0, APAGAR: 1, BANIR: 2 };

export function carregarDB() {
    try {
        if (fs.existsSync(CAMINHO_DB)) return JSON.parse(fs.readFileSync(CAMINHO_DB));
    } catch (e) {}
    return {};
}

export function salvarDB(db) {
    fs.writeFileSync(CAMINHO_DB, JSON.stringify(db, null, 2));
}

function garantirGrupo(db, groupId) {
    if (!db[groupId]) db[groupId] = { features: {}, mutados: {} };
    if (!db[groupId].features) db[groupId].features = {};
    if (!db[groupId].mutados) db[groupId].mutados = {};
    return db[groupId];
}

export function getModo(groupId, feature) {
    const db = carregarDB();
    return db[groupId]?.features?.[feature] ?? MODOS.OFF;
}

export function setModo(groupId, feature, modo) {
    const db = carregarDB();
    const grupo = garantirGrupo(db, groupId);
    grupo.features[feature] = modo;
    salvarDB(db);
}

export function getModoMute(groupId, userJid) {
    const db = carregarDB();
    return db[groupId]?.mutados?.[userJid] ?? MODOS.OFF;
}

export function setModoMute(groupId, userJid, modo) {
    const db = carregarDB();
    const grupo = garantirGrupo(db, groupId);
    if (modo === MODOS.OFF) {
        delete grupo.mutados[userJid];
    } else {
        grupo.mutados[userJid] = modo;
    }
    salvarDB(db);
}

export function listarMutados(groupId) {
    const db = carregarDB();
    return db[groupId]?.mutados || {};
}

const NOMES_MODO = {
    [MODOS.OFF]: 'desativado ⚪',
    [MODOS.APAGAR]: 'ativado (apaga a mensagem) 🗑️',
    [MODOS.BANIR]: 'ativado (apaga + bane) 🔨'
};

/**
 * Fábrica de comando anti-X: gera um plugin Hiyuki completo (toggle 1/2/3/4)
 * a partir de uma config simples.
 */
export function criarComandoAnti({ name, aliases = [], feature, label, emoji }) {
    return {
        name,
        description: `Ativa/desativa o ${label} no grupo (apagar e/ou banir)`,
        category: 'admin',
        aliases,
        async execute({ from, args, prefix, reply, reagir }) {
            const opcao = (args[0] || '').trim();
            const modoAtual = getModo(from, feature);

            if (!['1', '2', '3', '4'].includes(opcao)) {
                return reply(
                    `${emoji} *${label.toUpperCase()}*\n\n` +
                    `1️⃣ ${prefix}${name} 1 — ativa (apaga a mensagem)\n` +
                    `2️⃣ ${prefix}${name} 2 — desativa esse modo\n` +
                    `3️⃣ ${prefix}${name} 3 — desativa o modo com banimento\n` +
                    `4️⃣ ${prefix}${name} 4 — ativa com banimento (apaga + bane)\n\n` +
                    `📌 Status atual: *${NOMES_MODO[modoAtual]}*`
                );
            }

            if (opcao === '1') {
                setModo(from, feature, MODOS.APAGAR);
                await reagir('🗑️');
                return reply(`${emoji} ${label} *ativado* — mensagens serão apagadas.`);
            }
            if (opcao === '2') {
                if (modoAtual !== MODOS.APAGAR) {
                    return reply(`${emoji} O modo de apagar do ${label} já está desativado.`);
                }
                setModo(from, feature, MODOS.OFF);
                await reagir('⚪');
                return reply(`${emoji} ${label} *desativado*.`);
            }
            if (opcao === '3') {
                if (modoAtual !== MODOS.BANIR) {
                    return reply(`${emoji} O modo com banimento do ${label} já está desativado.`);
                }
                setModo(from, feature, MODOS.OFF);
                await reagir('⚪');
                return reply(`${emoji} Modo com banimento do ${label} *desativado*.`);
            }
            if (opcao === '4') {
                setModo(from, feature, MODOS.BANIR);
                await reagir('🔨');
                return reply(`${emoji} ${label} *ativado com banimento* — mensagens serão apagadas e quem mandar será removido do grupo.`);
            }
        }
    };
}
