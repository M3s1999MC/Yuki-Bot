module.exports = {
    name: 'maldicion',
    aliases: ['hex'],
    description: 'Lanza una maldición inofensiva y chistosa',
    async execute(sock, m) {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.key.participant || m.key.remoteJid;
        const maldiciones = [
            'que el lado frío de tu almohada nunca vuelva a existir.',
            'que siempre te dé hipo cuando vayas a hablar.',
            'que el Wi-Fi se te corte justo cuando vas a ganar la partida.'
        ];
        const mal = maldiciones[Math.floor(Math.random() * maldiciones.length)];
        await sock.sendMessage(m.key.remoteJid, { 
            text: `🧙‍♀️ *MALDICIÓN LANZADA:* Maldigo a @${user.split('@')[0]} a ${mal}`,
            mentions: [user]
        }, { quoted: m });
    }
};
