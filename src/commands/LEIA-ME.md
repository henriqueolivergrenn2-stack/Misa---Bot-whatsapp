# 📦 Pacote de Comandos — Takeshi Bot

## 📁 Estrutura

```
src/
├── utils/
│   └── economy.js          ← Motor de economia (NÃO é comando)
│
├── commands/
│   ├── member/
│   │   ├── gold/           ← Todos os comandos de economia
│   │   │   ├── saldo.js
│   │   │   ├── daily.js
│   │   │   ├── work.js
│   │   │   ├── mine.js
│   │   │   ├── fish.js     ← NOVO
│   │   │   ├── hunt.js     ← NOVO
│   │   │   ├── crime.js
│   │   │   ├── roubar.js
│   │   │   ├── slot.js
│   │   │   ├── coinflip.js
│   │   │   ├── blackjack.js (está em jogos/)
│   │   │   ├── roleta.js    (está em jogos/)
│   │   │   ├── loja.js
│   │   │   ├── comprar.js
│   │   │   ├── inventario.js
│   │   │   ├── depositar.js
│   │   │   ├── sacar.js
│   │   │   ├── transferir.js
│   │   │   ├── rankgold.js
│   │   │   └── quiz.js     ← NOVO
│   │   │
│   │   ├── jogos/
│   │   │   ├── forca.js
│   │   │   ├── blackjack.js
│   │   │   ├── roleta.js
│   │   │   ├── duelo.js    ← NOVO (PvP)
│   │   │   ├── dado.js
│   │   │   └── sorteio.js
│   │   │
│   │   ├── rpg/
│   │   │   └── rpg.js      ← Sistema RPG completo
│   │   │
│   │   ├── utilidades/
│   │   │   ├── calcular.js
│   │   │   ├── bhaskara.js
│   │   │   ├── morse.js
│   │   │   ├── gerarqr.js
│   │   │   ├── piada.js
│   │   │   ├── chance.js
│   │   │   ├── caraoucoroa.js
│   │   │   ├── enquete.js
│   │   │   ├── gerarcpf.js
│   │   │   └── anagrama.js
│   │   │
│   │   └── funny/
│   │       ├── ship.js
│   │       ├── rankbct.js
│   │       └── casal.js
│   │
│   ├── admin/
│   │   ├── addgold.js      ← Gerenciar gold (admin)
│   │   └── sorteiomembro.js
│   │
│   └── owner/
│       (sem novos comandos owner neste pacote)
```

## ⚠️ IMPORTANTE — economy.js

O arquivo `src/utils/economy.js` é o **motor de toda a economia**.
NÃO coloque ele dentro de `src/commands/` — o Takeshi trata todo .js
dentro de commands como um comando e vai dar erro no Termux!

**Caminho correto:** `src/utils/economy.js`

Todos os comandos de gold, jogos e RPG importam de:
```js
import { ... } from "../../../utils/economy.js";
// ou
import { ... } from "../../utils/economy.js";  // (para admin/)
```

## 🎮 RPG — Comandos

| Comando | Descrição |
|---------|-----------|
| `.rpg classes` | Ver todas as classes |
| `.rpg criar <nome> <classe>` | Criar personagem |
| `.rpg status` | Ver stats do personagem |
| `.rpg aventura` | Ir aventurar (cooldown 5min) |
| `.rpg aventura hab` | Aventurar usando habilidade especial |
| `.rpg descansar` | Recuperar 50% HP (cd 30min) |
| `.rpg top` | Ranking RPG |

## 💰 Gold — Comandos

| Comando | Cooldown | Ganho |
|---------|----------|-------|
| `.daily` | 24h | 600-1400 🪙 |
| `.work` | 30min | 200-700 🪙 |
| `.mine` | 1h | 120-1050 🪙 |
| `.fish` | 45min | 100-1800 🪙 |
| `.hunt` | 1h30 | 150-3200 🪙 |
| `.crime` | 45min | ±150-1800 🪙 |
| `.roubar @` | 2h | ±25% gold vítima |
| `.quiz` | 3min | 150-300 🪙 |
