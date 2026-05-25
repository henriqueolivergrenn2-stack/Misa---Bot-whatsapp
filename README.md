# 🤖 Misa Bot — Bot de WhatsApp

Bot multifunções para WhatsApp, baseado na estrutura do [Takeshi Bot](https://github.com/guiireal/takeshi-bot) com cases e comandos próprios. Utiliza a biblioteca **Baileys** para conexão com o WhatsApp.

---

## 📋 Índice

- [Requisitos](#-requisitos)
- [Instalação no Termux (Android)](#-instalação-no-termux-android)
- [Instalação em VPS / Linux](#-instalação-em-vps--linux)
- [Configuração](#-configuração)
- [Como iniciar](#-como-iniciar)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Comandos disponíveis](#-comandos-disponíveis)
- [Como criar comandos](#-como-criar-comandos)
- [Problemas comuns](#-problemas-comuns)
- [Requisitos para cases de download](#-requisitos-para-cases-de-download)

---

## ✅ Requisitos

- **Node.js** >= 22.8.0
- **npm** (incluso no Node.js)
- **FFmpeg** (para comandos de áudio/vídeo)
- **Git** (para clonar o repositório)

---

## 📱 Instalação no Termux (Android)

### 1. Instale os pacotes necessários via `pkg`

```bash
pkg update && pkg upgrade -y
pkg install nodejs git ffmpeg -y
```

> ⚠️ **Importante:** o `pkg install nodejs` já instala o npm. Se precisar de uma versão específica do Node.js (>= 22), use o `nvm` conforme abaixo.

### 2. (Opcional) Instalar o nvm para gerenciar versões do Node.js

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

### 3. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/Misa---Bot-whatsapp.git
cd Misa---Bot-whatsapp
```

### 4. Instale as dependências

```bash
npm install
```

---

## 🖥️ Instalação em VPS / Linux

### 1. Instale o Node.js >= 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
```

### 2. Instale o FFmpeg e Git

```bash
apt-get install -y ffmpeg git
```

### 3. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/Misa---Bot-whatsapp.git
cd Misa---Bot-whatsapp
```

### 4. Instale as dependências

```bash
npm install
```

---

## ⚙️ Configuração

Edite o arquivo `src/config.js` com suas informações:

```js
// Prefixo dos comandos (padrão: ".")
export const PREFIX = ".";

// Nome do bot
export const BOT_NAME = "Misa";

// LID do bot (obtido com o comando <prefixo>lid)
export const BOT_LID = "SEU_LID_AQUI@lid";

// LID do dono do bot (obtido com o comando <prefixo>meu-lid)
export const OWNER_LID = "SEU_LID_AQUI@lid";

// Token da Spider X API (crie conta em https://api.spiderx.com.br)
export const SPIDER_API_TOKEN = "seu_token_aqui";

// Chave da OpenAI (para comandos de IA, opcional)
export const OPENAI_API_KEY = "";

// Para restringir apenas a um grupo específico (opcional)
export const ONLY_GROUP_ID = "";
```

---

## 🚀 Como iniciar

### Início simples

```bash
npm start
```

### Início com auto-reconexão (recomendado para Termux/VPS)

```bash
bash MisaIniciar.sh
```

> O script `MisaIniciar.sh` reinicia automaticamente o bot em caso de queda.

### Modo desenvolvimento (com logs detalhados)

Altere em `src/config.js`:

```js
export const DEVELOPER_MODE = true;
```

---

## 📁 Estrutura de pastas

```
Misa---Bot-whatsapp/
├── src/
│   ├── commands/
│   │   ├── admin/        # Comandos para admins do grupo
│   │   ├── member/       # Comandos para todos os membros
│   │   │   ├── audio/
│   │   │   ├── canvas/
│   │   │   ├── downloads/
│   │   │   ├── funny/
│   │   │   ├── gold/
│   │   │   ├── ia/
│   │   │   ├── jogos/
│   │   │   ├── rpg/
│   │   │   ├── sticker/
│   │   │   └── utilidades/
│   │   ├── owner/        # Comandos exclusivos do dono
│   │   └── vip/          # Comandos VIP
│   ├── config.js         # ⚙️ Configurações do bot
│   ├── menu.js           # Edite o menu aqui
│   ├── index.js          # Entry point
│   └── connection.js     # Conexão com WhatsApp
├── assets/
│   ├── images/           # Imagens do bot
│   └── temp/             # Arquivos temporários
├── database/             # Banco de dados JSON
├── MisaIniciar.sh        # Script de auto-reconexão
└── package.json
```

---

## 📜 Comandos disponíveis

> O prefixo padrão é `.` — ex: `.menu`, `.sticker`, `.ping`

### 🤖 Bot
| Comando | Descrição |
|---|---|
| `.menu` / `.help` | Exibe o menu de comandos |
| `.ping` | Verifica se o bot está online |
| `.suporte` | Abre o suporte via IA |
| `.info` | Informações do grupo/bot |

### 🎨 Canvas / Imagens
| Comando | Descrição |
|---|---|
| `.sticker` | Cria sticker a partir de imagem/vídeo |
| `.to-image` | Converte sticker para imagem |
| `.to-gif` | Converte sticker para GIF |
| `.rename` | Renomeia o sticker |
| `.ttp` | Sticker com texto |
| `.blur` | Aplica blur na imagem |
| `.gray` | Imagem em escala de cinza |
| `.pixel` | Pixeliza a imagem |
| `.espelhar` | Espelha a imagem |
| `.contraste` | Altera o contraste |
| `.anime` | Filtro anime |

### 🎵 Áudio
| Comando | Descrição |
|---|---|
| `.audiolento` | Deixa o áudio mais lento |
| `.audiorapido` | Deixa o áudio mais rápido |
| `.esquilo` | Voz de esquilo |
| `.vozmenino` | Voz de menino |

### ⬇️ Downloads
| Comando | Descrição |
|---|---|
| `.yt-mp3` | Baixa áudio do YouTube |
| `.yt-mp4` | Baixa vídeo do YouTube |
| `.tik-tok` | Baixa vídeo do TikTok |
| `.tik-tok-audio` | Baixa áudio do TikTok |
| `.instagram` | Baixa vídeo do Instagram |
| `.facebook` | Baixa vídeo do Facebook |
| `.kwai` | Baixa vídeo do Kwai |
| `.pinterest` | Baixa imagem do Pinterest |
| `.printsite` | Tira print de um site |

### 🎮 Jogos
| Comando | Descrição |
|---|---|
| `.batalhanaval` | Batalha naval |
| `.blackjack` | Blackjack |
| `.forca` | Jogo da forca |
| `.velhas` | Jogo da velha |
| `.duelo` | Duelo entre membros |
| `.roleta` | Roleta russa |
| `.sorteio` | Sorteio |

### 💰 Economia (Gold)
| Comando | Descrição |
|---|---|
| `.saldo` | Ver saldo |
| `.daily` | Recompensa diária |
| `.work` | Trabalhar para ganhar gold |
| `.crime` | Cometer um crime |
| `.roubar` | Roubar outro membro |
| `.depositar` | Depositar gold |
| `.sacar` | Sacar gold |
| `.transferir` | Transferir gold |
| `.loja` | Ver loja |
| `.inventario` | Ver inventário |
| `.rankgold` | Ranking de gold |
| `.slot` | Jogo de slot |
| `.coinflip` | Cara ou coroa |
| `.quiz` | Quiz para ganhar gold |
| `.mine` | Minerar |
| `.fish` | Pescar |
| `.hunt` | Caçar |

### 🛡️ Admin
| Comando | Descrição |
|---|---|
| `.ban` | Remove membro do grupo |
| `.warn` | Advertir membro |
| `.unwarn` | Remover advertência |
| `.mute` | Mutar membro |
| `.unmute` | Desmutar membro |
| `.promover` | Promover a admin |
| `.rebaixar` | Rebaixar admin |
| `.limpar` | Limpar mensagens |
| `.fechar` / `.abrir` | Fechar/abrir grupo |
| `.anti-link` | Ativar/desativar anti-link |
| `.welcome` | Configurar boas-vindas |
| `.rank` | Ver ranking de atividade |
| `.link-grupo` | Obter link do grupo |
| `.set-name` | Alterar nome do grupo |
| `.auto-sticker` | Auto sticker |
| `.hide-tag` | Marcar todos sem notificar |

### 👑 Owner (Dono)
| Comando | Descrição |
|---|---|
| `.on` / `.off` | Ligar/desligar o bot |
| `.reiniciar` | Reiniciar o bot |
| `.vip` | Gerenciar VIP |
| `.exec` | Executar comando no terminal |
| `.set-prefix` | Alterar prefixo |
| `.set-mp` | Configurar mensagem privada |
| `.set-menu-image` | Alterar imagem do menu |
| `.get-group-id` | Obter ID do grupo |

---

## 🛠️ Como criar comandos

Copie o gabarito do arquivo `src/commands/🤖-como-criar-comandos.js` e crie seu arquivo na pasta correspondente:

- `src/commands/member/` — para todos os membros
- `src/commands/admin/` — somente admins
- `src/commands/owner/` — somente o dono

Exemplo mínimo:

```js
import { PREFIX } from "../../config.js";

export default {
  name: "meucomando",
  description: "Descrição do meu comando",
  commands: ["meucomando", "mc"],  // aliases
  usage: `${PREFIX}meucomando`,

  handle: async ({ sendTextMessage }) => {
    await sendTextMessage("Olá! Este é meu comando.");
  },
};
```

> O bot detecta automaticamente os arquivos nas pastas — **não precisa importar manualmente**.

---

## ❗ Problemas comuns

**Erro: `node: command not found`**
```bash
pkg install nodejs -y
```

**Erro: `ffmpeg: command not found`**
```bash
pkg install ffmpeg -y   # Termux
# ou
apt-get install ffmpeg  # Linux/VPS
```

**Erro de versão do Node.js**
```bash
# Verifique a versão atual
node -v
# Deve ser >= 22.8.0. Use nvm para instalar a versão correta
nvm install 22 && nvm use 22
```

**Bot desconectando com frequência**
- Use o script `MisaIniciar.sh` para auto-reconexão automática.
- Em VPS, considere usar `pm2`:
  ```bash
  npm install -g pm2
  pm2 start src/index.js --name misa-bot
  pm2 save
  pm2 startup
  ```

**QR Code não aparece / sessão inválida**
```bash
bash reset-qr-auth.sh
```

---
## ✅ Requisitos para cases de download
| Case | O que precisa |
|---|---|
| `yt-mp3` | `pkg install yt-dlp ffmpeg` |
| `yt-mp4` | `pkg install yt-dlp ffmpeg` |
| `tik-tok` | `pkg install yt-dlp ffmpeg` |
| `tik-tok-audio` | `pkg install yt-dlp ffmpeg` |
| `instagram` | `pkg install yt-dlp` |
| `facebook` | `pkg install yt-dlp` |
| `kwai` | `pkg install yt-dlp` |
| `pinterest` | `pkg install python` + `pip install gallery-dl` |
| `printsite` | `pkg install proot-distro` + Chromium via Alpine |

## 📄 Licença

Este projeto está sob a licença ISC. Base original: [Takeshi Bot](https://github.com/guiireal/takeshi-bot) por Dev Gui.

---

> 💡 **Dica:** Edite `src/menu.js` para personalizar o texto do menu, e substitua `assets/images/takeshi-bot.png` pela imagem que desejar como foto do menu.
