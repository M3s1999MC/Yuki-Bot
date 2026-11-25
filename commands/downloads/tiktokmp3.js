const { isValidUrl, downloadWithYtDlp, formatCaption } = require('../../services/downloader');

module.exports = {
    name: 'tiktokmp3',
    aliases: ['ttmp3', 'tiktokaudio'],
    category: 'downloads',
    description: 'Extrae el audio MP3 de un TikTok.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = args.join(' ').trim();
        if (!isValidUrl(url)) {
            return sock.sendMessage(jid, {
                text: formatCaption('TIKTOK AUDIO', ['✦ Uso: `!tiktokmp3 <enlace>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🎶', key: m.key } });

        try {
            const buffer = await downloadWithYtDlp(url, { mode: 'mp3', maxDurationSec: 300 });
            await sock.sendMessage(jid, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: m });
        } catch (err) {
            console.error('[tiktokmp3]', err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('TIKTOK AUDIO', ['🍡 _No pude extraer el audio de ese TikTok._'])
            }, { quoted: m });
        }
    }
};
