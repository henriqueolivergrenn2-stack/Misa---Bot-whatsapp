/**
 * Logs
 *
 * @author Dev Gui
 */
import pkg from "../../package.json" with { type: "json" };

const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  cyan:    '\x1b[36m',
  cyanB:   '\x1b[96m',
  magenta: '\x1b[35m',
  blue:    '\x1b[34m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  black:   '\x1b[30m',
  white:   '\x1b[97m',
};

export function sayLog(message) {
  console.log(`${c.cyan}[MISABOT | TALK]${c.reset}`, message);
}

export function inputLog(message) {
  console.log(`${c.black}[MISABOT | INPUT]${c.reset}`, message);
}

export function infoLog(message) {
  console.log(`${c.blue}[MISABOT | INFO]${c.reset}`, message);
}

export function successLog(message) {
  console.log(`${c.green}[MISABOT | SUCCESS]${c.reset}`, message);
}

export function errorLog(message) {
  console.log(`${c.red}[MISABOT | ERROR]${c.reset}`, message);
}

export function warningLog(message) {
  console.log(`${c.yellow}[MISABOT | WARNING]${c.reset}`, message);
}

export function bannerLog() {
  const line = `${c.dim}${c.cyan}${'─'.repeat(56)}${c.reset}`;

  console.log('');
  console.log(line);
  console.log(`${c.cyan}${c.bold}`);
  console.log(`  ███╗   ███╗██╗███████╗ █████╗ ██████╗  ██████╗ ████████╗`);
  console.log(`  ████╗ ████║██║██╔════╝██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝`);
  console.log(`  ██╔████╔██║██║███████╗███████║██████╔╝██║   ██║   ██║   `);
  console.log(`  ██║╚██╔╝██║██║╚════██║██╔══██║██╔══██╗██║   ██║   ██║   `);
  console.log(`  ██║ ╚═╝ ██║██║███████║██║  ██║██████╔╝╚██████╔╝   ██║   `);
  console.log(`  ╚═╝     ╚═╝╚═╝╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝   ╚═╝   `);
  console.log(c.reset);
  console.log(line);
  console.log(`  ${c.magenta}🤖 MisaBot${c.reset}  ${c.dim}│${c.reset}  ${c.yellow}v${pkg.version}${c.reset}  ${c.dim}│${c.reset}  ${c.green}online${c.reset} ✓`);
  console.log(line);
  console.log('');
}
