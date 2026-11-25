const { searchPinterest, formatCaption } = require('../../services/downloader');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
    name: 'pinterest',
    aliases: ['pin', 'psearch'],
    category: 'downloads',
    description: 'Busca imágenes en Pinterest y muestra todos los resultados encontrados con sus datos.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(jid, {
                text: formatCaption('PINTEREST SEARCH', ['✦ Uso: `!pinterest <búsqueda>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '📌', key: m.key } });

        const pins = await searchPinterest(query, 25);
        if (!pins.length) {
            return sock.sendMessage(jid, {
                text: formatCaption('PINTEREST SEARCH', ['🍡 _No encontré pines para esa búsqueda._'])
            }, { quoted: m });
        }

        const total = pins.length;

        for (let i = 0; i < total; i++) {
            const pin = pins[i];
            const caption = formatCaption(`PINTEREST SEARCH (${i + 1}/${total})`, [
                `✦ *Autor:* ${pin.author}`,
                `✦ *Usuario:* ${pin.username}`,
                `✦ *Seguidores:* ${pin.followers}`,
                `✦ *Likes:* ${pin.likes}`,
                pin.pinUrl ? `✦ *Enlace:* ${pin.pinUrl}` : null
            ]);

            try {
                await sock.sendMessage(jid, {
                    image: { url: pin.imageUrl },
                    caption
                }, { quoted: i === 0 ? m : undefined });
            } catch (_) {
                await sock.sendMessage(jid, {
                    text: `${caption}\n✦ *Imagen:* ${pin.imageUrl}`
                }, { quoted: i === 0 ? m : undefined });
            }

            if (i < total - 1) {
                await sleep(400);
            }
        }
    }
};
