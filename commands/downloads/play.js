const { isValidUrl, searchYouTube, downloadWithYtDlp, formatCaption } = require('../../services/downloader');

module.exports = {
    name: 'play',
    aliases: ['yta', 'ytmp3'],
    category: 'downloads',
    description: 'Descarga audio MP3 desde YouTube por nombre o enlace.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const input = args.join(' ').trim();
        if (!input) {
            return sock.sendMessage(jid, {
                text: formatCaption('YOUTUBE AUDIO', ['✦ Uso: `!play <nombre o enlace>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🎵', key: m.key } });

        try {
            let target = input;
            if (!isValidUrl(input)) {
                const found = await searchYouTube(input, 1);
                if (!found.length) {
                    return sock.sendMessage(jid, {
                        text: formatCaption('YOUTUBE AUDIO', ['🍡 _No encontré esa canción._'])
                    }, { quoted: m });
                }
                target = found[0].url;
            }

            const buffer = await downloadWithYtDlp(target, { mode: 'mp3', maxDurationSec: 600 });
            await sock.sendMessage(jid, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: m });
        } catch (err) {
            console.error('[play]', err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('YOUTUBE AUDIO', ['🍡 _No pude bajar ese audio (máx. 10 min)._'])
            }, { quoted: m });
        }
    }
};
