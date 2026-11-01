module.exports = {
    name: 'misubbot',
    aliases: ['mivinculo', 'mibot'],
    category: 'subbot',
    description: 'Muestra el estado de tu sub-bot.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const caption = `「✿」 Estado de tu Sub-Bot\n\n` +
                        `❌ No tienes ningún sub-bot vinculado actualmente.\n` +
                        `Usa \`!serbot\` para iniciar el proceso.`;

        await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
};