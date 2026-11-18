const db = require('../../database/db');

module.exports = {
    name: 'antilink',
    category: 'groups',
    description: 'Activa o desactiva el sistema antienlaces en el grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        // Verificar si es un grupo
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, {
                text: '₊˚ˑ༄ [✿] Este comando solo se puede utilizar dentro de un grupo. 🪞'
            }, { quoted: m });
        }

        const estado = args[0]?.toLowerCase();

        if (!['on', 'off'].includes(estado)) {
            return await sock.sendMessage(jid, {
                text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // SECURITY - ANTILINK 𓍢ִ໋☕\n\n` +
                      `❀ ❟ Especifica el estado deseado.\n` +
                      `❀ Uso: \`!antilink on\` o \`!antilink off\` 🥀`
            }, { quoted: m });
        }

        const antilinkValue = estado === 'on' ? 1 : 0;

        db.run(
            `INSERT INTO group_settings (group_jid, antilink) VALUES (?, ?)
             ON CONFLICT(group_jid) DO UPDATE SET antilink = ?`,
            [jid, antilinkValue, antilinkValue],
            async (err) => {
                if (err) {
                    console.error('Error al actualizar antilink:', err.message);
                    return await sock.sendMessage(jid, {
                        text: '₊˚ˑ༄ [!] Error crítico al actualizar el sistema antilink en la base de datos.'
                    }, { quoted: m });
                }

                await sock.sendMessage(jid, {
                    text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Sistema Antilink actualizado!\n❀ ❟ *Estado:* \`${estado.toUpperCase()}\` 🛡️✿`
                }, { quoted: m });
            }
        );
    }
};
