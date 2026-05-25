/**
 * Comando: setmp
 * Configura o Mercado Pago pelo WhatsApp — apenas dono.
 * Salve em: src/commands/owner/set-mp.js
 */

import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { getMpConfig, isMpConfigured, setMpConfig } from "../../utils/mercadoPago.js";

// Campos configuráveis e seus labels amigáveis
const CAMPOS = {
  token:     { key: "access_token", label: "Access Token",  exemplo: "APP_USR-123456..." },
  email:     { key: "payer_email",  label: "E-mail",        exemplo: "seuemail@gmail.com" },
  cpf:       { key: "payer_cpf",    label: "CPF",           exemplo: "00000000000" },
  descricao: { key: "description",  label: "Descrição Pix", exemplo: "VIP - Meu Bot" },
};

export default {
  name: "set-mp",
  description: "Configura o Mercado Pago para pagamentos VIP. Apenas dono.",
  commands: ["setmp", "set-mp", "configmp", "mpconfig"],
  usage:
    `*${PREFIX}setmp* — ver configuração atual\n` +
    `*${PREFIX}setmp token <seu_token>*\n` +
    `*${PREFIX}setmp email <seu_email>*\n` +
    `*${PREFIX}setmp cpf <seu_cpf>*\n` +
    `*${PREFIX}setmp descricao <texto>*`,

  handle: async ({
    sendReply,
    sendSuccessReact,
    sendErrorReply,
    sendWarningReply,
    fullArgs,
    args,
  }) => {
    const parts = (fullArgs?.trim() || "").split(/\s+/);
    const sub   = (parts[0] || "").toLowerCase();
    const valor = parts.slice(1).join(" ").trim();

    // ── VER CONFIG ATUAL ──────────────────────────────────────────────────
    if (!sub) {
      const cfg        = getMpConfig();
      const configurado = isMpConfigured();

      // Mascara o token por segurança
      const tokenMask = cfg.access_token
        ? cfg.access_token.slice(0, 12) + "..." + cfg.access_token.slice(-4)
        : "❌ não configurado";

      return sendReply(
        `⚙️ *CONFIGURAÇÃO MERCADO PAGO*\n\n` +
        `${configurado ? "✅ Configurado e pronto!" : "⚠️ Configuração incompleta!"}\n\n` +
        `🔑 *Token:* \`${tokenMask}\`\n` +
        `📧 *E-mail:* ${cfg.payer_email || "❌ não configurado"}\n` +
        `🪪 *CPF:* ${cfg.payer_cpf ? cfg.payer_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "❌ não configurado"}\n` +
        `📝 *Descrição:* ${cfg.description || "❌ não configurado"}\n\n` +
        `*Como configurar:*\n` +
        Object.entries(CAMPOS)
          .map(([cmd, c]) => `› *${PREFIX}setmp ${cmd}* <${c.exemplo}>`)
          .join("\n") +
        `\n\n_Token em: mercadopago.com.br/developers/panel_`
      );
    }

    // ── CONFIGURAR CAMPO ──────────────────────────────────────────────────
    const campo = CAMPOS[sub];

    if (!campo) {
      throw new InvalidParameterError(
        `Campo inválido!\n\n` +
        `Campos disponíveis:\n` +
        Object.keys(CAMPOS).map(k => `› *${PREFIX}setmp ${k}*`).join("\n")
      );
    }

    if (!valor) {
      throw new InvalidParameterError(
        `Informe o valor!\n\nEx: *${PREFIX}setmp ${sub} ${campo.exemplo}*`
      );
    }

    // Validações
    if (sub === "cpf" && !/^\d{11}$/.test(valor.replace(/\D/g, ""))) {
      return sendWarningReply(`CPF inválido! Informe só os 11 números.\nEx: *${PREFIX}setmp cpf 00000000000*`);
    }

    if (sub === "email" && !valor.includes("@")) {
      return sendWarningReply(`E-mail inválido!\nEx: *${PREFIX}setmp email seuemail@gmail.com*`);
    }

    // Normaliza CPF (remove pontos/traços)
    const valorFinal = sub === "cpf" ? valor.replace(/\D/g, "") : valor;

    setMpConfig(campo.key, valorFinal);
    await sendSuccessReact();

    const configurado = isMpConfigured();
    return sendReply(
      `✅ *${campo.label}* atualizado!\n\n` +
      (configurado
        ? `🟢 Mercado Pago está *completamente configurado*!\nJá pode usar *${PREFIX}comprar-vip*`
        : `⚠️ Ainda falta configurar:\n` +
          (() => {
            const cfg = getMpConfig();
            const faltando = [];
            if (!cfg.access_token) faltando.push(`› *${PREFIX}setmp token <token>*`);
            if (!cfg.payer_email)  faltando.push(`› *${PREFIX}setmp email <email>*`);
            if (!cfg.payer_cpf)    faltando.push(`› *${PREFIX}setmp cpf <cpf>*`);
            return faltando.join("\n");
          })()
      )
    );
  },
};
