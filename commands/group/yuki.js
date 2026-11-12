module.exports = {
    name: 'yuki',
    category: 'groups',
    description: 'Enciende o apaga el bot solo en este grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const estado = args[0]?.toLowerCase();

        if (!['on', 'off'].includes(estado)) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "CONTROL DE BOT EN GRUPO"🌸)\n\n⚠️ Especifica el estado.\n*Uso:* `!yuki on` o `!yuki off`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "ESTADO DE YUKI"🌸)\n\n🤖 El bot ha sido colocado en modo: *${estado.toUpperCase()}* para este grupo.`
        }, { quoted: m });
    }
};
