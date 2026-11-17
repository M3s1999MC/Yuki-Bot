const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'profile',
    aliases: ['perfil'],
    category: 'profile',
    description: 'Muestra tu tarjeta de perfil o la de otra persona.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        // --- ARREGLO: buscar al objetivo en TODOS los lugares posibles ---
        const msg = m.message || {};
        // Puede venir como extendedTextMessage o como conversation / image con caption
        const ext = msg.extendedTextMessage || msg.imageMessage || msg.videoMessage || {};
        const ctx = ext.contextInfo || msg.contextInfo || {};

        // 1. Si etiquetó a alguien: !profile @M
        let target = ctx.mentionedJid?.[0];

        // 2. Si respondió a un mensaje: !profile respondiendo
        // Cuando respondes, el dueño del mensaje original está en participant
        if (!target && ctx.participant) {
            target = ctx.participant;
        }

        // 3. Algunos frameworks lo guardan en m.quoted
        if (!target && m.quoted?.sender) {
            target = m.quoted.sender;
        }
        if (!target && m.quoted?.participant) {
            target = m.quoted.participant;
        }

        // 4. Si no etiquetó ni respondió, es su propio perfil
        if (!target) target = sender;

        // Limpiar JID: a veces viene como 123@lid, lo dejamos tal cual, pero sin espacios
        target = target.trim();

        db.getSafeUser(target, async (err, data) => {
            if (err) {
                console.error('Error al consultar perfil:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar ese perfil 🌸' }, { quoted: m });
            }

            const spouseIsJid = /^.+@(?:s\.whatsapp\.net|lid)$/.test(data.married || '');
            const spouse = spouseIsJid ? `@${data.married.split('@')[0]}` : (data.married || 'Nadie 💔');
            const mentions = [target, ...(spouseIsJid ? [data.married] : [])];
            const displayName = data.custom_name ? `${data.custom_name} (@${target.split('@')[0]})` : `@${target.split('@')[0]}`;

            const text = `⋆
             . . ︵ ⌢ 
            「✿」 Perfil de:
            
             ∘ 𓆩 💎 ${displayName} ¿
             ˚ ⋆*
            
            ⭐ Nivel: *${data.level || '?'}* · ✨ EXP: *${data.exp || 0}*
            
              casado💍 ︶: *${spouse}*
            
            🎂 Birthday : *${data.birthday || '??'}*
            
            ︶⏝ Game fav.🎮 ︶: *${data.game || 'Sin asignar'}*
            
            🎵 Músic🤘: *${data.music || 'Sin asignar'}*
            
            🎨 Pasatiempo: *${data.hobby || 'Sin asignar'}*
            
            ⏝ ⚥ género ⚥ : *${data.gender || 'sin asignar'}*
            
            ♡ Biografía「✿: _${data.bio || 'Sin asignar'}_`;

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
                await sock.sendMessage(jid, { 
                    text: `「✿」 No pude obtener la foto de perfil de WhatsApp; te muestro los datos en texto 🌸\n\n${text}`, 
                    mentions 
                }, { quoted: m });
            }
        });
    }
};
