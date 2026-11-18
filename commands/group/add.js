module.exports = {
    name: 'add',
    aliases: ['agregar'],
    category: 'groups',
    description: 'Añadir a un usuario al grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        
        // Verificar si es un grupo
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, {
                text: '₊˚ˑ༄ [✿] Este comando solo se puede utilizar dentro de un grupo. 🪞'
            }, { quoted: m });
        }

        // Obtener el número de los argumentos o de un mensaje citado
        let inputNum = args[0] || m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!inputNum) {
            return await sock.sendMessage(jid, {
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // ADMIN - AÑADIR 𓍢ִ໋☕\n\n` +
                      `❀ ❟ Debes indicar el número o responder a alguien.\n` +
                      `❀ Uso: \`!add 573001234567\` o responde a su mensaje. 🥀`
            }, { quoted: m });
        }

        // Limpiar el número y formatearlo a JID de WhatsApp
        const cleanNum = inputNum.replace(/[^0-9]/g, '');
        const targetJid = inputNum.includes('@') ? inputNum : `${cleanNum}@s.whatsapp.net`;

        try {
            // Intentar añadir al participante al grupo
            const response = await sock.groupParticipantsUpdate(jid, [targetJid], 'add');
            const result = response?.[0];

            if (result && result.status === '403') {
                return await sock.sendMessage(jid, {
                    text: `₊˚ˑ༄ [!] No se pudo añadir a @${cleanNum} porque tiene la configuración de privacidad restringida para unirse a grupos. 🥀`,
                    mentions: [targetJid]
                }, { quoted: m });
            }

            await sock.sendMessage(jid, {
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Usuario añadido con éxito!\n❀ ❟ *Agregado:* @${cleanNum} 👥✿`,
                mentions: [targetJid]
            }, { quoted: m });

        } catch (error) {
            console.error('Error al añadir usuario al grupo:', error.message);
            await sock.sendMessage(jid, {
                text: `₊˚ˑ༄ [!] No se pudo añadir al usuario. Asegúrate de que el bot sea administrador del grupo. 🥀`
            }, { quoted: m });
        }
    }
};
