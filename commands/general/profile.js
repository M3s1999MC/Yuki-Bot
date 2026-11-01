const db = require('../../database/db');

module.exports = {
    name: 'profile',
    aliases: ['perfil'],
    category: 'general',
    description: 'Muestra tu tarjeta de perfil o la de otra persona.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const context = m.message?.extendedTextMessage?.contextInfo;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        const target = context?.mentionedJid?.[0] || context?.participant || sender;

        db.getSafeUser(target, async (err, data) => {
            if (err) {
                console.error('Error al consultar perfil:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar ese perfil.' }, { quoted: m });
            }
            const spouseIsJid = /^.+@(?:s\.whatsapp\.net|lid)$/.test(data.married || '');
            const spouse = spouseIsJid ? `@${data.married.split('@')[0]}` : (data.married || 'Nadie 💔');
            const mentions = [target, ...(spouseIsJid ? [data.married] : [])];
            const text = `「✿」 Perfil de @${target.split('@')[0]} 🌸\n\n` +
                `⭐ Nivel: *${data.level || 1}* · ✨ EXP: *${data.exp || 0}*\n` +
                `💍 Pareja: *${spouse}*\n` +
                `🎂 Cumpleaños: *${data.birthday || 'No registrado'}*\n` +
                `🎨 Pasatiempo: *${data.hobby || 'Sin asignar'}*\n` +
                `⚥ Género: *${data.gender || 'Sin asignar'}*\n` +
                `♡ Bio: _${data.bio || 'Sin asignar'}_`;
            try {
                const photoUrl = await sock.profilePictureUrl(target, 'image');
                await sock.sendMessage(jid, { image: { url: photoUrl }, caption: text, mentions }, { quoted: m });
            } catch (photoErr) {
                if (data.profile_image) {
                    try {
                        const fs = require('fs');
                        const image = await fs.promises.readFile(data.profile_image);
                        return await sock.sendMessage(jid, { image, caption: text, mentions }, { quoted: m });
                    } catch (fileErr) {
                        console.error('No se pudo cargar foto de perfil:', fileErr.message);
                    }
                }
                await sock.sendMessage(jid, { text: `「✿」 No pude obtener la foto de perfil de WhatsApp; te muestro los datos en texto.\n\n${text}`, mentions }, { quoted: m });
            }
        });
    }
};
