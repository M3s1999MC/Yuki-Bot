const fs = require('fs');
const path = require('path');
const os = require('os');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

if (!global.yukiLastPlay) global.yukiLastPlay = new Map();

const tempDir = path.join(os.tmpdir(), 'yuki_downloads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

async function downloadFile(url, dest) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    if (!res.ok) {
        throw new Error(`HTTP error status: ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buffer);
}

async function downloadWithYtDlp(queryOrUrl, options = {}) {
    const type = options.type || 'video';
    const ext = type === 'audio' ? 'mp3' : 'mp4';
    const prefix = options.prefix || 'media';
    const id = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const filePath = path.join(tempDir, `${id}.${ext}`);

    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
        throw new Error('Falta configurar la variable de entorno APIFY_API_TOKEN en Render.');
    }

    let targetUrl = queryOrUrl;

    if (!queryOrUrl.includes('youtube.com') && !queryOrUrl.includes('youtu.be')) {
        const searchApi = `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(queryOrUrl)}`;
        const searchRes = await fetch(searchApi);
        const searchJson = await searchRes.json();

        if (!searchJson || !searchJson.status || !searchJson.data || searchJson.data.length === 0) {
            throw new Error('No se encontró ningún resultado en YouTube para esa búsqueda.');
        }
        targetUrl = searchJson.data[0].url;
    }

    const actorId = 'streamers~youtube-video-downloader';
    const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiToken}`;

    console.log(`[Apify] Iniciando descarga para: ${targetUrl}`);
    const runRes = await fetch(runUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            videos: [{ url: targetUrl }],
            preferredQuality: '720p'
        })
    });

    const runData = await runRes.json();
    if (!runData.data || !runData.data.id) {
        throw new Error('No se pudo iniciar el proceso de descarga en Apify.');
    }

    const runId = runData.data.id;
    const datasetId = runData.data.defaultDatasetId;

    // Aumentamos a 40 intentos x 4 segundos = hasta 160 segundos de paciencia
    let isFinished = false;
    let attempts = 0;
    while (!isFinished && attempts < 40) {
        await new Promise(r => setTimeout(r, 4000));
        attempts++;

        const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiToken}`);
        const statusData = await statusRes.json();
        
        const status = statusData.data?.status;
        console.log(`[Apify] Intento ${attempts}/40 - Estado actual: ${status}`);

        if (status === 'SUCCEEDED') {
            isFinished = true;
        } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
            throw new Error(`El proceso en Apify falló con estado: ${status}`);
        }
    }

    if (!isFinished) {
        throw new Error('El tiempo de espera para procesar el video en Apify expiró.');
    }

    const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}`);
    const items = await itemsRes.json();

    if (!items || items.length === 0 || (!items[0].url && !items[0].downloadUrl)) {
        throw new Error('Apify terminó pero no devolvió ningún enlace de descarga válido.');
    }

    const downloadLink = items[0].downloadUrl || items[0].url;
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
