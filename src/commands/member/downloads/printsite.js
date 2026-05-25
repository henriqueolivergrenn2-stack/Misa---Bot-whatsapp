/**
 * Comando: printsite / screenshot / print
 * Tira print de qualquer site e envia.
 */
import puppeteer from "puppeteer-core";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";

export default {
  name: "printsite",
  description: "Tira um print de qualquer site e envia!",
  commands: ["printsite", "screenshot", "print", "capturar"],
  usage: `${PREFIX}printsite https://google.com`,

  handle: async ({
    sendReply,
    sendReact,
    fullArgs,
    remoteJid,
    socket,
    webMessage,
  }) => {
    if (!fullArgs.trim()) {
      throw new InvalidParameterError(
        `Informe o link do site!\n\nExemplo: *${PREFIX}printsite https://google.com*`
      );
    }

    let url = fullArgs.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    await sendReact("📸");
    await sendReply("_Acessando o site e tirando o print, aguarde..._");

    let browser = null;

    try {
      browser = await puppeteer.launch({
        headless: "new",
        executablePath: "/data/data/com.termux/files/usr/bin/chromium-wrapper.sh",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-zygote",
          "--single-process",
          "--disable-accelerated-2d-canvas",
          "--disable-web-security",
          "--disable-extensions",
          "--disable-features=Translate,OptimizationHints,SitePerProcess",
        ],
        ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
      });

      const page = await browser.newPage();

      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 35000,
      });

      await new Promise((r) => setTimeout(r, 3000));

      // ✅ Converte explicitamente para Buffer do Node.js
      const screenshotRaw = await page.screenshot({
        type: "jpeg",
        quality: 80,
        fullPage: false,
        encoding: "binary",
      });

      const imageBuffer = Buffer.from(screenshotRaw, "binary");

      await browser.close();
      browser = null;

      await socket.sendMessage(
        remoteJid,
        {
          image: imageBuffer,
          caption: `🌐 *Print de:* ${url}`,
          mimetype: "image/jpeg",
        },
        { quoted: webMessage }
      );
    } catch (err) {
      if (browser) await browser.close().catch(() => {});

      console.error("[PrintSite Error]", err);

      if (
        err.message.includes("executablePath") ||
        err.message.includes("not found") ||
        err.message.includes("Browser was not found")
      ) {
        throw new WarningError(
          "❌ Chromium não encontrado!\n\nRode no Termux:\n`proot-distro login alpine -- apk add chromium`"
        );
      }

      if (err.message.includes("timeout")) {
        throw new WarningError(
          "⏱️ O site demorou demais pra carregar! Tente outro link."
        );
      }

      if (err.message.includes("net::ERR")) {
        throw new WarningError(
          "🔌 Não consegui acessar esse site! Verifique o link."
        );
      }

      throw new WarningError(
        `Não foi possível tirar o print!\n\n*Detalhes:* ${err.message}`
      );
    }
  },
};