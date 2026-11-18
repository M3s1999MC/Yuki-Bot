const fs = require('fs');
const path = require('path');
const os = require('os');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

if (!global.yukiLastPlay) global.yukiLastPlay = new Map();

const tempDir = path.join(os.tmpdir(), 'yuki_downloads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Función de descarga usando fetch moderno con headers de navegador
async function downloadFile(url, dest) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*'
        }
    });

    if (!res.ok) {
        throw new Error(`HTTP error status: ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buffer);
}

async function downloadWithYtDlp(videoUrl, options = {}) {
    const type = options.type || 'video';
    const ext = type === 'audio' ? 'mp3' : 'mp4';
    const prefix = options.prefix || 'media';
    const id = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const filePath = path.join(tempDir, `${id}.${ext}`);

    const apiUrl = `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(videoUrl)}`;
    
    const response = await fetch(apiUrl);
    const json = await response.json();

    if (!json || !json.status || !json.data?.dl) {
        throw new Error('La API no pudo procesar el enlace de descarga.');
    }

    const downloadLink = json.data.dl;
    await downloadFile(downloadLink, filePath);

    if (!fs.existsSync(filePath)) {
        throw new Error('El archivo multimedia no se pudo guardar en el disco temporal.');
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
    runCommand: async () => {},
    tempDir,
    sendMediaChoiceButtons
};
