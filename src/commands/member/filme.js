import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";

function formatRuntime(runtime) {
  if (!runtime || runtime === "N/A") return "N/A";
  const minutes = parseInt(runtime);
  if (isNaN(minutes)) return runtime;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h \( {m}min` : ` \){m}min`;
}

export default {
  name: "movie",
  description: "Busco informações de filmes e séries!",
  commands: ["movie", "filme", "series", "serie"],
  usage: `${PREFIX}filme Inception`,

  handle: async ({
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    sendImageFromURL,
    sendReply,
    fullArgs,
  }) => {
    if (!fullArgs?.trim()) {
      throw new InvalidParameterError(
        `Informe o nome do filme!\n\nExemplo: *${PREFIX}filme Inception*`
      );
    }

    await sendWaitReact();

    try {
      const query = encodeURIComponent(fullArgs.trim());
      const searchUrl = `https://imdb.iamidiotareyoutoo.com/search?q=${query}`;

      const searchRes = await fetch(searchUrl);
      const searchText = await searchRes.text();

      let searchData;
      try {
        searchData = JSON.parse(searchText);
      } catch {
        throw new Error("Resposta inválida da API");
      }

      if (!searchData.ok || !searchData.description?.length) {
        await sendErrorReply(`❌ Não encontrei *${fullArgs}*.\nTente o nome em inglês ou mais preciso!`);
        return;
      }

      // Pega o melhor resultado
      const item = searchData.description[0];
      const titulo = item["#TITLE"] || fullArgs;
      const ano = item["#YEAR"] || "N/A";
      const atoresRaw = item["#ACTORS"] || "";
      const poster = item["#IMG_POSTER"] || null;

      let sinopse = "Sinopse não disponível no momento.";
      let genero = "N/A";
      let duracao = "N/A";
      let nota = "N/A";
      let diretor = "N/A";

      // Tenta pegar mais informações detalhadas
      try {
        const detailRes = await fetch(`https://imdb.iamidiotareyoutoo.com/title/${item["#IMDB_ID"]}`);
        const detailText = await detailRes.text();
        const detailData = JSON.parse(detailText);

        sinopse = detailData["#PLOT"] || detailData["#PLOT_OUTLINE"] || sinopse;
        genero = detailData["#GENRE"] || genero;
        duracao = formatRuntime(detailData["#RUNTIME"]);
        nota = detailData["#RATING"] ? `${detailData["#RATING"]}/10` : nota;
        diretor = detailData["#DIRECTOR"] || diretor;
      } catch (e) {
        console.log("ℹ️ Usando dados básicos do filme.");
      }

      const atores = atoresRaw
        ? atoresRaw.split(",").slice(0, 8).map(a => `⇒ *${a.trim()}*`).join("\n")
        : "N/A";

      const txt =
`❪🎬ฺ࣭࣪͘ꕸ▸ 𝙽𝚘𝚖𝚎: \( {titulo} ( \){ano})
❪💢ฺ࣭࣪͘ꕸ▸ 𝚃𝚒𝚙𝚘: 🎬 Filme / Série
❪🎥ฺ࣭࣪͘ꕸ▸ 𝙶ê𝚗𝚎𝚛𝚘: ${genero}
❪⏱️ฺ࣭࣪͘ꕸ▸ 𝙳𝚞𝚛𝚊çã𝚘: ${duracao}
❪📟ฺ࣭࣪͘ꕸ▸ 𝙻𝚊𝚗ç𝚊𝚖𝚎𝚗𝚝𝚘: ${ano}
❪📊ฺ࣭࣪͘ꕸ▸ 𝙰𝚟𝚊𝚕𝚒𝚊çã𝚘: ${nota}
❪⚒️ฺ࣭࣪͘ꕸ▸ 𝙳𝚒𝚛𝚎çã𝚘: ${diretor}

〘 𝙀𝙇𝙀𝙉𝘾𝙊 〙
${atores}

▧⃯⃟𝙎𝙄𝙉𝙊𝙋𝙎𝙀৴▸ ${sinopse}`;

      await sendSuccessReact();

      if (poster && poster !== "N/A" && !poster.includes("404")) {
        try {
          await sendImageFromURL(poster, txt);
        } catch {
          await sendReply(txt);
        }
      } else {
        await sendReply(txt);
      }

    } catch (error) {
      console.error("[Movie Command Error]:", error);
      await sendErrorReply("⚠️ Serviço instável no momento.\nTente novamente em alguns segundos!");
    }
  },
};