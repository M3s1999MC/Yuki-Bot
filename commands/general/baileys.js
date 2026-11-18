module.exports = {
    name: 'baileys',
    aliases: ['whatsapp', 'lib'],
    category: 'general',
    description: 'Muestra información sobre la librería Baileys.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const caption = `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // SYSTEM CORE 𓍢ִ໋☕\n\n` +
                        `❀ ❟ *Framework:* \`@whiskeysockets/baileys\`\n` +
                        `❀ ❟ *Función:* Núcleo de conexión rápida y ligera para la API de WhatsApp en Node.js.\n\n` +
                        `° 𐐪𐑂 Operando de forma estable bajo los protocolos de la red. ✿`;

        await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
};
