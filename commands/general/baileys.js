module.exports = {
    name: 'baileys',
    category: 'general',
    description: 'Muestra información sobre la librería Baileys.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const caption = `「✿」 Baileys Framework\n\n` +
                        `⚡ Yuki está construida utilizando **@whiskeysockets/baileys**, una librería rápida y ligera para interactuar con la Web API de WhatsApp en Node.js.`;

        await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
};