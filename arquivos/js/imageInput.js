// Extrai o buffer da imagem de uma mensagem: cobre imagem enviada direto,
// imagem respondida (quoted) e variações de "ver uma vez" (viewOnce).
export async function extrairImagemDaMensagem(info, getFileBuffer) {
    const quotedMsg = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    const imagemMsg =
        quotedMsg?.imageMessage ||
        info.message?.imageMessage ||
        quotedMsg?.viewOnceMessageV2?.message?.imageMessage ||
        info.message?.viewOnceMessageV2?.message?.imageMessage ||
        quotedMsg?.viewOnceMessage?.message?.imageMessage ||
        info.message?.viewOnceMessage?.message?.imageMessage;

    if (!imagemMsg) return null;

    return await getFileBuffer(imagemMsg, 'image');
}
