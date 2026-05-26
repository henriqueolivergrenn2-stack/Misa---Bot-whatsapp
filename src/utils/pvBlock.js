/**
 * Utilitário: pvBlock
 * Lê e salva o estado do bloqueio de PV diretamente no config.js.
 * Adicione esta linha no seu config.js:
 * export const PV_BLOQUEADO = false;
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.resolve(__dirname, "../config.js");

export function isPvBloqueado() {
  try {
    const content = fs.readFileSync(CONFIG_FILE, "utf-8");
    const match = content.match(/export const PV_BLOQUEADO\s*=\s*(true|false);/);
    return match ? match[1] === "true" : false;
  } catch {
    return false;
  }
}

export function setPvBloqueado(valor) {
  try {
    let content = fs.readFileSync(CONFIG_FILE, "utf-8");

    content = content.replace(
      /export const PV_BLOQUEADO\s*=\s*(true|false);/,
      `export const PV_BLOQUEADO = ${valor};`
    );

    fs.writeFileSync(CONFIG_FILE, content, "utf-8");
  } catch (err) {
    console.error("[pvBlock] Erro ao salvar no config.js:", err.message);
  }
}