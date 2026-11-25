const { isValidUrl, formatCaption, downloadWithYtDlp } = require('../../services/downloader');

function extractUrl(text) {
    const match = String(text || '').match(/https?:\/\/[^\s]+/i);
    return match ? match[0] : null;
}

module.exports = {
    name: 'tiktokmp3',
    aliases: ['ttmp3', 'ttaudio'],
    category: 'downloads',
    description: 'Extrae el audio en MP3 de un video de TikTok.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const url = extractUrl(args.join(' ').trim());

        if (!url || !isValidUrl(url)) {
            return sock.sendMessage(jid, {
                text: formatCaption('TIKTOK AUDIO', ['✦ Uso: `!tiktokmp3 <enlace de TikTok>`'])
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🎧', key: m.key } });

        try {
            const audioBuffer = await downloadWithYtDlp(url, { mode: 'mp3' });

            await sock.sendMessage(jid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: m });
        } catch (err) {
            console.error('[tiktokmp3]', err?.stderr || err?.message || err);
            await sock.sendMessage(jid, {
                text: formatCaption('TIKTOK AUDIO', [
                    '🍡 _No pude extraer el audio de ese TikTok._',
                    '✦ _Verifica que el enlace sea público y esté disponible._'
                ])
            }, { quoted: m });
        }
    }
};
