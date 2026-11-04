module.exports = {
    name: 'maldicion',
    alias: ['hex'],
    desc: 'Lanza una maldición inofensiva y chistosa',
    run: async (sock, m) => {
        const user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.key.participant || m.key.remoteJid;
        const maldiciones = [
            'que el lado frío de tu almohada nunca vuelva a existir.',
            'que siempre te dé hipo cuando vayas a hablar.',
            'que el Wi-Fi se te corte justo cuando vas a ganar la partida.'
        ];
        const m = maldiciones[Math.floor(Math.random() * maldiciones.length)];
        await sock.sendMessage(m.key.remoteJid, { 
            text: `🧙‍♀️ *MALDICIÓN LANZADA:* Maldigo a @${user.split('@')[0]} a ${m}`,
            mentions: [user]
        }, { quoted: m });
    }
};
