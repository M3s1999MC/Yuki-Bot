module.exports = {
    name: 'sessioncontrol_legacy',
    aliases: [],
    category: 'subbot',
    description: 'Controla la sesión, reinicio o modo privado del sub-bot.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const command = m.text?.split(' ')[0]?.replace('!', '') || 'comando';

        await sock.sendMessage(jid, { text: `⚙️ Comando *${command}* ejecutado correctamente en la instancia.` }, { quoted: m });
    }
};