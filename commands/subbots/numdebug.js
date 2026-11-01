module.exports = {
    name: 'numdebug',
    aliases: ['jiddebug', 'debugnum'],
    category: 'subbot',
    description: 'Muestra los campos crudos del JID del remitente.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        const caption = `🔍 **Debug JID**\n\n` +
                        `• Remote Jid: \`${jid}\`\n` +
                        `• Sender: \`${sender}\``;

        await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
};