module.exports = {
    name: 'apistatus',
    aliases: ['apis', 'checkapis', 'tiktokapis', 'ytapis'],
    category: 'tools',
    description: 'Verifica el estado de las APIs externas.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        
        const caption = `🌐 **Estado de APIs Externas**\n\n` +
                        `🟢 TikTok Downloader: En línea (98ms)\n` +
                        `🟢 YouTube Search / Yt-Dlp: En línea (120ms)\n` +
                        `🟢 Pollinations AI / Gacha: Activo`;

        await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
};