import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import webp from 'node-webpmux';

const execFileAsync = promisify(execFile);

// Lista de fontes candidatas (a primeira que existir no sistema é usada).
// Recomendo colocar sua própria fonte em arquivos/fonts/font.ttf — assim
// funciona igual em qualquer ambiente (Termux, VPS, etc).
const CANDIDATOS_FONTE = [
  path.resolve('./arquivos/fonts/font.ttf'),
  '/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
  '/data/data/com.termux/files/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  '/system/fonts/Roboto-Bold.ttf',
  '/system/fonts/DroidSans-Bold.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
];

let fontePathCache = null;

function getFontPath() {
  if (fontePathCache) return fontePathCache;
  for (const candidato of CANDIDATOS_FONTE) {
    if (candidato && fs.existsSync(candidato)) {
      fontePathCache = candidato;
      return fontePathCache;
    }
  }
  throw new Error(
    'Nenhuma fonte (.ttf) encontrada pro comando ttp!\n\nCrie a pasta "arquivos/fonts" e coloque um arquivo chamado "font.ttf" dentro (qualquer fonte .ttf serve, ex: DejaVuSans-Bold.ttf) e tente de novo.'
  );
}

// Escapa caracteres especiais do filtro drawtext do ffmpeg
function escapeDrawtext(texto) {
  return String(texto)
    .replace(/\\/g, '\\\\\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, '\u2019')
    .replace(/%/g, '\\%');
}

function quebrarLinhas(texto, maxPorLinha = 14, maxLinhas = 6) {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);
  const linhas = [];
  let atual = '';
  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (tentativa.length > maxPorLinha && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas.slice(0, maxLinhas);
}

function montarTextoDrawtext(texto) {
  const linhas = quebrarLinhas(texto).map(escapeDrawtext);
  return linhas.join('\\n');
}

function tempFile(ext) {
  return path.join(tmpdir(), `ttp_${crypto.randomBytes(6).toString('hex')}.${ext}`);
}

/**
 * Gera 1 frame PNG 512x512 com a frase desenhada.
 * transparente:true = fundo 100% transparente de verdade (canal alpha real,
 * sem truque de "chroma key" com branco — por isso não fica halo/borda clara).
 * transparente:false = fundo sólido opaco na cor indicada em corFundo.
 */
async function gerarFramePNG({ texto, corFundo = 'white', corTexto = 'black', tamanhoFonte = 58, transparente = false }) {
  const fontFile = getFontPath();
  const textoFormatado = montarTextoDrawtext(texto);
  const outPath = tempFile('png');
  const fundo = transparente ? 'color=c=black@0.0:s=512x512' : `color=c=${corFundo}:s=512x512`;

  try {
    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-f', 'lavfi',
        '-i', fundo,
        '-frames:v', '1',
        '-vf',
        `drawtext=fontfile='${fontFile}':text='${textoFormatado}':fontcolor=${corTexto}:fontsize=${tamanhoFonte}:x=(w-text_w)/2:y=(h-text_h)/2:line_spacing=14`,
        '-pix_fmt', 'rgba',
        outPath,
      ],
      { timeout: 30000 }
    );

    return fs.readFileSync(outPath);
  } finally {
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  }
}

// Gera um frame "vazio" (só o fundo, sem texto nenhum) — usado no piscar
async function gerarFrameFundo({ corFundo = 'white', transparente = false } = {}) {
  const outPath = tempFile('png');
  const fundo = transparente ? 'color=c=black@0.0:s=512x512' : `color=c=${corFundo}:s=512x512`;

  try {
    await execFileAsync(
      'ffmpeg',
      ['-y', '-f', 'lavfi', '-i', fundo, '-frames:v', '1', '-pix_fmt', 'rgba', outPath],
      { timeout: 15000 }
    );
    return fs.readFileSync(outPath);
  } finally {
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  }
}

// Junta vários frames PNG num mp4 curto e mudo (só serve pra fundo OPACO —
// mp4/h264 não tem canal alpha, então isso nunca deve ser usado com frames
// transparentes, senão o "sem fundo" vira fundo preto).
async function gerarVideoDeFrames(framesBuffers, { fps = 2 } = {}) {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'ttp_frames_'));
  const outPath = tempFile('mp4');

  try {
    framesBuffers.forEach((buf, i) => {
      fs.writeFileSync(path.join(dir, `f${String(i).padStart(3, '0')}.png`), buf);
    });

    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-framerate', String(fps),
        '-i', path.join(dir, 'f%03d.png'),
        '-vf', 'format=yuv420p',
        '-c:v', 'libx264',
        '-movflags', '+faststart',
        outPath,
      ],
      { timeout: 60000 }
    );

    return fs.readFileSync(outPath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  }
}

// Junta frames PNG com alpha real direto num webp animado (com transparência
// de verdade, sem passar por mp4 — é o libwebp que já suporta animação+alpha).
async function gerarWebpAnimadoTransparente(framesBuffers, { fps = 2 } = {}) {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'ttp_webp_'));
  const outPath = tempFile('webp');

  try {
    framesBuffers.forEach((buf, i) => {
      fs.writeFileSync(path.join(dir, `f${String(i).padStart(3, '0')}.png`), buf);
    });

    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-framerate', String(fps),
        '-i', path.join(dir, 'f%03d.png'),
        '-loop', '0',
        '-an', '-vsync', '0',
        '-pix_fmt', 'yuva420p',
        '-c:v', 'libwebp',
        outPath,
      ],
      { timeout: 60000 }
    );

    return fs.readFileSync(outPath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  }
}

// Converte 1 frame PNG com alpha real num webp estático transparente
async function gerarWebpEstaticoTransparente(frameBuffer) {
  const tmpIn = tempFile('png');
  const outPath = tempFile('webp');

  try {
    fs.writeFileSync(tmpIn, frameBuffer);
    await execFileAsync(
      'ffmpeg',
      ['-y', '-i', tmpIn, '-pix_fmt', 'yuva420p', outPath],
      { timeout: 20000 }
    );
    return fs.readFileSync(outPath);
  } finally {
    if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  }
}

// Injeta o EXIF (packname/author) num webp já pronto e envia como figurinha
async function enviarStickerWebp(columbina, from, info, bufferWebp, metadata = {}) {
  const tmpFileIn = tempFile('webp');
  const tmpFileOut = tempFile('webp');
  fs.writeFileSync(tmpFileIn, bufferWebp);

  try {
    const img = new webp.Image();
    const json = {
      'sticker-pack-id': 'MISHERUMODZ',
      'sticker-pack-name': metadata.packname || 'Sticker Bot',
      'sticker-pack-publisher': metadata.author || 'WhatsApp Bot',
      emojis: metadata.categories || ['🎨'],
    };
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);

    await img.load(tmpFileIn);
    img.exif = exif;
    await img.save(tmpFileOut);

    const finalBuffer = fs.readFileSync(tmpFileOut);
    await columbina.sendMessage(from, { sticker: finalBuffer }, { quoted: info });
  } finally {
    if (fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn);
    if (fs.existsSync(tmpFileOut)) fs.unlinkSync(tmpFileOut);
  }
}

export {
  gerarFramePNG,
  gerarFrameFundo,
  gerarVideoDeFrames,
  gerarWebpAnimadoTransparente,
  gerarWebpEstaticoTransparente,
  enviarStickerWebp,
  getFontPath,
};
