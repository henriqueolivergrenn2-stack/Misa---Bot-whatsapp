/*   ⚠ ANTES DE TUDO QUERO QUE LEMBRE QUE NAO DEIXO DAREM CONTINUIDADE NA COLUMBINA NEM NA HIYUKI, POIS A COLUMBINA É MINHA BOT ATUAL QUE JÁ ESTÁ NA V2 QUE INCLUSIVE ESSA É A VERSÃO BASE DELA. JÁ A HIYUKI É OUTRA BOT MINHA QUE USEI PRA TEMA DA BASE E PRETENDO DAR CONTINUIDADE POR EU MESMO! ENTÃO USE A BASE PARA FAZER SEU PRÓPRIO BOT COM SEU PRÓPRIO TEMA. ⚠️

            HIYUKI SUPREME V1 

[=====/=====/=====/=====/=====/=====/=====/]
Uma base de bot criada totalmente do zero por mim, MisheruModz</>, focada em desempenho, organizacao e facilidade na criacao de comandos via plugins.

A estrutura foi desenvolvida para deixar tudo mais simples e pratico, permitindo adicionar novas funcoes sem baguncar o sistema. Cada comando funciona em modulos/plugins independentes, deixando a base mais limpa, rapida e facil de editar.

Uma base feita para quem quer criar e evoluir sua bot sem complicacao.

Tudo que peço é que deixem os direitos autorais da base usada na criação do seu/sua bot e o devido criador da base vulgo MisheruModz</>

Criador: MisheruModz</>
Numero: +55 12 98804-7370

Faça um bom proveito da base 😉🌸
[=====/=====/=====/=====/=====/=====/=====/]
*/

import fs from 'fs';
import path from 'path';
import colors from 'colors';
import { CyanLog, RedLog } from './arquivos/js/logger.js';
import { convertWhatsAppUser } from './arquivos/js/userManager.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NucleoDeCmds {
  constructor() {
    this.commands = new Map();
    this.categories = ['admin', 'dono', 'cmds-aleatorios', 'resenha', 'downloads', 'efeitos', 'midias', 'inteligencia-ia', 'rpg', 'premium', 'menu'];
    this.ResenhaAtiva = new Map();
    this.UsuariosPremium = new Set();
    this.CarregarPremium();
    this.CarregarPrefixosGrupo();
    this.CarregarResenhaSalva();

    this.modulosCarregados = new Map();
  }

  CarregarPremium() {
    try {
      if (fs.existsSync('./arquivos/json/premium.json')) {
        const data = JSON.parse(fs.readFileSync('./arquivos/json/premium.json'));
        const users = data.users || [];
        this.UsuariosPremium.clear();
        for (const user of users) {
          if (user && user.endsWith('@s.whatsapp.net')) {
            this.UsuariosPremium.add(user);
          }
        }
        CyanLog(`🌸 Premium carregado: ${this.UsuariosPremium.size} usuarios`);
      } else {
        fs.writeFileSync('./arquivos/json/premium.json', JSON.stringify({ users: [] }, null, 2));
      }
    } catch (e) {
      RedLog('Erro ao carregar premium.json');
      this.UsuariosPremium = new Set();
    }
  }

  SalvarPremium() {
    try {
      const usersToSave = Array.from(this.UsuariosPremium);
      fs.writeFileSync('./arquivos/json/premium.json', JSON.stringify({ users: usersToSave }, null, 2));
      CyanLog(`💾 Premium salvo: ${usersToSave.length} usuarios`);
    } catch (e) {
      RedLog('Erro ao salvar premium.json');
    }
  }

  // Carrega o database/resenha.json direto no Map em memória, no MESMO
  // momento em que o gerenciadorComandos é criado (antes de conectar no
  // WhatsApp e antes de qualquer mensagem ser processada). É por isso que
  // o modo resenha ficava "desativado" depois de reiniciar o bot: antes
  // dessa mudança, o JSON só era relido dentro do próprio comando
  // ".brincadeira", ou seja, se ninguém rodasse ".brincadeira" de novo
  // depois do reinício, o Map continuava vazio e o filtro de comando de
  // resenha (isResenhaCmd) barrava tudo achando que tava desligado.
  CarregarResenhaSalva() {
    try {
      if (fs.existsSync('./database/resenha.json')) {
        const data = JSON.parse(fs.readFileSync('./database/resenha.json'));
        for (const [grupoId, ativo] of Object.entries(data)) {
          this.ResenhaAtiva.set(grupoId, ativo === true);
        }
        CyanLog(`🎐 Modo resenha carregado: ${this.ResenhaAtiva.size} grupo(s)`);
      } else {
        fs.writeFileSync('./database/resenha.json', JSON.stringify({}, null, 2));
      }
    } catch (e) {
      RedLog('Erro ao carregar resenha.json');
    }
  }

  SalvarResenhaAtiva() {
    try {
      const dados = Object.fromEntries(this.ResenhaAtiva);
      fs.writeFileSync('./database/resenha.json', JSON.stringify(dados, null, 2));
    } catch (e) {
      RedLog('Erro ao salvar resenha.json');
    }
  }

  normalizar(userId) {
    if (!userId) return null;
    if (userId.endsWith('@s.whatsapp.net')) {
      return userId;
    }
    try {
      const convertido = convertWhatsAppUser(userId, 'jid');
      if (convertido && typeof convertido === 'string' && convertido.endsWith('@s.whatsapp.net')) {
        return convertido;
      }
    } catch(e) {}
    if (userId.endsWith('@lid')) {
      const numero = userId.replace('@lid', '');
      if (numero && numero.length >= 10) {
        return `${numero}@s.whatsapp.net`;
      }
    }
    if (!userId.includes('@') && userId.length >= 10) {
      return `${userId}@s.whatsapp.net`;
    }
    return null;
  }

  addPremium(userId) {
    if (!userId) return false;

    let normalizedJid = userId;
    if (!userId.includes('@s.whatsapp.net')) {
      normalizedJid = this.normalizar(userId);
      if (!normalizedJid) {
        RedLog(`Formato invalido para premium: ${userId}`);
        return false;
      }
    }

    if (!this.UsuariosPremium.has(normalizedJid)) {
      this.UsuariosPremium.add(normalizedJid);
      this.SalvarPremium();
      CyanLog(`✨ Usuario premium adicionado: ${normalizedJid}`);
      return true;
    }
    return false;
  }

  removePremium(userId) {
    if (!userId) return false;
    const normalizedJid = this.normalizar(userId);
    if (!normalizedJid) {
      return false;
    }
    if (this.UsuariosPremium.has(normalizedJid)) {
      this.UsuariosPremium.delete(normalizedJid);
      this.SalvarPremium();
      CyanLog(`🗑️ Usuario premium removido: ${normalizedJid}`);
      return true;
    }
    return false;
  }

  isPremium(userId, donoId) {
    if (!userId) return false;
    const normalizedUserId = this.normalizar(userId);
    if (!normalizedUserId) return false;
    let normalizedDonoId = donoId;
    if (donoId && !donoId.includes('@')) {
      normalizedDonoId = `${donoId}@s.whatsapp.net`;
    }
    if (normalizedUserId === normalizedDonoId) return true;
    return this.UsuariosPremium.has(normalizedUserId);
  }

  getPremiumUsers() {
    return Array.from(this.UsuariosPremium);
  }

  CarregarPrefixosGrupo() {
    try {
      if (fs.existsSync('./arquivos/json/prefixos_grupo.json')) {
        const data = JSON.parse(fs.readFileSync('./arquivos/json/prefixos_grupo.json'));
        // Proteção: esse arquivo já foi encontrado corrompido como "[]" (Array).
        // Nesse formato, JSON.stringify ignora as propriedades não-numéricas
        // que a gente salva (os prefixos por grupo), então tudo era perdido
        // silenciosamente ao salvar. Se não vier um objeto "de verdade",
        // reseta pra {} pra nunca mais cair nessa armadilha.
        const valido = data && typeof data === 'object' && !Array.isArray(data);
        this.prefixosGrupo = valido ? data : {};
        if (!valido) {
          RedLog('⚠️ prefixos_grupo.json estava corrompido (formato array) — resetado para objeto vazio.');
          this.SalvarPrefixosGrupo();
        }
        CyanLog(`📋 Carregados ${Object.keys(this.prefixosGrupo).length} prefixos de grupos`);
      } else {
        this.prefixosGrupo = {};
        fs.writeFileSync('./arquivos/json/prefixos_grupo.json', JSON.stringify({}, null, 2));
      }
    } catch (e) {
      RedLog('Erro ao carregar prefixos_grupo.json');
      this.prefixosGrupo = {};
    }
  }

  SalvarPrefixosGrupo() {
    try {
      fs.writeFileSync('./arquivos/json/prefixos_grupo.json', JSON.stringify(this.prefixosGrupo, null, 2));
    } catch (e) {
      RedLog('Erro ao salvar prefixos_grupo.json');
    }
  }

  ObterPrefixoGrupo(groupId) {
    return this.prefixosGrupo[groupId] || null;
  }

  DefinirPrefixoGrupo(groupId, prefixo) {
    if (!prefixo || prefixo.length !== 1) {
      return false;
    }
    if (!this.prefixosGrupo || typeof this.prefixosGrupo !== 'object' || Array.isArray(this.prefixosGrupo)) {
      this.prefixosGrupo = {};
    }
    this.prefixosGrupo[groupId] = prefixo;
    this.SalvarPrefixosGrupo();
    return true;
  }

  RemoverPrefixoGrupo(groupId) {
    if (this.prefixosGrupo[groupId]) {
      delete this.prefixosGrupo[groupId];
      this.SalvarPrefixosGrupo();
      return true;
    }
    return false;
  }

  limparCacheModulo(filePath) {
    try {
      if (this.modulosCarregados.has(filePath)) {
        this.modulosCarregados.delete(filePath);
      }
      const cache = globalThis[Symbol.for('nodejs.util.require.cache')];
      if (cache) {
        const key = `file://${filePath}`;
        if (cache[key]) {
          delete cache[key];
          CyanLog(`🧹 Cache Node removido: ${path.basename(filePath)}`);
        }
      }
    } catch (e) {
    }
  }

  async carregarPlugins(forceReload = false) {
    CyanLog(`📂 Carregando plugins... ${forceReload ? '(FORÇADO)' : ''}`);
    
    if (forceReload) {
      CyanLog('🔄 Forçando recarregamento de todos os plugins...');
      this.commands.clear();
      this.modulosCarregados.clear();
    }
    
    let totalCarregado = 0;
    const pluginsCarregados = [];
    
    const carregarDaPasta = async (dir, category) => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          await carregarDaPasta(fullPath, category);
        } else if (file.endsWith('.js')) {
          try {
            if (forceReload) {
              this.limparCacheModulo(fullPath);
            }

            const timestamp = Date.now();
            const fullPathUrl = `file://${fullPath}?t=${timestamp}`;
            
            const plugin = await import(fullPathUrl);
            const pluginData = plugin.default || plugin;
            
            if (pluginData.name && pluginData.execute) {
              const nomeNormalizado = pluginData.name.toLowerCase();

              if (this.commands.has(nomeNormalizado)) {
                this.commands.delete(nomeNormalizado);
              }
              
              if (pluginData.aliases && Array.isArray(pluginData.aliases)) {
                for (const alias of pluginData.aliases) {
                  const aliasNormalizado = alias.toLowerCase();
                  if (this.commands.has(aliasNormalizado)) {
                    this.commands.delete(aliasNormalizado);
                  }
                }
              }
              
              this.commands.set(nomeNormalizado, {
                ...pluginData,
                name: nomeNormalizado,
                category,
                file: fullPath,
                module: plugin
              });
              
              if (pluginData.aliases && Array.isArray(pluginData.aliases)) {
                for (const alias of pluginData.aliases) {
                  const aliasNormalizado = alias.toLowerCase();
                  if (!this.commands.has(aliasNormalizado)) {
                    this.commands.set(aliasNormalizado, {
                      ...pluginData,
                      name: aliasNormalizado,
                      category,
                      file: fullPath,
                      isAlias: true,
                      originalName: nomeNormalizado,
                      module: plugin
                    });
                  }
                }
              }
              
              this.modulosCarregados.set(fullPath, {
                timestamp,
                name: pluginData.name,
                category
              });
              
              CyanLog(`🌸 Comando ${forceReload ? 'recarregado' : 'carregado'}: ${pluginData.name} (${category})`);
              totalCarregado++;
              pluginsCarregados.push(pluginData.name);
            } else {
              RedLog(`❌ Plugin invalido: ${file} - faltando name ou execute`);
            }
          } catch (e) {
            RedLog(`❌ Erro ao carregar ${file}: ${e.message}`);
          }
        }
      }
    };
    
    for (const category of this.categories) {
      const pluginDir = path.join(__dirname, 'plugins', category);
      await carregarDaPasta(pluginDir, category);
    }
    
    CyanLog(`🌸🎐 Total de comandos ${forceReload ? 'recarregados' : 'carregados'}: ${totalCarregado} ❄️🧊`);
    if (forceReload) {
      CyanLog(`📋 Comandos recarregados: ${pluginsCarregados.join(', ') || 'nenhum'}`);
    }
  }

  ResenhaAtiva(grupoId) {
    return this.ResenhaAtiva.get(grupoId) === true;
  }

  DefinirResenhaAtiva(grupoId, ativa) {
    this.ResenhaAtiva.set(grupoId, ativa);
    this.SalvarResenhaAtiva();
  }

  ObterComando(cmd) {
    return this.commands.get((cmd || '').toLowerCase());
  }

  // Retorna o módulo (com os exports nomeados, ex: temJogoAtivo, processarLetra)
  // da MESMA instância usada pra rodar o comando via plugin, evitando estado duplicado.
  ObterModulo(cmd) {
    return this.commands.get((cmd || '').toLowerCase())?.module || null;
  }

  ObterTodosComandos() {
    return Array.from(this.commands.values());
  }

  ObterComandosPorCategoria(category) {
    return this.ObterTodosComandos().filter(cmd => cmd.category === category && !cmd.isAlias);
  }
}

export default NucleoDeCmds;