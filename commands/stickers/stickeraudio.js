const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { formatCaption } = require('../../services/downloader');

const execFileAsync = promisify(execFile);
const TMP_DIR = os.tmpdir();

function makeTempPath(prefix, ext) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return path.join(TMP_DIR, `yuki_sa_${prefix}_${id}${ext}`);
}

function safeUnlink(filePath) {
    if (!filePath) return;
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {}
}

function extractVideoMessage(m) {
    const direct = m?.message?.videoMessage;
    if (direct) return direct;

    const contextInfo =
        m?.message?.extendedTextMessage?.contextInfo ||
        m?.message?.imageMessage?.contextInfo ||
        m?.message?.videoMessage?.contextInfo ||
        {};

    const quoted = contextInfo?.quotedMessage;
    if (quoted?.videoMessage) return quoted.videoMessage;

    return null;
}

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

module.exports = {
    name: 'stickeraudio',
    aliases: ['saudio', 'sconaudio', 'vaudio', 'gifaudio'],
    category: 'stickers',
    description: 'Genera un clip animado en bucle con audio a partir de un video sin límite de duración.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const videoMsg = extractVideoMessage(m);

        if (!videoMsg) {
            return sock.sendMessage(jid, {
                text: formatCaption('STICKER CON AUDIO', [
                    '✦ *Uso:* Responde a un video o envía un video con el comando.',
                    '✦ *Opcional:* `!stickeraudio [texto]`'
                ])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🔊', key: m.key } });

        const customCaption = args.join(' ').trim();
        const inputPath = makeTempPath('in', '.mp4');
        const outVideoPath = makeTempPath('out', '.mp4');

        try {
            const stream = await downloadContentFromMessage(videoMsg, 'video');
            const videoBuffer = await streamToBuffer(stream);
            if (!videoBuffer.length) {
                throw new Error('Video vacío al descargar desde WhatsApp.');
            }

            fs.writeFileSync(inputPath, videoBuffer);

            // Duración completa sin recorte, conservando pista de audio AAC
            await execFileAsync('ffmpeg', [
                '-y',
                '-i', inputPath,
                '-vf', 'fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:black,setsar=1',
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-preset', 'veryfast',
                '-crf', '28',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',
                outVideoPath
            ], { timeout: 180000 });

            if (!fs.existsSync(outVideoPath)) {
                throw new Error('No se pudo generar el video con audio.');
            }

            const resultBuffer = fs.readFileSync(outVideoPath);

            await sock.sendMessage(jid, {
                video: resultBuffer,
                mimetype: 'video/mp4',
                gifPlayback: true,
                caption: customCaption || undefined
            }, { quoted: m });
        } catch (err) {
            console.error('[stickeraudio]', err?.stderr || err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('STICKER CON AUDIO', [
                    '🍡 _No pude generar el clip animado con audio._',
                    '✦ _Verifica que el video tenga audio y no sea demasiado pesado para el servidor._'
                ])
            }, { quoted: m });
        } finally {
            safeUnlink(inputPath);
            safeUnlink(outVideoPath);
        }
    }
};
