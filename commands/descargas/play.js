const yts = require('yt-search');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const { downloadWithYtDlp } = require('../../utils/mediaDownloader');

if (!global.yukiLastPlay) global.yukiLastPlay = new Map();
const lastPlay = global.yukiLastPlay;

module.exports = {
    name: 'play',
    aliases: ['yta', 'ytmp3', 'playdoc', 'play2', 'ytv', 'ytmp4', 'play2doc', 'playaudio', 'mp4'],
    category: 'downloader',
    description: 'Busca en YouTube o descarga por enlace directo usando yt-dlp y FFmpeg.',

    async execute(...params) {
        let sock, m, args = [], ctx = {};

        if (params[0] && typeof params[0] === 'object' && params[0].sock && params[0].m) {
            ctx = params[0];
            sock = ctx.sock;
            m = ctx.m || ctx.msg;
            args = ctx.args || [];
            if (typeof args === 'string') args = args.split(' ').filter(Boolean);
        } else {
            sock = params[0];
            m = params[1];
            ctx = params[3] || params[2] || {};
            if (Array.isArray(params[2])) {
                args = params[2];
            } else if (typeof params[2] === 'string') {
                args = params[2].split(' ').filter(Boolean);
            } else if (ctx && Array.isArray(ctx.args)) {
                args = ctx.args;
            } else if (ctx && typeof ctx.body === 'string') {
                args = ctx.body.replace(/^!?\S+\s*/i, '').split(' ').filter(Boolean);
            }
        }

        const jid = m?.key?.remoteJid || (ctx?.sender && ctx.sender.includes('@') ? ctx.sender : null);
        if (!sock || !m || !jid) {
            console.error('Error en !play: no llegaron sock/m/jid.');
            return;
        }

        const enviar = async (content) => {
            try {
                if (ctx && typeof ctx.reply === 'function') {
                    await ctx.reply(content);
                } else {
                    await sock.sendMessage(jid, content, { quoted: m });
                }
            } catch (e) {
                console.error('Error enviando en !play:', e.message);
                await sock.sendMessage(jid, content).catch(() => {});
            }
        };

        try {
            const rawText = (
                m.message?.conversation ||
                m.message?.extendedTextMessage?.text ||
                m.message?.buttonsResponseMessage?.selectedButtonId ||
                m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
                ctx?.body ||
                ''
            ).trim();

            let invokedCmd = 'play';
            try {
                if (rawText.startsWith('{')) {
                    const parsed = JSON.parse(rawText);
                    if (parsed.id) invokedCmd = String(parsed.id).replace(/^[!./#]+/, '').toLowerCase();
                } else if (rawText) {
                    const firstToken = rawText.split(/\s+/)[0].replace(/^[!./#]+/, '').toLowerCase();
                    if (firstToken) invokedCmd = firstToken;
                }
            } catch (_) {}

            const directAudioAliases = ['yta', 'ytmp3', 'playdoc', 'playaudio'];
            const directVideoAliases = ['play2', 'ytv', 'ytmp4', 'play2doc', 'mp4'];
            const isDirectAudio = directAudioAliases.includes(invokedCmd);
            const isDirectVideo = directVideoAliases.includes(invokedCmd);

            const queryOrUrl = (args || []).join(' ').trim();
            if (!queryOrUrl) {
                return await enviar({ text: '「✿」 Dime qué canción buscas o envía un enlace de YouTube.' });
            }

            let video = {};
            const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i.test(queryOrUrl);

            if (isUrl) {
                await enviar({ text: '⚡ Procesando enlace de YouTube...' });
                video = {
                    title: 'Video de YouTube',
                    url: queryOrUrl,
                    thumbnail: 'https://i.imgur.com/3ZQ383y.png'
                };
            } else {
                await enviar({ text: '「✿」 Buscando en YouTube...' });
                let r;
                try {
                    r = await Promise.race([
                        yts(queryOrUrl),
                        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout yts')), 15000))
                    ]);
                } catch (e) {
                    console.error('Error yts en !play:', e.message);
                    return await enviar({ text: '「✿」 YouTube no respondió, intenta de nuevo en un momento.' });
                }

                if (!r || !r.videos || !r.videos.length) {
                    return await enviar({ text: '「✿」 No encontré nada con ese nombre.' });
                }

                video = r.videos[0];
            }

            lastPlay.set(jid, { video });

            try {
                await enviar({
                    image: { url: video.thumbnail },
                    caption: `「✿」 Encontrado 🌸\n\n🎵 *${video.title}*` + (video.author ? `\n👤 ${video.author.name} | ⏱️ ${video.timestamp}` : '')
                });
            } catch (e) {
                console.error('Error enviando portada:', e.message);
                await enviar({ text: `「✿」 Encontrado 🌸\n\n🎵 *${video.title}*` });
            }

            if (isDirectAudio || isDirectVideo) {
                const type = isDirectVideo ? 'video' : 'audio';
                const asDoc = ['playdoc', 'play2doc'].includes(invokedCmd);
                let media;
                try {
                    await enviar({
                        text: type === 'audio'
                            ? '「✿」 Descargando y convirtiendo a MP3 con FFmpeg...'
                            : '「✿」 Descargando video en MP4 con yt-dlp...'
                    });
                    media = await downloadWithYtDlp(video.url, { type, prefix: 'ytplay' });

                    if (type === 'audio') {
                        if (asDoc) {
                            await sock.sendMessage(jid, {
                                document: { url: media.filePath },
                                mimetype: 'audio/mpeg',
                                fileName: `${video.title.slice(0, 60)}.mp3`
                            }, { quoted: m });
                        } else {
                            await sock.sendMessage(jid, {
                                audio: { url: media.filePath },
                                mimetype: 'audio/mpeg',
                                ptt: false
                            }, { quoted: m });
                        }
                    } else if (asDoc) {
                        await sock.sendMessage(jid, {
                            document: { url: media.filePath },
                            mimetype: 'video/mp4',
                            fileName: `${video.title.slice(0, 60)}.mp4`
                        }, { quoted: m });
                    } else {
                        await sock.sendMessage(jid, {
                            video: { url: media.filePath },
                            mimetype: 'video/mp4',
                            caption: `「✿」 *${video.title}* 🌸`
                        }, { quoted: m });
                    }
                } finally {
                    if (media?.cleanup) media.cleanup();
                }
                return;
            }

            const msg = generateWAMessageFromContent(jid, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({
                                text: '¿Cómo lo quieres?'
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({
                                text: 'Yuki Bot 🌸'
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    {
                                        name: 'quick_reply',
                                        buttonParamsJson: JSON.stringify({ display_text: '🎧 Audio', id: '!audio' })
                                    },
                                    {
                                        name: 'quick_reply',
                                        buttonParamsJson: JSON.stringify({ display_text: '📹 Video', id: '!video' })
                                    }
                                ]
                            })
                        })
                    }
                }
            }, { quoted: m });

            await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });

        } catch (e) {
            console.error('Error fatal en !play:', e);
            try { await enviar({ text: '「✿」 Algo falló al procesar la solicitud, intenta de nuevo.' }); } catch {}
        }
    },

    async run(...params) {
        return this.execute(...params);
    }
};
