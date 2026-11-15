const yts = require('yt-search');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

if (!global.yukiLastPlay) global.yukiLastPlay = new Map();
const lastPlay = global.yukiLastPlay;

module.exports = {
    name: 'play',
    category: 'downloader',
    description: 'Busca en YouTube, muestra la portada y pregunta con botones si quieres audio o video.',

    // Acepta cualquier forma de llamada del handler: (sock,m,args) / (sock,m,args,ctx) / (ctx) / (sock,m,body)
    async execute(...params) {
        // --- Normalizar parámetros, sin importar cómo lo llame tu handler ---
        let sock, m, args = [], ctx = {};

        if (params[0] && typeof params[0] === 'object' && params[0].sock && params[0].m) {
            // Forma: execute(ctx) donde ctx = { sock, m, args, ... }
            ctx = params[0];
            sock = ctx.sock;
            m = ctx.m || ctx.msg;
            args = ctx.args || [];
            if (typeof args === 'string') args = args.split(' ').filter(Boolean);
        } else {
            // Forma: execute(sock, m, args, ctx) o execute(sock, m, body)
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
                // Si vino body = "!play Feid Luna", quitar el comando
                args = ctx.body.replace(/^!play\s*/i, '').split(' ').filter(Boolean);
            }
        }

        const jid = m?.key?.remoteJid || ctx?.sender && (ctx.sender.includes('@') ? ctx.sender : null) || m?.key?.remoteJid;
        if (!sock || !m || !jid) {
            console.error('Error en !play: no llegaron sock/m/jid. Params:', JSON.stringify(params).slice(0, 500));
            return;
        }

        // Función segura para enviar, usa ctx.reply si existe, si no sock.sendMessage
        const enviar = async (content) => {
            try {
                if (ctx && typeof ctx.reply === 'function') {
                    await ctx.reply(content);
                } else {
                    await sock.sendMessage(jid, content, { quoted: m });
                }
            } catch (e) {
                console.error('Error enviando en !play:', e.message);
                // Último intento sin quoted
                await sock.sendMessage(jid, content).catch(() => {});
            }
        };

        try {
            const query = (args || []).join(' ').trim();
            if (!query) {
                return await enviar({ text: '「✿」 Dime qué canción buscas, por ejemplo: `!play Feid Luna`' });
            }

            // Este mensaje DEBE llegar. Si no llega, el problema es el handler, no yts.
            await enviar({ text: '「✿」 Buscando en YouTube...' });

            // yts con timeout de 15s para que no se quede colgado
            let r;
            try {
                r = await Promise.race([
                    yts(query),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout yts')), 15000))
                ]);
            } catch (e) {
                console.error('Error yts en !play:', e.message);
                return await enviar({ text: '「✿」 YouTube no respondió, intenta de nuevo en un momento.' });
            }

            if (!r || !r.videos || !r.videos.length) {
                return await enviar({ text: '「✿」 No encontré nada con ese nombre.' });
            }

            const video = r.videos[0];
            lastPlay.set(jid, { video });

            try {
                await enviar({
                    image: { url: video.thumbnail },
                    caption: `「✿」 Encontrado 🌸\n\n🎵 *${video.title}*\n👤 ${video.author.name} | ⏱️ ${video.timestamp} | 👀 ${video.views}`
                });
            } catch (e) {
                console.error('Error enviando portada:', e.message);
                await enviar({ text: `「✿」 Encontrado 🌸\n\n🎵 *${video.title}*` });
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
            try { await enviar({ text: '「✿」 Algo falló al buscar, intenta de nuevo.' }); } catch {}
        }
    },

    // Alias por si tu handler busca `run` en vez de `execute`
    async run(...params) {
        return this.execute(...params);
    }
};
