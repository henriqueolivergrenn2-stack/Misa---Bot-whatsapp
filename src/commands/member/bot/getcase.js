/**
 * Comando: getcase
 * Envia o código fonte de um comando pelo WhatsApp.
 * Salve em: src/commands/member/getcase.js
 *
 * Só funciona em grupos liberados pelo dono via .liberarcase
 */
import fs from "node:fs";
import path from "node:path";
import { COMMANDS_DIR, PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { isActiveGroupRestriction } from "../../../utils/database.js";
import {
  findCommandImport,
  formatCommand,
  readDirectoryRecursive,
} from "../../../utils/index.js";

// Busca o arquivo .js de um comando pelo nome
function findCommandFile(commandName) {
  const files = readDirectoryRecursive(COMMANDS_DIR);
  const fmt   = formatCommand(commandName);

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    // Procura por commands: [...] contendo o nome
    const match = content.match(/commands\s*:\s*\[([^\]]+)\]/);
    if (match) {
      const names = match[1]
        .split(",")
        .map((s) => s.replace(/['"` ]/g, "").trim())
        .map((s) => formatCommand(s));
      if (names.includes(fmt)) return filePath;
    }
  }
  return null;
}

export default {
  name: "getcase",
  description: "Envia o código fonte de um comando!",
  commands: ["getcase"],
  usage: `${PREFIX}getcase menu`,

  handle: async ({
    sendErrorReply,
    sendWaitReact,
    sendSuccessReact,
    remoteJid,
    socket,
    webMessage,
    isGroup,
    fullArgs,
  }) => {
    if (!isGroup) {
      await sendErrorReply("Este comando só funciona em grupos!");
      return;
    }

    // Verifica se o grupo foi liberado pelo dono
    if (!isActiveGroupRestriction(remoteJid, "getcase")) {
      await sendErrorReply(
        "Este grupo não tem permissão para usar este comando!\n\n" +
        "Peça ao dono do bot para liberar com *" + PREFIX + "liberarcase*"
      );
      return;
    }

    const commandName = fullArgs.trim().toLowerCase();

    if (!commandName) {
      throw new InvalidParameterError(
        `Informe o nome do comando!\n\nEx: *${PREFIX}getcase menu*`
      );
    }

    await sendWaitReact();

    // Verifica se o comando existe
    const { command } = await findCommandImport(formatCommand(commandName));
    if (!command) {
      await sendErrorReply(
        `Comando *${commandName}* não encontrado!\n\nVerifique o nome e tente novamente.`
      );
      return;
    }

    // Busca o arquivo do comando
    const filePath = findCommandFile(commandName);
    if (!filePath || !fs.existsSync(filePath)) {
      await sendErrorReply(`Arquivo do comando *${commandName}* não encontrado!`);
      return;
    }

    const fileName = path.basename(filePath);
    const content  = fs.readFileSync(filePath);

    await sendSuccessReact();

    // Envia como documento
    await socket.sendMessage(
      remoteJid,
      {
        document: content,
        fileName: fileName,
        mimetype: "text/javascript",
        caption: `📄 *Case: ${commandName}*\n📁 ${fileName}`,
      },
      { quoted: webMessage }
    );
  },
};
