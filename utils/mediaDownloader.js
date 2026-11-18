const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

if (!global.yukiLastPlay) global.yukiLastPlay = new Map();

const tempDir = path.join(os.tmpdir(), 'yuki_downloads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const BIN_PATH = path.join(os.tmpdir(), 'yt-dlp');

function downloadBinary(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (res) => {
            if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
                file.close();
                fs.unlink(dest, () => {});
                return resolve(downloadBinary(res.headers.location, dest));
            }
            if (res.statusCode !== 200) {
                file.close();
                fs.unlink(dest, () => {});
                return reject(new Error(`HTTP ${res.statusCode} al descargar yt-dlp`));
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

// AQUÍ VA getYtDlpBin()
async function getYtDlpBin() {
    if (fs.existsSync(BIN_PATH)) {
        // Intentar actualizar en segundo plano por si YouTube cambia algo
        execFile(BIN_PATH, ['-U'], () => {});
        return BIN_PATH;
    }

    console.log('「✿」 Descargando binario de yt-dlp para el entorno...');
    const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';
    await downloadBinary(url, BIN_PATH);
    fs.chmodSync(BIN_PATH, 0o755);
    console.log('「✿」 yt-dlp listo en /tmp/yt-dlp 🌸');
    return BIN_PATH;
}

function runCommand(bin, args, timeoutMs = 120000) {
    return new Promise(async (resolve, reject) => {
        try {
            let actualBin = bin;
            if (bin === 'yt-dlp') {
                actualBin = await getYtDlpBin();
            }

            execFile(actualBin, args, { timeout: timeoutMs, maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
                if (err) {
                    err.stderr = stderr;
                    return reject(err);
                }
                resolve({ stdout, stderr });
            });
        } catch (e) {
            reject(e);
        }
    });
}

async function downloadWithYtDlp(url, options = {}) {
    const type = options.type || 'video';
    const prefix = options.prefix || 'media';
    const id = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const outTemplate = path.join(tempDir, `${id}.%(ext)s`);

    // Parámetros base con evasión de bloqueos para Render
    const baseArgs = [
        '--no-playlist',
        '--no-warnings',
        '--extractor-args', 'youtube:player_client=mweb,android'
    ];

    if (type === 'audio') {
        const args = [
            ...baseArgs,
            '-x',
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '-o', outTemplate,
            url
        ];

        await runCommand('yt-dlp', args);

        const mp3Path = path.join(tempDir, `${id}.mp3`);
        if (fs.existsSync(mp3Path)) {
            return { filePath: mp3Path, ext: 'mp3', cleanup: () => safeUnlink(mp3Path) };
        }

        const files = fs.readdirSync(tempDir).filter(f => f.startsWith(id));
        if (!files.length) throw new Error('No se generó ningún archivo de audio.');

        const rawPath = path.join(tempDir, files[0]);
        const convertedPath = path.join(tempDir, `${id}_conv.mp3`);

        await runCommand('ffmpeg', ['-y', '-i', rawPath, '-vn', '-ab', '192k', convertedPath]);
        safeUnlink(rawPath);

        return {
            filePath: convertedPath,
            ext: 'mp3',
            cleanup: () => safeUnlink(convertedPath)
        };
    }

    const args = [
        ...baseArgs,
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '-o', outTemplate,
        url
    ];

    await runCommand('yt-dlp', args);

    const mp4Path = path.join(tempDir, `${id}.mp4`);
    if (fs.existsSync(mp4Path)) {
        return { filePath: mp4Path, ext: 'mp4', cleanup: () => safeUnlink(mp4Path) };
    }

    const files = fs.readdirSync(tempDir).filter(f => f.startsWith(id));
    if (!files.length) throw new Error('No se generó ningún archivo de video.');

    const foundPath = path.join(tempDir, files[0]);
    return {
        filePath: foundPath,
        ext: path.extname(foundPath).replace('.', '') || 'mp4',
        cleanup: () => safeUnlink(foundPath)
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
    runCommand,
    tempDir,
    sendMediaChoiceButtons
};
