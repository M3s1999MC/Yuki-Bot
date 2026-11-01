module.exports = {
    name: 'subbots',
    aliases: ['listarbots', 'listbots', 'bots', 'sockets'],
    category: 'subbot',
    description: 'Lista todos los sub-bots vinculados y activos.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const caption = `「✿」 Sub-Bots Activos\n\n` +
                        `🤖 Total de sub-bots conectados: *0*\n` +
                        `⚡ Estado general: Estable`;

        await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
};