/**
 * Comando: comprar-vip / pixvip / vipcomprar
 * Fluxo: usuário pede VIP → bot gera Pix → usuário paga →
 *        bot detecta pagamento → libera VIP automaticamente.
 *
 * Salve em: src/commands/member/comprar-vip.js
 */

import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { errorLog, infoLog } from "../../utils/logger.js";
import { checkPayment, createPixPayment } from "../../utils/mercadoPago.js";
import { addVipGroup, addVipUser, isVipGroup, isVipUser } from "../../utils/vipManager.js";

// ─── PLANOS VIP ───────────────────────────────────────────────────────────────
// Edite os planos e preços aqui

const PLANOS = {
  "1": { nome: "VIP 30 dias",   valor: 9.90,  dias: 30  },
  "2": { nome: "VIP 90 dias",   valor: 24.90, dias: 90  },
  "3": { nome: "VIP Vitalício", valor: 49.90, dias: 9999 },
};

// ─── SESSÕES PENDENTES ────────────────────────────────────────────────────────
// Guarda pagamentos em espera: Map<userLid, { payment_id, plano, tipo, jid, expiresAt }>

const pendingPayments = new Map();

// ─── POLLING DE VERIFICAÇÃO ───────────────────────────────────────────────────
// Verifica a cada 15s se algum pagamento pendente foi aprovado

async function pollPayments() {
  for (const [userLid, session] of pendingPayments.entries()) {
    // Remove sessões expiradas (30 min)
    if (Date.now() > session.expiresAt) {
      pendingPayments.delete(userLid);
      infoLog(`[comprar-vip] Sessão expirada para ${userLid}`);
      continue;
    }

    try {
      const status = await checkPayment(session.payment_id);
      infoLog(`[comprar-vip] ${userLid} → payment ${session.payment_id} status: ${status}`);

      if (status === "approved") {
        // Libera VIP
        if (session.tipo === "grupo") {
          addVipGroup(session.jid);
        } else {
          addVipUser(userLid);
        }

        pendingPayments.delete(userLid);

        // Notifica o usuário (via socket guardado na sessão)
        try {
          const { plano } = session;
          await session.socket.sendMessage(
            session.jid,
            {
              text:
                `✅ *PAGAMENTO CONFIRMADO!*\n\n` +
                `👑 *${plano.nome}* ativado com sucesso!\n\n` +
                `Obrigado pela compra! Aproveite os comandos VIP. 🎉`,
            },
            session.quotedKey ? { quoted: { key: session.quotedKey } } : {}
          );
        } catch (e) {
          errorLog(`[comprar-vip] Erro ao notificar ${userLid}: ${e.message}`);
        }
      }
    } catch (e) {
      errorLog(`[comprar-vip] Erro ao checar payment ${session.payment_id}: ${e.message}`);
    }
  }
}

// Inicia o polling
setInterval(pollPayments, 15_000);

// ─── COMANDO ──────────────────────────────────────────────────────────────────

export default {
  name: "comprar-vip",
  description: "Compre VIP automaticamente via Pix (Mercado Pago).",
  commands: ["comprar-vip", "pixvip", "vipcomprar", "compravip"],
  usage:
    `*${PREFIX}comprar-vip* — ver planos\n` +
    `*${PREFIX}comprar-vip <1|2|3>* — gerar Pix do plano\n` +
    `*${PREFIX}comprar-vip grupo <1|2|3>* — VIP para o grupo\n` +
    `*${PREFIX}comprar-vip status* — checar seu pagamento`,

  handle: async ({
    sendReply,
    sendErrorReply,
    sendWarningReply,
    sendWaitReact,
    sendSuccessReact,
    sendImageFromBuffer,
    socket,
    remoteJid,
    userLid,
    webMessage,
    args,
    fullArgs,
  }) => {
    const parts = (fullArgs?.trim() || "").toLowerCase().split(/\s+/);
    const sub   = parts[0] || "";
    const nome  = webMessage?.pushName || "Usuário";

    // ── VER PLANOS ────────────────────────────────────────────────────────
    if (!sub || sub === "planos") {
      const lista = Object.entries(PLANOS)
        .map(([k, p]) => `*${k}.* ${p.nome} — *R$ ${p.valor.toFixed(2)}*`)
        .join("\n");

      return sendReply(
        `👑 *PLANOS VIP*\n\n${lista}\n\n` +
        `📱 *Para usuário:*\n*${PREFIX}comprar-vip <número>*\n\n` +
        `📋 *Para o grupo:*\n*${PREFIX}comprar-vip grupo <número>*\n\n` +
        `_O VIP é liberado automaticamente após o pagamento!_\n\n` +
       `*_Observação: Compre por sua responsabilidade._ _sem devoluções!_*`
      );
    }

    // ── STATUS DO PAGAMENTO ───────────────────────────────────────────────
    if (sub === "status") {
      const session = pendingPayments.get(userLid);
      if (!session) {
        return sendWarningReply(
          `Você não tem nenhum pagamento pendente.\n\n` +
          `Use *${PREFIX}comprar-vip* para ver os planos.`
        );
      }
      const restante = Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 60_000));
      return sendReply(
        `⏳ *PAGAMENTO PENDENTE*\n\n` +
        `📦 Plano: *${session.plano.nome}*\n` +
        `💰 Valor: *R$ ${session.plano.valor.toFixed(2)}*\n` +
        `⏱️ Expira em: *${restante} minutos*\n\n` +
        `_Assim que o pagamento for confirmado, o VIP será liberado automaticamente!_`
      );
    }

    // ── COMPRA PARA GRUPO ─────────────────────────────────────────────────
    let isGrupo = false;
    let planoKey = sub;

    if (sub === "grupo" || sub === "group") {
      if (!remoteJid.endsWith("@g.us")) {
        return sendWarningReply("VIP de grupo só pode ser comprado dentro de um grupo!");
      }
      if (isVipGroup(remoteJid)) {
        return sendWarningReply("Este grupo já tem *VIP* ativo! 👑");
      }
      isGrupo  = true;
      planoKey = parts[1] || "";
    }

    // ── COMPRA PARA USUÁRIO ───────────────────────────────────────────────
    if (!isGrupo && isVipUser(userLid)) {
      return sendWarningReply("Você já tem *VIP* ativo! 👑");
    }

    // Valida o plano
    const plano = PLANOS[planoKey];
    if (!plano) {
      throw new InvalidParameterError(
        `Plano inválido! Escolha:\n` +
        Object.entries(PLANOS).map(([k, p]) => `*${k}.* ${p.nome} — R$ ${p.valor.toFixed(2)}`).join("\n") +
        `\n\nEx: *${PREFIX}comprar-vip 1*`
      );
    }

    // Verifica se já tem pagamento pendente
    if (pendingPayments.has(userLid)) {
      const session  = pendingPayments.get(userLid);
      const restante = Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 60_000));
      return sendWarningReply(
        `Você já tem um pagamento pendente!\n\n` +
        `📦 *${session.plano.nome}* — R$ ${session.plano.valor.toFixed(2)}\n` +
        `⏱️ Expira em *${restante} min*\n\n` +
        `Use *${PREFIX}comprar-vip status* para ver o Pix novamente.`
      );
    }

    await sendWaitReact();

    try {
      infoLog(`[comprar-vip] Gerando Pix R$${plano.valor} para ${userLid} (plano=${plano.nome}, grupo=${isGrupo})`);

      const pix = await createPixPayment(plano.valor, 30);
      infoLog(`[comprar-vip] Payment ID: ${pix.payment_id}`);

      // Salva sessão pendente
      pendingPayments.set(userLid, {
        payment_id: pix.payment_id,
        plano,
        tipo:       isGrupo ? "grupo" : "usuario",
        jid:        isGrupo ? remoteJid : userLid,
        expiresAt:  Date.now() + 30 * 60 * 1000,
        socket,
        quotedKey:  webMessage?.key,
      });

      // QR Code com caption completa
      const qrBuffer = Buffer.from(pix.qr_code_base64, "base64");

      await sendImageFromBuffer(
        qrBuffer,
        `👑 *${plano.nome}* — R$ ${plano.valor.toFixed(2)}\n` +
        `⏱️ Pix válido por *30 minutos*\n\n` +
        `✅ VIP liberado automaticamente após o pagamento!`
      );

      // Só o código — nada mais
      await sendReply(pix.copy_paste);

      await sendSuccessReact();

    } catch (error) {
      pendingPayments.delete(userLid);
      errorLog(`[comprar-vip] ERRO: ${error.message}`);
      errorLog(`[comprar-vip] stack: ${error.stack}`);
      await sendErrorReply(
        `Erro ao gerar o Pix!\n\n📄 *Detalhes:* ${error.message}\n\n` +
        `Tente novamente em instantes.`
      );
    }
  },
};
