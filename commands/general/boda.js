const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'boda',
    aliases: ['bodas', 'matrimonio'],
    category: 'social',
    description: 'Muestra los detalles y estado de tu matrimonio actual',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return sock.sendMessage(jid, { 
                    text: '₊˚ˑ༄ [!] No se pudo consultar la información de tu boda en la base de datos 🥀' 
                }, { quoted: m });
            }
            
            if (!user.married || user.married === 'Nadie 💔' || !/^.+@(?:s\.whatsapp\.net|lid)$/.test(user.married)) {
                return sock.sendMessage(jid, { 
                    text: `₊˚ˑ༄ [✿] Actualmente estás soltero/a.\n❀ Usa \`!marry @usuario\` para proponer matrimonio. 💍` 
                }, { quoted: m });
            }

            const partnerJid = user.married;
            const partnerName = `@${partnerJid.split('@')[0]}`;

            const caption = `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // MARRIAGE STATUS 𓍢ִ໋☕\n\n` +
                            `❀ ❟ *Estado Civil:* Casado/a 💍\n` +
                            `❀ ❟ *Pareja:* ${partnerName}\n` +
                            `❀ ❟ *Vínculo:* Enamorados y estables 💖\n\n` +
                            `° 𐐪𐑂 ¡Mantengan la chispa encendida bajo los protocolos de la red! ✿`;

            await sock.sendMessage(jid, { 
                text: caption,
                mentions: [sender, partnerJid]
            }, { quoted: m });
        });
    }
};
