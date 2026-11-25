const { isValidUrl, searchYouTube, downloadWithYtDlp, formatCaption } = require('../../services/downloader');

module.exports = {
    name: 'play2',
    aliases: ['ytv', 'ytmp4'],
    category: 'downloads',
    description: 'Descarga video MP4 desde YouTube por nombre o enlace.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const input = args.join(' ').trim();
        if (!input) {
            return sock.sendMessage(jid, {
                text: formatCaption('YOUTUBE VIDEO', ['✦ Uso: `!play2 <nombre o enlace>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '📹', key: m.key } });

        try {
            let target = input;
            let title = 'Video de YouTube';
            if (!isValidUrl(input)) {
                const found = await searchYouTube(input, 1);
                if (!found.length) {
                    return sock.sendMessage(jid, {
                        text: formatCaption('YOUTUBE VIDEO', ['🍡 _No encontré ese video._'])
                    }, { quoted: m });
                }
                target = found[0].url;
                title = found[0].title;
            }

            const buffer = await downloadWithYtDlp(target, { mode: 'mp4', maxDurationSec: 600 });
            await sock.sendMessage(jid, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: formatCaption('YOUTUBE VIDEO', [`✦ *Título:* ${title}`])
            }, { quoted: m });
        } catch (err) {
            console.error('[play2]', err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('YOUTUBE VIDEO', ['🍡 _No pude bajar ese video (máx. 10 min)._'])
            }, { quoted: m });
        }
    }
};
