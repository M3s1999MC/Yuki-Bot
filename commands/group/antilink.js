module.exports = {
    name: 'antilink',
    category: 'groups',
    description: 'Expulsar a quien envíe enlaces de otros grupos.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const estado = args[0]?.toLowerCase();

        if (!['on', 'off'].includes(estado)) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "SEGURIDAD - ANTILINK"🌸)\n\n⚠️ Especifica el estado.\n*Uso:* `!antilink on` o `!antilink off`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "ANTILINK ACTUALIZADO"🌸)\n\n🛡️ El sistema antienlaces de otros grupos ha sido puesto en: *${estado.toUpperCase()}*.`
        }, { quoted: m });
    }
};
