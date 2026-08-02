/*
Creator: @MisheruModz</>
Base: Hiyuki Supreme V2
Atualizada para ESM
Deixa a merda dos créditos se for usar esse arquivo em outros bots
*/

import crypto from 'crypto'
import https from 'https'

export const Misheru = {
async uploadParaServidor(conn, buffer, options) {
const {
hkdf,
mediaPath,
mediaKey = crypto.randomBytes(32)
} = options

const expandido = Buffer.from(
crypto.hkdfSync(
'sha256',
mediaKey,
Buffer.alloc(32),
Buffer.from(hkdf),
112
)
)

const iv = expandido.subarray(0, 16)
const chaveCifra = expandido.subarray(16, 48)
const chaveMac = expandido.subarray(48, 80)

const cifra = crypto.createCipheriv('aes-256-cbc', chaveCifra, iv)

const criptografado = Buffer.concat([
cifra.update(buffer),
cifra.final()
])

const mac = crypto
.createHmac('sha256', chaveMac)
.update(iv)
.update(criptografado)
.digest()
.subarray(0, 10)

const bufferCriptografado = Buffer.concat([criptografado, mac])

const sha256Arquivo = crypto.createHash('sha256').update(buffer).digest()
const sha256ArquivoCriptografado = crypto.createHash('sha256').update(bufferCriptografado).digest()

const iq = await conn.query({
tag: 'iq',
attrs: {
id: conn.generateMessageTag?.() ?? Date.now().toString(),
to: 's.whatsapp.net',
type: 'set',
xmlns: 'w:m'
},
content: [{
tag: 'media_conn',
attrs: {}
}]
})

const conexaoMedia = iq.content?.find(v => v.tag === 'media_conn')
if (!conexaoMedia) throw new Error('Conexão de mídia não encontrada')

const auth = conexaoMedia.attrs?.auth
if (!auth) throw new Error('Autenticação não encontrada')

const hosts = (conexaoMedia.content || [])
.filter(v => v.tag === 'host')
.map(v => v.attrs?.hostname)
.filter(Boolean)

if (!hosts.length) throw new Error('Host de upload não encontrado')

const token = encodeURIComponent(
sha256ArquivoCriptografado
.toString('base64')
.replace(/\+/g, '-')
.replace(/\//g, '_')
.replace(/=+$/g, '')
)

let ultimoErro

for (const host of hosts) {
try {
const json = await new Promise((resolve, reject) => {
const url = new URL(
`https://${host}${mediaPath}/${token}?auth=${encodeURIComponent(auth)}&token=${token}`
)

const req = https.request({
hostname: url.hostname,
port: 443,
path: url.pathname + url.search,
method: 'POST',
headers: {
Origin: 'https://web.whatsapp.com',
Referer: 'https://web.whatsapp.com/',
'Content-Type': 'application/octet-stream',
'Content-Length': bufferCriptografado.length
}
}, res => {
let corpo = ''
res.on('data', c => corpo += c)
res.on('end', () => {
if (res.statusCode < 200 || res.statusCode >= 300)
return reject(new Error(`Upload falhou ${res.statusCode}: ${corpo}`))

try {
resolve(JSON.parse(corpo))
} catch {
reject(new Error(`Resposta não é JSON: ${corpo}`))
}
})
})

req.on('error', reject)
req.write(bufferCriptografado)
req.end()
})

const caminhoDireto = json.direct_path ?? json.directPath

if (!caminhoDireto)
throw new Error('Resposta de upload incompleta (faltou direct_path): ' + JSON.stringify(json))

let mediaUrl = json.url ?? json.mediaUrl

if (!mediaUrl || mediaUrl.startsWith('/')) {
mediaUrl = `https://${host}${caminhoDireto}`
}

return {
mediaKey: mediaKey,
tamanhoArquivo: buffer.length,
sha256Arquivo: sha256Arquivo,
sha256ArquivoCriptografado: sha256ArquivoCriptografado,
caminhoDireto: caminhoDireto,
directPath: caminhoDireto,
url: mediaUrl,
fileSha256: sha256Arquivo,
fileEncSha256: sha256ArquivoCriptografado
}

} catch (e) {
ultimoErro = e
}
}

throw ultimoErro ?? new Error('Todos os hosts de upload falharam')
},

async uploadFigurinha(conn, buffer, mediaKey) {
return await this.uploadParaServidor(conn, buffer, {
hkdf: 'WhatsApp Sticker Pack Keys',
mediaPath: '/mms/sticker-pack',
mediaKey
})
},

async uploadImagem(conn, buffer, mediaKey) {
return await this.uploadParaServidor(conn, buffer, {
hkdf: 'WhatsApp Image Keys',
mediaPath: '/mms/image',
mediaKey
})
},

async uploadVideo(conn, buffer, mediaKey) {
return await this.uploadParaServidor(conn, buffer, {
hkdf: 'WhatsApp Video Keys',
mediaPath: '/mms/video',
mediaKey
})
},

async uploadAudio(conn, buffer, mediaKey) {
return await this.uploadParaServidor(conn, buffer, {
hkdf: 'WhatsApp Audio Keys',
mediaPath: '/mms/audio',
mediaKey
})
},

async uploadDocumento(conn, buffer, mediaKey) {
return await this.uploadParaServidor(conn, buffer, {
hkdf: 'WhatsApp Document Keys',
mediaPath: '/mms/document',
mediaKey
})
}
}

export const uploadParaServidor = Misheru.uploadParaServidor.bind(Misheru)
export const uploadFigurinha = Misheru.uploadFigurinha.bind(Misheru)
export const uploadImagem = Misheru.uploadImagem.bind(Misheru)
export const uploadVideo = Misheru.uploadVideo.bind(Misheru)
export const uploadAudio = Misheru.uploadAudio.bind(Misheru)
export const uploadDocumento = Misheru.uploadDocumento.bind(Misheru)

export default Misheru