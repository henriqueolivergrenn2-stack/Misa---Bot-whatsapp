/**
 * Comando: printsite / screenshot / print / capturar
 * Tira print de qualquer site e envia.
 *
 * ⚠️ DEPENDÊNCIA EXTRA (não vem na base Hiyuki nem no package.json dela):
 *   1. npm install puppeteer-core
 *   2. Um Chromium instalado no Termux, ex. via proot-distro:
 *      proot-distro login alpine -- apk add chromium
 *   3. Ajuste CHROMIUM_PATH abaixo (ou defina a env CHROMIUM_PATH) pro
 *      caminho real do executável/wrapper na sua instalação.
 */
import puppeteer from 'puppeteer-core';

const CHROMIUM_PATH =
    process.env.CHROMIUM_PATH ||
    '/data/data/com.termux/files/usr/bin/chromium-wrapper.sh';

export default {
    name: 'printsite',
    description: 'Tira um print de qualquer site e envia',
    category: 'downloads',
    aliases: ['screenshot', 'print', 'capturar'],

    async execute({ q, columbina, from, info, reply, reagir, prefix }) {
        const entrada = (q || '').trim();

        if (!entrada) {
            await reagir('❌');
            return reply(`❌ Informe o link do site!\n\nEx: ${prefix}printsite https://google.com`);
        }

        let url = entrada;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }

        await reagir('📸');
        await reply('_Acessando o site e tirando o print, aguarde..._');

        let browser = null;

        try {
            browser = await puppeteer.launch({
                headless: 'new',
                executablePath: CHROMIUM_PATH,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-zygote',
                    '--single-process',
                    '--disable-accelerated-2d-canvas',
                    '--disable-web-security',
                    '--disable-extensions',
                    '--disable-features=Translate,OptimizationHints,SitePerProcess'
                ],
                ignoreDefaultArgs: ['--disable-extensions', '--enable-automation']
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });
            await new Promise((r) => setTimeout(r, 3000));

            const screenshotRaw = await page.screenshot({
                type: 'jpeg',
                quality: 80,
                fullPage: false,
                encoding: 'binary'
            });

            const imageBuffer = Buffer.from(screenshotRaw, 'binary');

            await browser.close();
            browser = null;

            await columbina.sendMessage(from, {
                image: imageBuffer,
                caption: `🌐 *Print de:* ${url}`,
                mimetype: 'image/jpeg'
            }, { quoted: info });

            await reagir('✅');
        } catch (err) {
            if (browser) await browser.close().catch(() => {});
            await reagir('❌');

            if (
                err.message.includes('executablePath') ||
                err.message.includes('not found') ||
                err.message.includes('Browser was not found')
            ) {
                return reply(
                    '❌ Chromium não encontrado!\n\nRode no Termux:\n`proot-distro login alpine -- apk add chromium`'
                );
            }

            if (err.message.includes('timeout')) {
                return reply('⏱️ O site demorou demais pra carregar! Tente outro link.');
            }

            if (err.message.includes('net::ERR')) {
                return reply('🔌 Não consegui acessar esse site! Verifique o link.');
            }

            reply(`❌ Não foi possível tirar o print!\n\n(${err.message})`);
        }
    }
};
