/**
 * Comando: pinterest / pin
 * Busca imagens no Pinterest usando gallery-dl.
 * - Envia 1 foto por vez
 * - Nunca repete a mesma foto (por termo de busca)
 * - Filtra conte�do NSFW via palavras-chave bloqueadas
 * Instale com: pip install gallery-dl
 */
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { PREFIX, TEMP_DIR } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import { getRandomName } from "../../../utils/index.js";
import { errorLog } from "../../../utils/logger.js";

const execAsync = promisify(exec);

// Arquivo de hist�rico salvo em TEMP_DIR
const HISTORY_FILE = path.resolve(TEMP_DIR, "pinterest_history.json");

// Termos bloqueados para filtro NSFW
const BLOCKED_TERMS = [
  "nsfw", "nude", "naked", "porn", "xxx", "hentai", "lewd",
  "erotic", "adult", "18+", "pelada", "pelado", "porno", "sexo",
  "nudez", "desnuda", "nua", "nu ", "lingerie sexy", "fetish",
];

function isNsfwQuery(query) {
  const q = query.toLowerCase();
  return BLOCKED_TERMS.some((term) => q.includes(term));
}

function loadHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return {};
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveHistory(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
  } catch (_) {}
}

function getSeenForQuery(history, query) {
  return new Set(history[query] || []);
}

function addToHistory(history, query, filename) {
  if (!history[query]) history[query] = [];
  history[query].push(filename);
  // Limita hist�rico a 200 por termo para n�o crescer infinito
  if (history[query].length > 200) history[query] = history[query].slice(-200);
  saveHistory(history);
}

function cleanup(dir) {
  try {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  } catch (_) {}
}

export default {
  name: "pinterest",
  description: "Busco imagens no Pinterest e envio, sem repetir e sem NSFW!",
  commands: ["pinterest", "pin"],
  usage: `${PREFIX}pinterest gatos fofos`,

  handle: async ({
    fullArgs,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    sendImageFromFile,
    sendWarningReply,
  }) => {
    if (!fullArgs.length) {
      throw new InvalidParameterError(
        `Você precisa me dizer o que deseja buscar!\n\nExemplo: *${PREFIX}pinterest gatos fofos*`
      );
    }

    const query = fullArgs.trim().toLowerCase();

    // Filtro NSFW
    if (isNsfwQuery(query)) {
      throw new WarningError(
        "Não posso buscar esse tipo de conteúdo! Tente outro termo."
      );
    }

    await sendWaitReact();

    const outDir = path.resolve(TEMP_DIR, getRandomName());

    try {
      fs.mkdirSync(outDir, { recursive: true });

      const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;

      // Baixa mais fotos para ter op��es novas (range maior)
      await execAsync(
        `gallery-dl --range 1-30 -d "${outDir}" "${searchUrl}"`,
        { timeout: 90000 }
      );

      // Lista todas as imagens baixadas
      const allFiles = fs
        .readdirSync(outDir, { recursive: true })
        .map((f) => path.join(outDir, String(f)))
        .filter((f) => {
          try {
            return (
              fs.statSync(f).isFile() &&
              /\.(jpg|jpeg|png|webp)$/i.test(f)
            );
          } catch {
            return false;
          }
        });

      if (!allFiles.length) {
        await sendErrorReply(
          `Nenhuma imagem encontrada para *${query}*.\nTente outro termo!`
        );
        return;
      }

      const history = loadHistory();
      const seen = getSeenForQuery(history, query);

      // Filtra imagens ainda n�o enviadas
      let newFiles = allFiles.filter((f) => !seen.has(path.basename(f)));

      // Se todas j� foram vistas, reseta o hist�rico desse termo
      if (!newFiles.length) {
        history[query] = [];
        saveHistory(history);
        newFiles = allFiles;
      }

      // Embaralha e pega a primeira
      newFiles.sort(() => Math.random() - 0.5);
      const chosen = newFiles[0];

      await sendSuccessReact();

      await sendImageFromFile(
        chosen,
        ` *${query}*`,
        null,
        true
      );

      // Salva no historico
      addToHistory(history, query, path.basename(chosen));
    } catch (error) {
      errorLog(`[Pinterest] Erro: ${error.message}`);
      await sendErrorReply(
        "Erro ao buscar imagens no Pinterest. Tente outro termo ou tente novamente!"
      );
    } finally {
      cleanup(outDir);
    }
  },
};
