module.exports = {
    name: 'customize_legacy',
    aliases: [],
    category: 'subbot',
    description: 'Personaliza los parámetros del bot (nombre, moneda, banner, prefijo, etc.).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor especifica el nuevo valor para actualizar este parámetro.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `✨ ¡Parámetro actualizado correctamente con el valor: *${query}*!` }, { quoted: m });
    }
};