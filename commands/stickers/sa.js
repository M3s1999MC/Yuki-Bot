const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { trackBotSentMessage } = require('../handlers/aiChat');

function extractVideoMessage(m) {
    const quoted = m?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.videoMessage) return quoted;
    if (m?.message?.videoMessage) return m;
    return null;
}

function runFfmpeg(args) {
    return new Promise((resolve, reject) => {
        const proc = spawn('ffmpeg', args);
        let stderr = '';

        proc.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`FFmpeg falló (código ${code}): ${stderr.slice(-250)}`));
            }
        });

        proc.on('error', (err) => {
            reject(err);
        });
    });
}

async function buildAnimatedStickerAndAudio(inputPath, webpPath, audioPath) {
    await runFfmpeg([
        '-y',
        '-i', inputPath,
        '-t', '5',
        '-vf', 'fps=12,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
        '-vcodec', 'libwebp',
        '-loop', '0',
        '-preset', 'default',
        '-an',
        '-vsync', '0',
        webpPath
    ]);

    try {
        await runFfmpeg([
            '-y',
            '-i', inputPath,
            '-t', '5',
            '-vn',
            '-c:a', 'libopus',
            '-b:a', '64k',
            audioPath
        ]);
    } catch {
        // Si el video no trae pista de audio, se omite sin romper el sticker animado
    }
}

module.exports = {
    name: 'sa',
    aliases: ['stickeraudio', 'saudio'],
    category: 'stickers',
    description: 'Convierte un video en sticker animado con su audio.',

    async execute(sock, m, args = []) {
        const jid = m?.key?.remoteJid;
        if (!jid) return;

        const targetMsg = extractVideoMessage(m);
        if (!targetMsg) {
            const sent = await sock.sendMessage(
                jid,
                { text: '✧ Envía un video con `!s a` (o responde a un video con `!s a`) para hacerlo sticker con audio~ 🎬🔊✨' },
                { quoted: m }
            );
            trackBotSentMessage?.(sent?.key);
            return;
        }

        const tempId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const inputPath = path.join(os.tmpdir(), `yuki_sa_in_${tempId}.mp4`);
        const webpPath = path.join(os.tmpdir(), `yuki_sa_out_${tempId}.webp`);
        const audioPath = path.join(os.tmpdir(), `yuki_sa_snd_${tempId}.ogg`);

        try {
            if (typeof sock.sendPresenceUpdate === 'function') {
                await sock.sendPresenceUpdate('composing', jid).catch(() => {});
            }

            const mediaBuffer = await downloadMediaMessage(
                targetMsg,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            if (!mediaBuffer || !mediaBuffer.length) {
                throw new Error('No se pudo descargar el video.');
            }

            fs.writeFileSync(inputPath, mediaBuffer);
            await buildAnimatedStickerAndAudio(inputPath, webpPath, audioPath);

            const stickerBuffer = fs.readFileSync(webpPath);
            const hasAudio = fs.existsSync(audioPath) && fs.statSync(audioPath).size > 0;
            const audioBuffer = hasAudio ? fs.readFileSync(audioPath) : null;

            // Si tu versión de Baileys soporta el campo `audio` en el payload de sticker, lo adjunta;
            // si no, envía el sticker animado y enseguida el audio suelto (ambos sin citar).
            const stickerPayload = audioBuffer
                ? { sticker: stickerBuffer, audio: audioBuffer, mimetype: 'audio/ogg; codecs=opus' }
                : { sticker: stickerBuffer };

            const sentSticker = await sock.sendMessage(jid, stickerPayload);
            trackBotSentMessage?.(sentSticker?.key);

            if (audioBuffer && !sentSticker?.message?.stickerMessage) {
                const sentAudio = await sock.sendMessage(jid, {
                    audio: audioBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: false
                });
                trackBotSentMessage?.(sentAudio?.key);
            }
        } catch (err) {
            console.error('[sa] Error creando sticker con audio:', err.message || err);
            const errMsg = await sock.sendMessage(
                jid,
                { text: '😅 Ay, no pude procesar ese video con `!s a`... ¿probamos con otro clip cortito? 🍞' },
                { quoted: m }
            );
            trackBotSentMessage?.(errMsg?.key);
        } finally {
            for (const file of [inputPath, webpPath, audioPath]) {
                try {
                    if (fs.existsSync(file)) fs.unlinkSync(file);
                } catch {}
            }
            if (typeof sock.sendPresenceUpdate === 'function') {
                await sock.sendPresenceUpdate('paused', jid).catch(() => {});
            }
        }
    }
};
