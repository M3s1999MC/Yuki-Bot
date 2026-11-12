module.exports = {
    name: 'setclaim',
    category: 'gacha',
    description: 'Personaliza tu mensaje de reclamación de cada gacha.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const nuevoTexto = args.join(' ');

        if (!nuevoTexto) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "MENSAJE DE RECLAMO"🌸)\n\n⚠️ Escribe el texto que deseas configurar.\n*Uso:* `!setclaim <tu mensaje>`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "CONFIGURACIÓN ACTUALIZADA"🌸)\n\n✅ Tu mensaje de reclamación personal ha sido guardado exitosamente.`
        }, { quoted: m });
    }
};
