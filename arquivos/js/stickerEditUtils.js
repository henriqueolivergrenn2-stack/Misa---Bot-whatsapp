import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import webp from 'node-webpmux';

const execFileAsync = promisify(execFile);

function tempFile(ext) {
  return path.join(tmpdir(), `stkedit_${crypto.randomBytes(6).toString('hex')}.${ext}`);
}

function tempDir() {
  return fs.mkdtempSync(path.join(tmpdir(), 'stkedit_'));
}

/**
 * Aplica um filtro ffmpeg num único frame estático de webp (o ffmpeg desse
 * Termux não sabe decodificar webp ANIMADO, mas frame estático funciona bem).
 */
async function aplicarFiltroFrame(bufferEntrada, filtroFfmpeg) {
  const tmpIn = tempFile('webp');
  const tmpOut = tempFile('webp');
  fs.writeFileSync(tmpIn, bufferEntrada);

  const args = ['-y', '-i', tmpIn, '-vf', filtroFfmpeg, '-c:v', 'libwebp', '-preset', 'default', '-an', '-vsync', '0', tmpOut];

  try {
    await execFileAsync('ffmpeg', args, { timeout: 30000 });
    return fs.readFileSync(tmpOut);
  } finally {
    if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  }
}

// Filtros que mexem em pixel (precisam rodar frame a frame numa animação)
const FILTROS_ESPACIAIS = {
  girar: 'transpose=1,format=yuva420p',
  espelhar: 'hflip,format=yuva420p',
  circulo: "format=yuva420p,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(pow(X-W/2,2)+pow(Y-H/2,2),pow(min(W,H)/2,2)),255,0)'",
};

// Extrai um único frame de uma animação (já como webp estático) pra um
// arquivo temporário, e devolve o caminho dele.
async function extrairFrame(img, indice) {
  const dir = tempDir();
  try {
    await img.demux(dir, { frame: indice });
    const arquivos = fs.readdirSync(dir);
    if (!arquivos.length) throw new Error(`Não consegui extrair o frame ${indice} da animação.`);
    const destino = tempFile('webp');
    fs.copyFileSync(path.join(dir, arquivos[0]), destino);
    return destino;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Aplica uma edição num sticker webp (estático ou animado) e devolve o
 * buffer do webp editado.
 *
 * `acao` é uma das chaves de FILTROS_ESPACIAIS, ou: 'acelerar', 'lento',
 * 'inverter', 'congelar'.
 */
async function aplicarFiltroWebp(bufferEntrada, acao) {
  const tmpIn = tempFile('webp');
  fs.writeFileSync(tmpIn, bufferEntrada);

  const img = new webp.Image();

  try {
    await img.load(tmpIn);

    const animado = img.hasAnim ?? (Array.isArray(img.frames) && img.frames.length > 1);

    // Filtro espacial (gira/espelha/recorta): mexe em pixel, roda por frame.
    if (FILTROS_ESPACIAIS[acao]) {
      const filtro = FILTROS_ESPACIAIS[acao];
      if (!animado) return aplicarFiltroFrame(bufferEntrada, filtro);

      const total = img.frames.length;
      for (let i = 0; i < total; i++) {
        const framePath = await extrairFrame(img, i);
        let editadoPath;
        try {
          const editadoBuf = await aplicarFiltroFrame(fs.readFileSync(framePath), filtro);
          editadoPath = tempFile('webp');
          fs.writeFileSync(editadoPath, editadoBuf);
          await img.replaceFrame(i, editadoPath);
        } finally {
          if (fs.existsSync(framePath)) fs.unlinkSync(framePath);
          if (editadoPath && fs.existsSync(editadoPath)) fs.unlinkSync(editadoPath);
        }
      }

      const tmpOut = tempFile('webp');
      await img.save(tmpOut);
      const resultado = fs.readFileSync(tmpOut);
      fs.unlinkSync(tmpOut);
      return resultado;
    }

    // Congelar: pega só um frame e devolve como figurinha estática.
    if (acao === 'congelar') {
      if (!animado) return bufferEntrada;
      const framePath = await extrairFrame(img, 0);
      try {
        return await aplicarFiltroFrame(fs.readFileSync(framePath), 'format=yuva420p');
      } finally {
        if (fs.existsSync(framePath)) fs.unlinkSync(framePath);
      }
    }

    // Timing/ordem dos frames: não mexe em pixel nenhum, só nos metadados.
    if (!animado) return bufferEntrada; // nada a acelerar/inverter numa imagem estática

    if (acao === 'acelerar') {
      img.frames.forEach((f) => { f.delay = Math.max(10, Math.round(f.delay / 2)); });
    } else if (acao === 'lento') {
      img.frames.forEach((f) => { f.delay = Math.round(f.delay * 2); });
    } else if (acao === 'inverter') {
      img.frames.reverse();
    } else {
      throw new Error(`Ação de edição desconhecida: ${acao}`);
    }

    const tmpOut = tempFile('webp');
    await img.save(tmpOut);
    const resultado = fs.readFileSync(tmpOut);
    fs.unlinkSync(tmpOut);
    return resultado;
  } finally {
    if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
  }
}

export { aplicarFiltroWebp };
