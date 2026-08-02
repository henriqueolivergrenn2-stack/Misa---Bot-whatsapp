import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMINHO_DB = path.join(__dirname, '../../database/frasesGlobais.json');
const UM_DIA_MS = 24 * 60 * 60 * 1000;

function carregarDB() {
    try {
        if (fs.existsSync(CAMINHO_DB)) {
            const data = JSON.parse(fs.readFileSync(CAMINHO_DB));
            return Array.isArray(data.frases) ? data.frases : [];
        }
    } catch (e) {}
    return [];
}

function salvarDB(lista) {
    fs.writeFileSync(CAMINHO_DB, JSON.stringify({ frases: lista }, null, 2));
}

function removerExpiradas(lista) {
    const agora = Date.now();
    return lista.filter(f => agora - f.timestamp < UM_DIA_MS);
}

export function registrarFrase({ grupoNome, frase, numero, nickname }) {
    let lista = carregarDB();
    lista = removerExpiradas(lista);

    const nova = {
        grupoNome,
        frase,
        numero,
        nickname: nickname || 'Desconhecido',
        timestamp: Date.now(),
        dataFormatada: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    };

    lista.push(nova);
    salvarDB(lista);
    return nova;
}

export function listarFrasesAtivas() {
    let lista = carregarDB();
    const semExpiradas = removerExpiradas(lista);

    // se removeu alguma expirada, já aproveita e salva a lista limpa
    if (semExpiradas.length !== lista.length) salvarDB(semExpiradas);

    return semExpiradas.sort((a, b) => b.timestamp - a.timestamp);
}
