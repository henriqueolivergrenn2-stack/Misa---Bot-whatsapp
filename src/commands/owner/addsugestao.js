/**
 * Comando: addsugestao
 * Adiciona comandos à lista de sugestões fixas do dynamicCommand.
 * Apenas o dono do bot pode usar.
 *
 * Uso: .addsugestao sticker, togif, menu
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do arquivo de sugestões fixas
const SUGGESTIONS_FILE = path.resolve(__dirname, "../../utils/fixedSuggestions.json");

function loadSuggestions() {
  if (!fs.existsSync(SUGGESTIONS_FILE)) {
    fs.writeFileSync(SUGGESTIONS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
  return JSON.parse(fs.readFileSync(SUGGESTIONS_FILE, "utf-8"));
}

function saveSuggestions(list) {
  fs.writeFileSync(SUGGESTIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
}

export default {
  name: "addsugestao",
  description: "Adiciono comandos à lista de sugestões do bot (apenas dono)",
  commands: ["addsugestao", "add-sugestao", "addcomando", "add-comando"],
  usage: `${PREFIX}addsugestao sticker, togif, menu`,

  handle: async ({
    sendSuccessReply,
    sendWarningReply,
    sendErrorReply,
    fullArgs,
  }) => {
    if (!fullArgs.length) {
      throw new InvalidParameterError(
        `Informe os comandos que deseja adicionar!\n\nExemplo: *${PREFIX}addsugestao sticker, togif, menu*`
      );
    }

    // Aceita separado por vírgula ou espaço
    const newCommands = fullArgs
      .split(/[,\s]+/)
      .map((c) => c.trim().toLowerCase().replace(/^[^a-z0-9]+/, ""))
      .filter(Boolean);

    if (!newCommands.length) {
      throw new InvalidParameterError("Nenhum comando válido informado!");
    }

    const current = loadSuggestions();
    const added = [];
    const duplicates = [];

    for (const cmd of newCommands) {
      if (current.includes(cmd)) {
        duplicates.push(cmd);
      } else {
        current.push(cmd);
        added.push(cmd);
      }
    }

    saveSuggestions(current);

    let reply = "";

    if (added.length) {
      reply += `✅ *Adicionado(s):*\n${added.map((c) => `› ${c}`).join("\n")}`;
    }

    if (duplicates.length) {
      reply += `${added.length ? "\n\n" : ""}⚠️ *Já existiam:*\n${duplicates.map((c) => `› ${c}`).join("\n")}`;
    }

    reply += `\n\n📋 *Total de sugestões fixas:* ${current.length}`;

    await sendSuccessReply(reply);
  },
};
