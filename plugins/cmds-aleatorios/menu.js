import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Misheru from '../../arquivos/js/UploadToServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'menu',
    description: 'Mostra o menu de comandos',
    category: 'cmds-aleatorios',
    aliases: ['comandos', 'help'],
    
    async execute({ columbina, from, info, prefix, reply, reagir, AudioMisheru, pushname, sender, isGroup }) {
        let nomeDoBot = 'Bot';
        let rodapeMenu = '🌸 Bot Multifuncional 🌸';
        try {
            const configAtual = JSON.parse(fs.readFileSync(path.join(__dirname, '../../database/config.json')));
            nomeDoBot = configAtual.NomeDoBot || nomeDoBot;
            rodapeMenu = configAtual.RodapeMenu || rodapeMenu;
        } catch (e) {}

        console.log('📍 [MENU] Iniciando execução do menu...');
        
        try {
            console.log('🎵 [MENU] Tentando tocar áudio...');
            await AudioMisheru('./arquivos/audio/menu.mp3').catch((err) => {
                console.log('⚠️ [MENU] Erro no áudio:', err.message);
            });
            
            console.log('🎐 [MENU] Reagindo com emoji...');
            await reagir("🎐");
            
            const caminhoMenu = path.join(__dirname, '../../arquivos/imagem/menu.jpg');
            console.log('📁 [MENU] Caminho da imagem:', caminhoMenu);
            
            const bufferMenu = fs.existsSync(caminhoMenu) ? fs.readFileSync(caminhoMenu) : null;
            console.log('🖼️ [MENU] Imagem carregada?', !!bufferMenu);
            
            let mediaMenu = null;
            if (bufferMenu) {
                console.log('📤 [MENU] Fazendo upload da imagem...');
                try {
                    const uploadResult = await Misheru.uploadImagem(columbina, bufferMenu);
                    console.log('✅ [MENU] Upload concluído:', uploadResult.url);
                    

                    mediaMenu = {
                        imageMessage: {
                            url: uploadResult.url,
                            mimetype: 'image/jpeg',
                            fileSha256: uploadResult.sha256Arquivo.toString('base64'),
                            fileLength: uploadResult.tamanhoArquivo.toString(),
                            height: 1080,
                            width: 1080,
                            mediaKey: uploadResult.mediaKey,
                            fileEncSha256: uploadResult.sha256ArquivoCriptografado.toString('base64'),
                            directPath: uploadResult.caminhoDireto,
                            mediaKeyTimestamp: Math.floor(Date.now() / 1000).toString(),
                            jpegThumbnail: bufferMenu.toString('base64'),
                            contextInfo: {
                                pairedMediaType: "NOT_PAIRED_MEDIA",
                                statusSourceType: "IMAGE"
                            }
                        },
                        hasMediaAttachment: true
                    };
                    console.log('📸 [MENU] MediaMessage criada com sucesso');
                } catch (uploadErr) {
                    console.log('❌ [MENU] Erro no upload:', uploadErr.message);
                    console.log('📸 [MENU] Usando fallback com URL direta');
                    mediaMenu = {
                        imageMessage: {
                            url: "https://mmg.whatsapp.net/v/t62.7118-24/609055856_1610321287283893_6601437604110254515_n.enc?ccb=11-4&oh=01_Q5Aa5AF3qZrBRnr0uU7KjXrR1GzW41TSHavBtRiRQH9wuhetGA&oe=6A8B348D&_nc_sid=5e03e0",
                            mimetype: "image/jpeg",
                            fileSha256: "AkNG4pr7y5arUm8jGS8g5D/oVybRyfSVXs38MbwLDL8=",
                            fileLength: "176229",
                            height: 1080,
                            width: 1080,
                            mediaKey: "FqsM3biuL/KScIwtkOSpZM5jE66UfMzLyjKY15O6g0Q=",
                            fileEncSha256: "ARDhVZ2ztAPV4f/xZxRP2Xa+ht68WEIJGK1p3KcDRjo=",
                            directPath: "/v/t62.7118-24/609055856_1610321287283893_6601437604110254515_n.enc?ccb=11-4&oh=01_Q5Aa5AF3qZrBRnr0uU7KjXrR1GzW41TSHavBtRiRQH9wuhetGA&oe=6A8B348D&_nc_sid=5e03e0",
                            mediaKeyTimestamp: "1784922638",
                            jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEMAQwMBIgACEQEDEQH/xAAvAAADAQEBAQAAAAAAAAAAAAAAAwQBAgUGAQEBAQEAAAAAAAAAAAAAAAABAAID/9oADAMBAAIQAxAAAADzLDz+3SnvrQRZvFQiqFYRlY9Cwu4PZzeHZTKyrvPRp6GmmQ2/GLLOOgo7W5PE8n6fyLUBp06U2tzHHWYkrVRNFyRSvGGxHYcxuhqygCEAywG//8QAIxAAAgICAgICAwEAAAAAAAAAAQIAAwQREiETMRQiMkFRYf/aAAgBAQABPwBncqjqdAS51y66+PTAfaJjM+O1iDZBiZPiT/dalHyLnCo8vd8WwK7bLL3LbWtbSjoRaX8Zs5aKmfI6G+4+MrYgFTgkdtKLjUW63samHkWYzdqeBl9+Na5bhMW+ihiyr2ZnIXQXGIGZgq+zHvvRTXYsVW1EZlBCMRv3KWqQkMNy/IbTBD9ZVhX3IHWW1241ihvcGQXqfmdn9CYoHIvuO1OQ5UkepZSQ5CtsQaCmalVYsUqTqYFgrU1a6Ey6Tk28v5Div7KkCXMBpVGgIA2tqexEYlR3AeoqkkQUUeBRoh5hpQF47IaMwVzwWeUb0y9GZ9IQ7EAYAwWkDUVNrMOpQ4LzyKeRC70fUrKu4YLChQn+GVvWynY1qZi8lHAA6luGXO1PGGhxBhXK+mH1hIIQKJWyroMeve4jAHrc8tIUgsdwmviVbfqeROkBI6jc7GRUI3vvcNF2+uMXkG2x6gpLMSrcQZ8VPXImeJgeXMnUYD6kA8tw1MwYaJMXHcKeQIMrpPLfIz7j9wOSZyYxWPFpX+MCr5R1DCSVhgn/xAAdEQACAgMAAwAAAAAAAAAAAAAAAREhAhASQVFS/9oACAECAQE/AJslqSbLO2IyMUyTl6gcQeiMiiitS/rXgYtf/8QAHREAAwACAgMAAAAAAAAAAAAAAAERECECEiAxQf/aAAgBAwEBPwClZ9x2eJikY9IusIjPcpEaKjvy8v/Z",
                            contextInfo: {
                                pairedMediaType: "NOT_PAIRED_MEDIA",
                                statusSourceType: "IMAGE"
                            }
                        },
                        hasMediaAttachment: true
                    };
                }
            }
            
            const menuTxt = `
╭🌸─━⛩─━❄━─⛩━─🌸╮
        ❱❱ ${rodapeMenu} ❰❰
        
╭🌸━─━─━─🌸─━─━─━─🌸╮
│❄╭─⛩✦⛩─╮
│❄│ 𝐁𝐨𝐭: ${nomeDoBot}
│❄│ 𝐔𝐬𝐞𝐫: ${pushname}
│❄│ 𝐍𝐮𝐦𝐞𝐫𝐨: ${sender.split("@")[0]}
│❄│ 𝐆𝐫𝐮𝐩𝐨: ${isGroup ? 'Sim✅️' : 'Não❌️'}
│❄│ 𝐒𝐭𝐚𝐭𝐮𝐬: Online 🟢
│❄╰─⛩✦⛩─╯
╰🌸━─━─━─🌸─━─━─━─🌸╯`;

            console.log('📝 [MENU] Texto do menu gerado');

            const botoes = [{
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "⛩️🌸 𝐂𝐑𝐈𝐀𝐃𝐎𝐑 🌸⛩️",
                    url: "https://www.instagram.com/misherumodz?igsh=b2VmbDI0NGsybm9o",
                    merchant_url: "https://www.instagram.com/misherumodz?igsh=b2VmbDI0NGsybm9o"
                })
            }, {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: "🌸 𝐌𝐄𝐍𝐔 ❆ 𝐋𝐈𝐒𝐓𝐀 🌸",
                    sections: [{
                        title: "Escolha uma opção",
                        rows: [
                            { header: "𝗠𝗘𝗡𝗨 𝗔𝗗𝗠", title: "🛡️ Admin", description: "Comandos apenas para administradores", id: `${prefix}menuadm` },
                            { header: "𝗠𝗘𝗡𝗨 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦", title: "🗒 Comandos", description: "Comandos aleatorios", id: `${prefix}menucmd` },
                            { header: "𝗠𝗘𝗡𝗨 𝗗𝗢𝗡𝗢", title: "👑 Dono", description: "Comandos do dono da bot", id: `${prefix}menudono` },
                            { header: "𝗠𝗘𝗡𝗨 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗦", title: "⬇️ Downloads", description: "Comandos de downloads", id: `${prefix}menudownloads` },
                            { header: "𝗠𝗘𝗡𝗨 𝗘𝗙𝗘𝗜𝗧𝗢𝗦", title: "🎨 Efeitos", description: "Feitos de img e audio", id: `${prefix}menuefeitos` },
                            { header: "𝗠𝗘𝗡𝗨 𝗜𝗔", title: "🤖 IA", description: "Comandos de inteligência artificial", id: `${prefix}menuia` },
                            { header: "𝗠𝗘𝗡𝗨 𝗠𝗜𝗗𝗜𝗔𝗦", title: "🎬 Midias", description: "Comandos de Midias da bot", id: `${prefix}menumidias` },
                            { header: "𝗠𝗘𝗡𝗨 𝗣𝗥𝗘𝗠𝗜𝗨𝗠", title: "💎 Premium", description: "Comandos de premium", id: `${prefix}menupremium` },
                            { header: "𝗠𝗘𝗡𝗨 𝗥𝗘𝗦𝗘𝗡𝗛𝗔", title: "🎮 Jogos", description: "Todos os jogos e brincadeiras da bot", id: `${prefix}menubrincadeira` },
                            { header: "𝗠𝗘𝗡𝗨 𝗥𝗣𝗚", title: "⚔️ RPG", description: "Comandos de RPG da bot", id: `${prefix}menurpg` }
                        ]
                    }]
                })
            }];

            console.log('📋 [MENU] Botões criados');

            const mensagem = {
                interactiveMessage: {
                    body: {
                        text: "⛩️🎐 _clique no botão abaixo para averiguar os menus._🎐⛩️"
                    },
                    footer: {
                        text: "MisheruModz </>"
                    },
                    carouselMessage: {
                        messageVersion: 1,
                        cards: [{
                            header: mediaMenu || { hasMediaAttachment: false },
                            body: { text: menuTxt },
                            footer: { text: `© ${nomeDoBot}` },
                            nativeFlowMessage: { buttons: botoes }
                        }]
                    }
                }
            };

            console.log('📨 [MENU] Estrutura da mensagem pronta');
            console.log('📨 [MENU] Mensagem:', JSON.stringify(mensagem, null, 2));

            console.log('📤 [MENU] Enviando com relayMessage...');
            await columbina.relayMessage(from, mensagem, {
                additionalNodes: [{
                    tag: "biz",
                    attrs: {},
                    content: [{
                        tag: "interactive",
                        attrs: { type: "native_flow", v: "1" },
                        content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }]
                    }]
                }]
            });
            
            console.log('✅ [MENU] Mensagem enviada com sucesso!');
            
        } catch (e) {
            console.error('❌ [MENU] ERRO:', e);
            console.error('❌ [MENU] Stack:', e.stack);
            await reply(`❌ Erro ao abrir o menu:\n${e.message}`);
        }
    }
};