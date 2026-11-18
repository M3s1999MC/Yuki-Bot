const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

if (!global.yukiLastPlay) global.yukiLastPlay = new Map();

const tempDir = path.join(os.tmpdir(), 'yuki_downloads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (res) => {
            if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
                file.close();
                fs.unlink(dest, () => {});
                return resolve(downloadFile(res.headers.location, dest));
            }
            if (res.statusCode !== 200) {
                file.close();
                fs.unlink(dest, () => {});
                return reject(new Error(`HTTP error status: ${res.statusCode}`));
            }
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', (err) => {
            file.close();
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function downloadWithYtDlp(videoUrl, options = {}) {
    const type = options.type || 'video';
    const ext = type === 'audio' ? 'mp3' : 'mp4';
    const prefix = options.prefix || 'media';
    const id = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const filePath = path.join(tempDir, `${id}.${ext}`);

    // Usamos una API pública y estable para obtener el enlace de descarga directo
    const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`;
    
    // Si es audio, puedes cambiar el endpoint si la API lo soporta, o bajar el mp4 y extraer con ffmpeg
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || !data.success && !data.result?.download_url && !data.download_url) {
        throw new Error('No se pudo obtener el enlace de descarga de la API externa.');
    }

    const downloadLink = data.result?.download_url || data.download_url || data.result?.dl;
    
    await downloadFile(downloadLink, filePath);

    if (!fs.existsSync(filePath)) {
        throw new Error('El archivo descargado no se guardó correctamente.');
    }

    return {
        filePath,
        ext,
        cleanup: () => safeUnlink(filePath)
    };
}

function safeUnlink(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (_) {}
}

async function sendMediaChoiceButtons(sock, jid, m, itemData, bodyText = '¿Cómo lo quieres?') {
    global.yukiLastPlay.set(jid, itemData);

    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({
                        text: bodyText
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({
                        text: 'Yuki Bot 🌸'
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({ display_text: '▸ Audio', id: '!audio' })
                            },
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({ display_text: '▸ Video', id: '!video' })
                            }
                        ]
                    })
                })
            }
        }
    }, { quoted: m });

    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
}

module.exports = {
    downloadWithYtDlp,
    runCommand: async () => {}, // Dummy por compatibilidad
    tempDir,
    sendMediaChoiceButtons
};
