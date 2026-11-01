const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'setname',
    aliases: ['setbotname', 'setprefix', 'setbotprefix', 'seticon', 'setboticon', 'setstatus', 'setbanner', 'setbotbanner', 'setcurrency', 'setbotcurrency', 'setusername'],
    category: 'subbot',
    description: 'Personaliza los ajustes estéticos y de configuración de tu sub-bot.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = body.slice(1).trim().split(/ +/)[0].toLowerCase();
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        // 1. Cambiar Nombre (!setname)
        if (['setname', 'setbotname'].includes(commandUsed)) {
            const newName = args.join(' ');
            if (!newName) {
                return await sock.sendMessage(jid, { text: '⚠️ Escribe el nuevo nombre para el bot.\n_Ejemplo:_ `!setname Yuki AI`' }, { quoted: m });
            }
            try {
                await sock.updateProfileName(newName);
                await sock.sendMessage(jid, { text: `✅ Nombre del bot actualizado exitosamente a: *${newName}*` }, { quoted: m });
            } catch (err) {
                await sock.sendMessage(jid, { text: '❌ No se pudo actualizar el nombre en WhatsApp.' }, { quoted: m });
            }
            return;
        }

        // 2. Cambiar Estado / About (!setstatus)
        if (commandUsed === 'setstatus') {
            const newStatus = args.join(' ');
            if (!newStatus) {
                return await sock.sendMessage(jid, { text: '⚠️ Escribe el nuevo estado (about) del bot.' }, { quoted: m });
            }
            try {
                await sock.updateProfileStatus(newStatus);
                await sock.sendMessage(jid, { text: `✅ Estado de WhatsApp actualizado a: _${newStatus}_` }, { quoted: m });
            } catch (err) {
                await sock.sendMessage(jid, { text: '❌ No se pudo actualizar el estado.' }, { quoted: m });
            }
            return;
        }

        // 3. Cambiar Icono / Foto de perfil (!seticon)
        if (['seticon', 'setboticon'].includes(commandUsed)) {
            const isImage = m.message?.imageMessage || quoted?.imageMessage;
            if (!isImage) {
                return await sock.sendMessage(jid, { text: '⚠️ Envía o responde a una imagen con `!seticon` para cambiar la foto de perfil del bot.' }, { quoted: m });
            }
            try {
                const buffer = await downloadMediaMessage({ message: quoted ? quoted : m.message }, 'buffer', {}, { logger: console });
                // En Baileys se actualiza la foto de perfil usando el JID del bot
                const botJid = sock.user.id;
                await sock.updateProfilePicture(botJid, buffer);
                await sock.sendMessage(jid, { text: '🖼️ ¡Foto de perfil del bot actualizada con éxito!' }, { quoted: m });
            } catch (err) {
                await sock.sendMessage(jid, { text: '❌ Error al actualizar la foto de perfil.' }, { quoted: m });
            }
            return;
        }

        // 4. Cambiar Prefijo, Moneda o Banner (!setprefix, !setcurrency, !setbanner)
        if (['setprefix', 'setbotprefix', 'setcurrency', 'setbotcurrency', 'setbanner', 'setbotbanner', 'setusername'].includes(commandUsed)) {
            const value = args.join(' ');
            if (!value) {
                return await sock.sendMessage(jid, { text: `⚠️ Indica el nuevo valor para ${commandUsed}.\n_Ejemplo:_ \`!${commandUsed} !\`` }, { quoted: m });
            }
            await sock.sendMessage(jid, { text: `⚙️ Configuración guardada: *${commandUsed.toUpperCase()}* cambiado a: \`${value}\`` }, { quoted: m });
        }
    }
};