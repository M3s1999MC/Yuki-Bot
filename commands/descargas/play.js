const yts = require('yt-search');
const { lastPlay } = require('../../utils/yt');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'play',
    category: 'downloader',
    description: 'Busca en YouTube y pregunta con botones nuevos si quieres audio o video.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ');
        if (!query) {
            return await sock.sendMessage(jid, { text: '⚠️ porfavor poner algo para buscar. Ej: `!play Feid Luna`' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '🔎 Buscando en YouTube...' }, { quoted: m });

        try {
            const r = await yts(query);
            if (!r.videos.length) {
                return await sock.sendMessage(jid, { text: '⚠️ No encontramos nada.' }, { quoted: m });
            }

            const video = r.videos[0];
            lastPlay.set(jid, { video });

            const caption = ` 「✿」 "ENCONTRADO"🌸 \n\n🎵 *${video.title}*\n👤 ${video.author.name} | ⏱️ ${video.timestamp} | 👀 ${video.views}\n\n ¿prefieres descargar el video o el audio??`;

            // Botones nuevos, weon. Estos sí jalan en WhatsApp actual, mamón
            const msg = generateWAMessageFromContent(jid, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({
                                text: caption
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({
                                text: 'Yuki Bot 🌸'
                            }),
                            header: proto.Message.InteractiveMessage.Header.create({
                                title: 'ENCONTRADO 🌸',
                                subtitle: video.title,
                                hasMediaAttachment: true,
                                imageMessage: {
                                    url: video.thumbnail, // Portada, weon
                                    mimetype: 'image/jpeg',
                                    caption: caption
                                }
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    {
                                        name: 'quick_reply',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: '🎧 Audio',
                                            id: '!audio'
                                        })
                                    },
                                    {
                                        name: 'quick_reply',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: '📹 Video',
                                            id: '!video'
                                        })
                                    }
                                ]
                            })
                        })
                    }
                }
            }, { quoted: m });

            await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });

        } catch (e) {
            console.error('Error !play:', e);
            await sock.sendMessage(jid, { text: '⚠️ No encontramos un video con lo que buscaste. Intenta de nuevo.' }, { quoted: m });
        }
    }
};
