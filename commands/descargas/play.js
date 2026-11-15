const yts = require('yt-search');
const { lastPlay } = require('../../utils/yt');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'play',
    category: 'downloader',
    description: 'Busca en YouTube, muestra la portada y pregunta con botones si quieres audio o video.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ');
        if (!query) {
            return await sock.sendMessage(jid, { text: '「✿」 Dime qué canción buscas, por ejemplo: `!play Feid Luna`' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '「✿」 Buscando en YouTube...' }, { quoted: m });

        try {
            const r = await yts(query);
            if (!r.videos.length) {
                return await sock.sendMessage(jid, { text: '「✿」 No encontré nada con ese nombre.' }, { quoted: m });
            }

            const video = r.videos[0];
            lastPlay.set(jid, { video });

            // Portada del video
            await sock.sendMessage(jid, {
                image: { url: video.thumbnail },
                caption: `「✿」 Encontrado 🌸\n\n🎵 *${video.title}*\n👤 ${video.author.name} | ⏱️ ${video.timestamp} | 👀 ${video.views}`
            }, { quoted: m });

            // Botones interactivos
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
            console.error('Error !play:', e);
            await sock.sendMessage(jid, { text: '「✿」 Algo falló al buscar, intenta de nuevo.' }, { quoted: m });
        }
    }
};
