module.exports = {
    name: 'iq',
    alias: ['cerebro'],
    desc: 'Mide tu IQ del día con un comentario sarcástico',
    run: async (sock, m) => {
        const jid = m.key.participant || m.key.remoteJid;
        const iq = Math.floor(Math.random() * 150) + 10;
        await sock.sendMessage(m.key.remoteJid, { 
            text: `🧠 El coeficiente intelectual (IQ) de @${jid.split('@')[0]} hoy es de **${iq}**.`,
            mentions: [jid]
        }, { quoted: m });
    }
};
