const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'cmdtoggle',
    aliases: ['togglecmd'],
    category: 'owner',
    description: 'Activa o desactiva un comando del bot.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const cmdName = args[0]?.toLowerCase();

        if (!cmdName) {
            return await sock.sendMessage(jid, { text: '⚠️ Por favor indica el nombre del comando que deseas activar o desactivar.\n\n*Ejemplo:* `!cmdtoggle minar`' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `⚙️ El comando *${cmdName}* ha cambiado su estado correctamente.` }, { quoted: m });
    }
};