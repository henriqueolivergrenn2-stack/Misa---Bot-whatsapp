/**
 * _rpgData.js — Dados e helpers compartilhados do RPG
 * Colocar em: src/commands/member/rpg/_rpgData.js
 *
 * O prefixo _ exclui este arquivo do carregamento de comandos
 * (readDirectoryRecursive ignora arquivos que começam com _)
 */

// ─── CLASSES ──────────────────────────────────────────────────────────────────
export const CLASSES = {
  guerreiro: {
    nome: "Guerreiro", emoji: "⚔️",
    hp: 150, atk: 20, def: 15, mp: 30,
    hab: "Golpe Devastador", habDesc: "Ataca com 3x de dano",
    habMult: 3.0,
    desc: "Alta defesa e HP. Ideal para iniciantes.",
  },
  mago: {
    nome: "Mago", emoji: "🔮",
    hp: 80, atk: 35, def: 5, mp: 100,
    hab: "Bola de Fogo", habDesc: "Ataque mágico que causa 4x de dano",
    habMult: 4.0,
    desc: "Altíssimo dano mágico, mas muito frágil.",
  },
  arqueiro: {
    nome: "Arqueiro", emoji: "🏹",
    hp: 100, atk: 28, def: 10, mp: 50,
    hab: "Chuva de Flechas", habDesc: "Causa 2.5x de dano",
    habMult: 2.5,
    desc: "Dano consistente e mobilidade alta.",
  },
  assassino: {
    nome: "Assassino", emoji: "🗡️",
    hp: 90, atk: 40, def: 6, mp: 60,
    hab: "Golpe Crítico", habDesc: "50% de chance de matar o inimigo instantaneamente",
    habMult: 1.0,
    desc: "Extremo dano, alto risco. Para experientes.",
  },
  curandeiro: {
    nome: "Curandeiro", emoji: "💚",
    hp: 110, atk: 15, def: 12, mp: 80,
    hab: "Cura Divina", habDesc: "Recupera 80% do HP máximo",
    habMult: 0,
    desc: "Suporte e sobrevivência elevada.",
  },
  berserker: {
    nome: "Berserker", emoji: "💢",
    hp: 130, atk: 45, def: 3, mp: 20,
    hab: "Fúria Total", habDesc: "Ataca com 2x de dano ignorando defesa",
    habMult: 2.0,
    desc: "Destruição pura. Quase sem defesa.",
  },
};

// ─── MONSTROS ─────────────────────────────────────────────────────────────────
export const MONSTROS = [
  { nome: "Rato Gigante",        emoji: "🐀", hp: 30,  atk: 5,  def: 0,  xp: 50,  oMin: 30,  oMax: 80   },
  { nome: "Lobo Selvagem",       emoji: "🐺", hp: 55,  atk: 10, def: 3,  xp: 100, oMin: 60,  oMax: 150  },
  { nome: "Escorpião Venenoso",  emoji: "🦂", hp: 70,  atk: 15, def: 5,  xp: 150, oMin: 80,  oMax: 200  },
  { nome: "Zumbi",               emoji: "🧟", hp: 90,  atk: 18, def: 4,  xp: 200, oMin: 100, oMax: 250  },
  { nome: "Dragão Jovem",        emoji: "🐲", hp: 130, atk: 25, def: 10, xp: 350, oMin: 200, oMax: 500  },
  { nome: "Esqueleto Guerreiro", emoji: "💀", hp: 80,  atk: 20, def: 8,  xp: 220, oMin: 120, oMax: 280  },
  { nome: "Mago Sombrio",        emoji: "🧙", hp: 60,  atk: 30, def: 2,  xp: 280, oMin: 150, oMax: 350  },
  { nome: "Ogro",                emoji: "👹", hp: 160, atk: 22, def: 15, xp: 300, oMin: 180, oMax: 400  },
  { nome: "Vampiro",             emoji: "🦇", hp: 100, atk: 28, def: 7,  xp: 320, oMin: 200, oMax: 450  },
  { nome: "Dragão Ancião",       emoji: "🐉", hp: 250, atk: 45, def: 20, xp: 800, oMin: 500, oMax: 1200 },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export function hpBar(hp, max) {
  const pct    = Math.min(Math.max(hp / max, 0), 1);
  const filled = Math.round(pct * 10);
  const cor    = pct > 0.6 ? "🟩" : pct > 0.3 ? "🟨" : "🟥";
  return cor.repeat(filled) + "⬛".repeat(10 - filled) + " " + hp + "/" + max;
}

export function xpParaSubir(level) {
  return level * 200;
}

export function levelUp(rpg) {
  let leveled = false;
  while (rpg.xp >= xpParaSubir(rpg.level)) {
    rpg.xp    -= xpParaSubir(rpg.level);
    rpg.level++;
    const cl   = CLASSES[rpg.classe];
    rpg.maxHp  = Math.floor(cl.hp  + (rpg.level - 1) * 15);
    rpg.maxMp  = Math.floor(cl.mp  + (rpg.level - 1) * 8);
    rpg.atk    = Math.floor(cl.atk + (rpg.level - 1) * 3);
    rpg.def    = Math.floor(cl.def + (rpg.level - 1) * 2);
    rpg.hp     = rpg.maxHp;
    rpg.mp     = rpg.maxMp;
    leveled    = true;
  }
  return leveled;
}

/**
 * Parseia fullArgs por espaços — corrige o bug do args[] do bot
 * que usa \, |, / como separadores em vez de espaço.
 *
 * .rpg criar Rimuro Mago → fullArgs = "criar Rimuro Mago"
 *   partes = ["criar", "Rimuro", "Mago"]
 */
export function parseParts(fullArgs) {
  return (fullArgs || "").trim().split(/\s+/).filter(Boolean);
}
