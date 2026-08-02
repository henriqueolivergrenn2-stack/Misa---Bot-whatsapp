/*
SAIBA QUE AQUI VC PODE ALTERAR O ESTILO DO MENU! SÓ FAÇA ISSO SE SOUBER OQ VC MESMO ESTÁ FAZENDO.
*/
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MenuSystem {
    constructor(commandManager) {
        this.commandManager = commandManager;
        this.hiddenCommandsFile = './arquivos/json/commandos_ocultos.json';
        this.carregarComandosOcultos();
    }

    carregarComandosOcultos() {
        try {
            if (fs.existsSync(this.hiddenCommandsFile)) {
                this.hiddenCommands = JSON.parse(fs.readFileSync(this.hiddenCommandsFile));
            } else {
                this.hiddenCommands = {};
                fs.writeFileSync(this.hiddenCommandsFile, JSON.stringify({}, null, 2));
            }
        } catch (e) {
            this.hiddenCommands = {};
        }
    }

    salvarComandosOcultos() {
        fs.writeFileSync(this.hiddenCommandsFile, JSON.stringify(this.hiddenCommands, null, 2));
    }

    ocultarComando(categoria, nomeComando) {
        if (!this.hiddenCommands[categoria]) {
            this.hiddenCommands[categoria] = [];
        }
        if (!this.hiddenCommands[categoria].includes(nomeComando)) {
            this.hiddenCommands[categoria].push(nomeComando);
            this.salvarComandosOcultos();
            return true;
        }
        return false;
    }

    restaurarComando(categoria, nomeComando) {
        if (this.hiddenCommands[categoria]) {
            const index = this.hiddenCommands[categoria].indexOf(nomeComando);
            if (index !== -1) {
                this.hiddenCommands[categoria].splice(index, 1);
                this.salvarComandosOcultos();
                return true;
            }
        }
        return false;
    }

    isComandoOculto(categoria, nomeComando) {
        return this.hiddenCommands[categoria] && this.hiddenCommands[categoria].includes(nomeComando);
    }

    getCommandsByFolder(folderName) {
        const todosComandos = this.commandManager.ObterComandosPorCategoria(folderName);
        return todosComandos.filter(cmd => {
            const nomeCmd = cmd.name || cmd.originalName;
            return !this.isComandoOculto(folderName, nomeCmd);
        });
    }

    getConfigMenu() {
        try {
            const caminhoConfig = path.join(__dirname, '../../database/config.json');
            const config = JSON.parse(fs.readFileSync(caminhoConfig));
            return {
                nome: (config.NomeDoBot || 'Bot').toUpperCase(),
                rodape: config.RodapeMenu || '🌸 Bot Multifuncional 🌸'
            };
        } catch (e) {
            return { nome: 'BOT', rodape: '🌸 Bot Multifuncional 🌸' };
        }
    }

    gerarMenuCustom(commands, prefix, titulo, icone) {
        const { nome, rodape } = this.getConfigMenu();

        if (!commands || commands.length === 0) {
            return `╭${icone}─━⛩─━❄━─⛩━─${icone}╮

    『 ${nome} 』
    ${rodape}

╰${icone}─━⛩─━❄━─⛩━─${icone}╯
        ❱❱ ${titulo} ❰❰
╭${icone}━─━─━─${icone}─━─━─━─${icone}╮
│❄╭─⛩✦⛩─╮
│❄│ ❌ NENHUM COMANDO
│❄╰─⛩✦⛩─╮
╰${icone}━─━─━─${icone}─━─━─━─${icone}╯`;
        }

        let output = `╭${icone}─━⛩─━❄━─⛩━─${icone}╮

    『 ${nome} 』
    ${rodape}

╰${icone}─━⛩─━❄━─⛩━─${icone}╯
        ❱❱ ${titulo} ❰❰
╭${icone}━─━─━─${icone}─━─━─━─${icone}╮
│❄╭─⛩✦⛩─╮`;

        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];
            const nomeComando = cmd.name || cmd.originalName;
            output += `\n│❄│${prefix}${nomeComando}`;
        }

        output += `\n│❄╰─⛩✦⛩─╮
╰${icone}━─━─━─${icone}─━─━─━─${icone}╯`;

        return output;
    }

    gerarMenuDesigner(commands, prefix, titulo, iconeEsq = '🌸', iconeDir = '🌸') {
        const { nome, rodape } = this.getConfigMenu();

        if (!commands || commands.length === 0) {
            return `╭${iconeEsq}─━⛩─━❄━─⛩━─${iconeDir}╮

    『 ${nome} 』
    ${rodape}

╰${iconeEsq}─━⛩─━❄━─⛩━─${iconeDir}╯
        ❱❱ ${titulo} ❰❰
╭${iconeEsq}━─━─━─${iconeEsq}─━─━─━─${iconeDir}╮
│❄╭─⛩✦⛩─╮
│❄│ ❌ NENHUM COMANDO
│❄╰─⛩✦⛩─╮
╰${iconeEsq}━─━─━─${iconeEsq}─━─━─━─${iconeDir}╯`;
        }

        let output = `╭${iconeEsq}─━⛩─━❄━─⛩━─${iconeDir}╮

    『 ${nome} 』
    ${rodape}

╰${iconeEsq}─━⛩─━❄━─⛩━─${iconeDir}╯
        ❱❱ ${titulo} ❰❰
╭${iconeEsq}━─━─━─${iconeEsq}─━─━─━─${iconeDir}╮
│❄╭─⛩✦⛩─╮`;

        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];
            const nomeComando = cmd.name || cmd.originalName;
            output += `\n│❄│${prefix}${nomeComando}`;
        }

        output += `\n│❄╰─⛩✦⛩─╮
╰${iconeEsq}━─━─━─${iconeEsq}─━─━─━─${iconeDir}╯`;

        return output;
    }
}

export default MenuSystem;