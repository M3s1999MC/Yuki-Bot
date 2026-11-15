const yts = require('yt-search');
const { lastPlay } = require('../../utils/yt');

module.exports = {
    name: 'play',
    category: 'downloader',
    description: 'Busca en YouTube, muestra la portada y pregunta con botones si quieres audio o video.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ');
        if (!query) {
            return await sock.sendMessage(jid, { text: '⚠️ Mamón, pon algo. Ej: `!play Feid Luna`' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '🔎 Buscando en YouTube, weon...' }, { quoted: m });

        try {
            const r = await yts(query);
            if (!r.videos.length) {
                return await sock.sendMessage(jid, { text: '⚠️ No encontré nada, weon.' }, { quoted: m });
            }

            const video = r.videos[0];

            // Guardamos el primer resultado, weon
            lastPlay.set(jid, { video });

            // La portada del video es video.thumbnail, weon. Esa es la miniatura de YouTube, mamón
            const portada = video.thumbnail;

            await sock.sendMessage(jid, {
                image: { url: portada }, // Aquí va la portada, weon
                caption: `(「✿」 "ENCONTRADO"🌸)\n\n🎵 *${video.title}*\n👤 ${video.author.name} | ⏱️ ${video.timestamp} | 👀 ${video.views}\n\n¿Qué quieres, mamón?`,
                footer: 'Yuki Bot 🌸',
                buttons: [
                    { buttonId: '!audio', buttonText: { displayText: '🎧 Audio' }, type: 1 },
                    { buttonId: '!video', buttonText: { displayText: '📹 Video' }, type: 1 }
                ],
                headerType: 4 // 4 = con imagen, weon. Para que salga la portada arriba, mamón
            }, { quoted: m });

        } catch (e) {
            console.error('Error !play:', e);
            await sock.sendMessage(jid, { text: '⚠️ YouTube está mamón hoy, weon. Intenta de nuevo.' }, { quoted: m });
        }
    }
};
