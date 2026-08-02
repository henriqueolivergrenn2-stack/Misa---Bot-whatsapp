# 🌸 Misaki — Bot de WhatsApp (base Hiyuki)

Bot multifuncional para WhatsApp feito em Node.js com [Baileys](https://github.com/WhiskeySockets/Baileys), rodando sobre a base **Hiyuki Supreme V1**. Tem sistema de plugins com auto-reload, RPG com economia própria, jogos em grupo, downloads de mídia, administração de grupo, efeitos de áudio/imagem e muito mais.

> Testado rodando em **Termux (Android)**, mas funciona normalmente em Linux/VPS com Node.js.

---

## 📋 Índice

- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Como ligar o bot](#-como-ligar-o-bot)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Sistema de plugins](#-sistema-de-plugins)
- [Comandos disponíveis](#-comandos-disponíveis)
- [Sistema de RPG / Economia](#-sistema-de-rpg--economia)
- [Recursos técnicos](#-recursos-técnicos)
- [Problemas comuns](#-problemas-comuns)
- [Créditos](#-créditos)

---

## ✅ Pré-requisitos

Antes de instalar, você precisa ter:

| Requisito | Versão mínima | Pra que serve |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18 ou superior | Rodar o bot (usa módulos ESM) |
| npm | (vem com o Node) | Instalar as dependências |
| [Git](https://git-scm.com/) | qualquer | Clonar o repositório |
| [FFmpeg](https://ffmpeg.org/) | qualquer | Conversão de figurinhas, áudio e vídeo |
| Conta de WhatsApp | — | Pra conectar o bot (recomendado usar um número separado do seu principal) |

### Instalando no Termux (Android)

```bash
pkg update && pkg upgrade -y
pkg install nodejs-lts git ffmpeg -y
```

### Instalando em Linux/Ubuntu/Debian (PC ou VPS)

```bash
sudo apt update
sudo apt install nodejs npm git ffmpeg -y
```

> Se o `nodejs` do repositório da sua distro for muito antigo, instale via [nvm](https://github.com/nvm-sh/nvm) pra pegar uma versão 18+.

---

## 📥 Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd SEU-REPOSITORIO

# 2. Instale as dependências
npm install --legacy-peer-deps
```

> O `--legacy-peer-deps` é necessário por causa de conflitos de versão entre algumas libs (Baileys, puppeteer, etc). Sem essa flag o `npm install` pode falhar.

---

## ⚙️ Configuração

Todas as configurações principais ficam em **`database/config.json`**:

```json
{
  "prefix": ".",
  "NomeDoBot": "Misaki",
  "NomeDoDono": "Seu Nome",
  "NumeroDoDono": "5511999999999",
  "PvBloqueado": false,
  "RodapeMenu": "Comandos by: Misaki"
}
```

| Campo | Descrição |
|---|---|
| `prefix` | Símbolo usado antes de cada comando (ex: `.`, `!`, `#`) |
| `NomeDoBot` | Nome exibido nas mensagens e no menu |
| `NomeDoDono` | Seu nome, exibido em algumas respostas |
| `NumeroDoDono` | **Seu número com código do país, sem `+` e sem espaços** (ex: `5511999999999`). É esse número que tem acesso aos comandos de dono |
| `PvBloqueado` | Se `true`, bloqueia o uso de comandos no privado (só funciona em grupos) |
| `RodapeMenu` | Texto que aparece no rodapé do menu |

Você também pode trocar esses campos por comando depois que o bot já estiver rodando, sem editar o JSON na mão:
- `.setprefix` — troca o prefixo global
- `.setprefixgp` — troca o prefixo só de um grupo específico
- `.setnomebot` — troca o nome do bot
- `.setfotomenu` — troca a foto usada no menu
- `.trocarrodapemenu` — troca o rodapé do menu

---

## ▶️ Como ligar o bot

```bash
node index.js
```

Na primeira vez, o terminal vai mostrar um **QR Code** — escaneie com o WhatsApp em **Aparelhos conectados > Conectar um aparelho**. Depois da primeira conexão, a sessão fica salva e não precisa escanear de novo (a não ser que desconecte o WhatsApp do celular).

Se seu terminal não conseguir mostrar QR Code (comum em alguns ambientes de VPS/SSH), use o **código de emparelhamento** ao invés do QR, digitando seu número quando o bot pedir.

> 💡 Dica: pra manter o bot rodando 24h sem cair quando você fecha o terminal, use um gerenciador de processos como `pm2`:
> ```bash
> npm install -g pm2
> pm2 start index.js --name misaki
> pm2 logs misaki
> ```

---

## 📂 Estrutura de pastas

```
├── index.js               → Arquivo principal, recebe e processa as mensagens
├── comandos.js             → Gerenciador de plugins (carrega, recarrega, premium, prefixo por grupo)
├── conexao.js               → Conexão com o WhatsApp via Baileys
├── package.json
│
├── arquivos/
│   ├── js/                → Funções auxiliares (RPG, atividade, anti-sistemas, uploads, exif, etc)
│   ├── imagem/             → Imagens usadas pelo bot (perfis, menus)
│   └── audio/              → Áudios usados pelo bot
│
├── database/
│   ├── config.json         → Configurações gerais (ver acima)
│   ├── rpg.json             → Dados de todos os usuários do RPG (carteira, banco, etc)
│   ├── atividade.json       → Ranking de atividade diária dos grupos
│   ├── antiConfig.json      → Configuração dos sistemas anti-x por grupo
│   └── users/                → Sessão de conexão do WhatsApp (Baileys) — NÃO compartilhe essa pasta!
│
└── plugins/
    ├── admin/            → Comandos só pra admins do grupo
    ├── dono/              → Comandos só pro dono do bot
    ├── premium/            → Comandos só pra quem tem Premium
    ├── rpg/                 → Comandos de economia/RPG
    ├── resenha/              → Jogos e comandos de zoeira
    ├── midias/                → Edição/geração de imagem
    ├── downloads/              → Downloads de redes sociais
    ├── efeitos/                 → Efeitos de áudio
    ├── cmds-aleatorios/          → Comandos livres/públicos
    ├── inteligencia-ia/           → Comandos com IA
    └── menu/                       → Submenus por categoria
```

> ⚠️ **Nunca suba a pasta `database/users` pro GitHub** — é a sessão autenticada do seu WhatsApp. Se alguém tiver acesso a ela, consegue controlar seu número. Coloque ela (e o `database/*.json` se quiser manter privado) no `.gitignore`.

---

## 🧩 Sistema de plugins

O bot carrega os comandos automaticamente — não precisa registrar nada manualmente. Basta criar um arquivo `.js` dentro da pasta certa em `plugins/` seguindo essa estrutura:

```javascript
export default {
    name: 'nomedocomando',
    description: 'O que o comando faz',
    category: 'rpg', // ou admin, dono, resenha, etc.
    aliases: ['apelido1', 'apelido2'],
    async execute({ sender, from, reply, reagir, q, prefix, columbina, info }) {
        // sua lógica aqui
        return reply('Olá, mundo!');
    }
};
```

A **pasta onde o arquivo fica** define quem pode usar o comando:

| Pasta | Quem pode usar |
|---|---|
| `plugins/admin/` | Só admins do grupo |
| `plugins/dono/` | Só o número configurado como dono |
| `plugins/premium/` | Só usuários marcados como Premium |
| `plugins/rpg/`, `plugins/resenha/`, `plugins/midias/`, `plugins/downloads/`, `plugins/efeitos/`, `plugins/cmds-aleatorios/` | Qualquer pessoa |

O bot monitora os arquivos com **chokidar** — se você editar um plugin e salvar, ele recarrega sozinho, sem precisar reiniciar.

**Esconder/mostrar um comando do menu** (sem apagar o arquivo):
```
.rmcmd nomedocomando     → some do menu (continua funcionando se digitado)
.rncmd nomedocomando     → volta a aparecer no menu
```

---

## 📜 Comandos disponíveis

### 🛡️ Admin (só admins do grupo)

| Comando | O que faz |
|---|---|
| `.ban` | Remove um membro do grupo |
| `.promover` | Promove um membro a administrador |
| `.rebaixar` | Rebaixa um administrador a membro comum |
| `.mute` | Silencia um usuário (apaga as mensagens dele) |
| `.grupo` | Abre ou fecha o grupo (só admins mandam mensagem) |
| `.apagar` | Apaga uma mensagem do grupo |
| `.limpar` | Limpa a tela do chat (efeito visual) |
| `.marcar` | Marca todos os membros do grupo |
| `.bemvindo` | Ativa/configura mensagem de boas-vindas |
| `.brincadeira` | Ativa/desativa o "modo resenha" no grupo (fica salvo mesmo se o bot reiniciar) |
| `.revisu` | Revela uma mídia de visualização única (foto, vídeo ou áudio) |
| `.antilink`, `.antiaudio`, `.antivideo`, `.antiimage`, `.antisticker`, `.antidocument`, `.antilottie`, `.antiproduct`, `.antistatusgrupo`, `.antievent` | Liga/desliga bloqueio automático de cada tipo de conteúdo no grupo |

### 👑 Dono (só você)

| Comando | O que faz |
|---|---|
| `.darvip` | Dá Premium pra alguém (marque, responda a mensagem, ou informe o número) |
| `.premium` | Gerencia a lista de usuários Premium |
| `.sair` | Faz o bot sair do grupo |
| `.listgp` | Lista todos os grupos onde o bot está, com nome e ID |
| `.pv` | Bloqueia/libera o uso de comandos no privado |
| `.setprefix` / `.setprefixgp` | Troca o prefixo (global ou de um grupo específico) |
| `.setnomebot` / `.setfotomenu` / `.trocarrodapemenu` | Personaliza nome, foto e rodapé do menu |
| `.rmcmd` / `.rncmd` | Esconde/mostra comando no menu |
| `.botoff` / `.boton` | Desliga/liga o bot pra todo mundo (exceto você) |
| `.resenha` | Ativa/desativa modo resenha no grupo (via dono) |
| `.addtm` / `.fazertm` | Adiciona grupo/número na lista de transmissão / agenda o envio |
| `.getquoted` | Mostra os dados de uma mensagem marcada |
| `.sugestoes` | Lista, mostra ou remove sugestões enviadas pelos usuários |
| `.limparqr` | Limpa arquivos temporários de QR Code |

### 💰 RPG / Economia (todo mundo)

| Comando | O que faz |
|---|---|
| `.rg` | Cria/edita sua conta no RPG (nome, idade, gênero, foto) — não é obrigatório pra jogar |
| `.perfil` | Mostra seu perfil (nome, idade, saldo, foto) |
| `.fotoperfil` | Define/troca a foto do seu perfil no RPG |
| `.saldo` | Mostra carteira, banco e total |
| `.trabalhar` | Trabalha e ganha dinheiro aleatório (cooldown 30min) |
| `.minerar` | Minera em busca de minérios pra vender (cooldown 20min). Use `.minerar upgrade` pra evoluir sua picareta |
| `.roubar` | Tenta roubar dinheiro da carteira de outra pessoa registrada |
| `.doar` | Doa dinheiro da sua carteira pra outra pessoa registrada |
| `.rank` | Ranking global de mais ricos do RPG |
| `.rankativo` | Ranking de quem mais participou do grupo hoje (mensagens, figurinhas e comandos) |

### 🎲 Resenha / Jogos (todo mundo)

| Comando | O que faz |
|---|---|
| `.forca` | Jogo da forca no grupo — todo mundo pode ajudar a adivinhar (aposta opcional). Dá pra escolher o tema direto (ex: `.forca comida`). Depois de iniciado, é só digitar a letra direto no chat |
| `.velha` | Jogo da velha 2 jogadores — desafie alguém, com aposta opcional |
| `.batalhanaval` | Minigame de batalha naval — ache os navios escondidos (aposta opcional) |
| `.blackjack` | Jogue Blackjack (21) apostando na sua carteira |
| `.cassino` | Aposta dinheiro no cassino (dobra ou perde) |
| `.roleta` | Aposta na roleta: vermelho, preto, verde, par, ímpar ou número exato |
| `.dado` | Joga um dado (com animação). Sem aposta é só diversão, com aposta você duela contra o bot |
| `.gados` / `.otakus` / `.cornos` / `.rankgay` | Rankings de zoeira sorteados entre os membros do grupo (é tudo brincadeira) |

### 🎨 Mídias (todo mundo)

| Comando | O que faz |
|---|---|
| `.sticker` | Cria figurinha a partir de imagem ou vídeo |
| `.toimg` / `.togif` | Converte figurinha em imagem / figurinha animada em GIF |
| `.renomear` | Renomeia o pack/autor de uma figurinha já existente |
| `.blur` / `.gray` / `.contraste` / `.espelhar` / `.pixel` | Efeitos de edição de imagem |
| `.funnyphoto` / `.photofunia` | Efeitos divertidos via funny.pho.to / PhotoFunia |
| `.anime` / `.anime2` | Gera logo estilizada com o texto informado |
| `.neymar` / `.trump` / `.opiniao` | Montagens/edits engraçados com o texto informado |

### ⬇️ Downloads (todo mundo)

| Comando | O que faz |
|---|---|
| `.play` | Baixa do YouTube (pergunta se é áudio ou vídeo) |
| `.yt-mp3` / `.yt-mp4` | Baixa áudio/vídeo do YouTube por link ou nome |
| `.tiktok` / `.tiktok-audio` | Baixa vídeo/áudio do TikTok sem marca d'água |
| `.instagram` / `.facebook` | Baixa vídeos/reels do Instagram e do Facebook |
| `.kwai` | Baixa vídeos do Kwai sem marca d'água |
| `.printsite` | Tira print de qualquer site e envia |

### 🔊 Efeitos de áudio (todo mundo)

`.audiolento`, `.audiorapido`, `.esquilo`, `.vozmenino`

### ⭐ Premium (só quem tem Premium)

| Comando | O que faz |
|---|---|
| `.fakechat` | Cria uma citação falsa mencionando um usuário |
| `.pinterest` | Busca imagem/gif/vídeo aleatório no Pinterest (sem conteúdo +18) |
| `.separaraudio` | Separa o áudio e o vídeo de um vídeo e manda os dois |

### 🧰 Gerais

| Comando | O que faz |
|---|---|
| `.menu` | Mostra o menu de comandos |
| `.info` | Mostra informações detalhadas de um comando |
| `.sugestao` | Envia uma sugestão para o dono do bot |
| `.gerarlink` | Gera link de imagem/vídeo usando Catbox |
| `.registrarfrase` / `.listafrases` | Registra/mostra frases compartilhadas entre grupos (24h) |

---

## 🏦 Sistema de RPG / Economia

Cada usuário tem duas "contas": **carteira** (dinheiro na mão, pode ser roubado por outros jogadores) e **banco** (seguro, ninguém rouba).

- **`.trabalhar`** — cooldown de 30min, ganha entre R$25 e R$260 dependendo do "emprego" sorteado
- **`.minerar`** — cooldown de 20min, sorteia um minério por raridade (pedra comum até diamante) e vende. Tem picareta progressiva (madeira → pedra → ferro → diamante), cada tier multiplica o ganho; evolui gastando dinheiro com `.minerar upgrade`
- **`.roubar`** — chance de sucesso/falha ao tentar roubar a carteira de alguém, com cooldown e risco de multa se falhar
- **Renda por mensagem** — quem conversa no grupo ganha uma graninha simbólica (R$1 a R$5) por mensagem digitada, com cooldown de 1min por pessoa e teto de R$250/dia. É só um "bônus de presença" — não compete com `.trabalhar`/`.minerar` como fonte principal de dinheiro, e não é possível farmar spammando mensagem
- **`.rank`** — ranking global (carteira + banco somados) de todos os usuários
- **`.rankativo`** — ranking de atividade do dia (mensagens, figurinhas e comandos) por grupo

Todos os dados ficam salvos em `database/rpg.json`, um objeto por número de usuário.

---

## 🔧 Recursos técnicos

- **Auto-reload de plugins** via `chokidar` — edite um comando e ele atualiza sozinho, sem precisar reiniciar o bot
- **Prefixo por grupo** — cada grupo pode ter um prefixo diferente do global, salvo separadamente
- **Sistema Premium** — usuários marcados como Premium liberam a categoria `plugins/premium/`
- **Resolução de LID/JID** — o WhatsApp às vezes identifica participantes por um ID interno (LID) em vez do número de telefone; o bot tenta resolver isso usando os metadados ao vivo do grupo, pra sempre saber o número real de quem está falando
- **Sistemas anti-x configuráveis por grupo** (link, mídia, figurinha, etc), com liga/desliga independente
- **Modo resenha** — libera comandos de jogos/apostas só quando ativado no grupo

---

## 🩹 Problemas comuns

**O `npm install` falha com erro de dependências:**
```bash
npm install --legacy-peer-deps
```

**Erro relacionado a ffmpeg ao processar figurinha/áudio/vídeo:**
Confirme que o ffmpeg está instalado e acessível no PATH:
```bash
ffmpeg -version
```

**O bot desconecta sozinho / perde a sessão:**
Geralmente é o WhatsApp desconectado no celular ou a sessão expirada. Apague a pasta `database/users` e escaneie o QR Code de novo — você perde só a sessão de conexão, os dados do RPG/config continuam intactos (ficam em arquivos separados).

**Comando não aparece no menu:**
Confira se ele não foi escondido com `.rmcmd` — use `.rncmd nomedocomando` pra trazer de volta.

---

## 🌸 Créditos

- Base original **Hiyuki Supreme V1** por **MisheruModz**
- Customizações, sistema de RPG/economia, jogos e comandos extras por **Henrique**

Licenciado sob [MIT License](./LICENSE).
