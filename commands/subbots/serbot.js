module.exports = {
    name: 'serbot',
    aliases: ['jadibot', 'subbot', 'code'],
    category: 'subbot',
    description: 'Vincula tu propio sub-bot (gratis, sin token).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const caption = `「✿」 Sistema de Sub-Bot ◢ Yuki ◤\n\n` +
                        `🔗 Generando código de vinculación para tu sub-bot...\n` +
                        `Por favor, espera unos segundos.`;

        await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
};