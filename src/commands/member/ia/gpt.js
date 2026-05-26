/**
 * Comando: gpt / ia / chat
 * Conversa com IA usando múltiplos endpoints gratuitos como fallback.
 * Sem API Key necessária!
 */
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { errorLog } from "../../../utils/logger.js";

function isHtml(str) {
  return typeof str === "string" && str.trim().startsWith("<");
}

async function tryEndpoints(prompt) {
  let resultado = null;

  // ── Endpoint 1: siputzx ──────────────────────────────────────────────
  if (!resultado) {
    try {
      const res = await fetch(
        `https://api.siputzx.my.id/api/ai/gpt4o?content=${encodeURIComponent(prompt)}`,
        { signal: AbortSignal.timeout(20000), headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      const r = data?.data || data?.result || data?.message || data?.response || null;
      if (r && !isHtml(r)) resultado = r;
    } catch (_) {}
  }

  // ── Endpoint 2: pollinations OpenAI proxy ────────────────────────────
  if (!resultado) {
    try {
      const res = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(25000),
      });
      const data = await res.json();
      const r = data?.choices?.[0]?.message?.content || null;
      if (r && !isHtml(r)) resultado = r;
    } catch (_) {}
  }

  // ── Endpoint 3: pollinations text direto ─────────────────────────────
  if (!resultado) {
    try {
      const res = await fetch(
        `https://text.pollinations.ai/${encodeURIComponent(prompt)}`,
        { signal: AbortSignal.timeout(20000), headers: { Accept: "text/plain" } }
      );
      const data = await res.text();
      if (data && !isHtml(data)) resultado = data;
    } catch (_) {}
  }

  // ── Endpoint 4: Hugging Face Mistral (sem auth) ───────────────────────
  if (!resultado) {
    try {
      const res = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputs: `<s>[INST] ${prompt} [/INST]`,
            parameters: { max_new_tokens: 512, return_full_text: false },
          }),
          signal: AbortSignal.timeout(25000),
        }
      );
      const data = await res.json();
      const r = data?.[0]?.generated_text || null;
      if (r && !isHtml(r)) resultado = r.trim();
    } catch (_) {}
  }

  return resultado;
}

export default {
  name: "gpt",
  description: "Converse com uma IA gratuitamente!",
  commands: ["gpt", "ia", "chat", "chatgpt"],
  usage: `${PREFIX}gpt Qual a capital do Brasil?`,

  handle: async ({
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    sendReply,
    fullArgs,
  }) => {
    if (!fullArgs?.trim()) {
      throw new InvalidParameterError(
        `Faça uma pergunta!\n\nExemplo: *${PREFIX}gpt Qual a capital do Brasil?*`
      );
    }

    await sendWaitReact();

    try {
      const resultado = await tryEndpoints(fullArgs.trim());

      if (!resultado) {
        await sendErrorReply(
          "Todos os serviços de IA estão indisponíveis no momento. Tente novamente em alguns segundos!"
        );
        return;
      }

      await sendSuccessReact();
      await sendReply(resultado);
    } catch (err) {
      errorLog(`[GPT] Erro: ${err.message}`);
      await sendErrorReply("Ocorreu um erro ao processar sua pergunta. Tente novamente!");
    }
  },
};
