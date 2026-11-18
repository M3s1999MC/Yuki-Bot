const db = require('../../database/db');
const activeSpawns = require('../../utils/gachaSpawns');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'claim',
    aliases: ['c', 'reclamar'],
    category: 'gacha',
    description: 'Reclama el personaje activo en el chat.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const context = m.message?.extendedTextMessage?.contextInfo;
        const spawned = activeSpawns.get(jid);

        if (!context?.quotedMessage) {
            return sock.sendMessage(jid, { text: `₊˚ˑ༄ [✿] Responde directamente a la tarjeta del personaje con \`!claim\` 🥀` }, { quoted: m });
        }
        if (!spawned) {
            return sock.sendMessage(jid, { text: `₊˚ˑ༄ [✿] Este personaje ya expiró o no hay ninguno activo. Usa \`!roll\` 🪞` }, { quoted: m });
        }

        activeSpawns.delete(jid);
        db.getSafeUser(sender, (userErr, user) => {
            if (userErr) {
                activeSpawns.set(jid, spawned);
                console.error('Error al registrar usuario para reclamar personaje:', userErr.message);
                return sock.sendMessage(jid, { text: `₊˚ˑ༄ [!] Error al procesar tu cuenta en la base de datos.` }, { quoted: m });
            }

            db.run(
                `INSERT INTO harem (owner_jid, character_name, series, image_url, value)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT (owner_jid, character_name, series) DO NOTHING`,
                [sender, spawned.name, spawned.serie, spawned.image_url, Number(spawned.price) || 0],
                function(err) {
                    if (err) {
                        if (!activeSpawns.has(jid)) activeSpawns.set(jid, spawned);
                        console.error('Error al guardar personaje reclamado:', err.message);
                        return sock.sendMessage(jid, { text: `₊˚ˑ༄ [!] No se pudo guardar el personaje en el harem.` }, { quoted: m });
                    }
                    if (!this.changes) {
                        if (!activeSpawns.has(jid)) activeSpawns.set(jid, spawned);
                        return sock.sendMessage(jid, {
                            text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ ¡Ya tienes a *${spawned.name}* en tu colección personal! 🪞`
                        }, { quoted: m });
                    }
                    
                    const template = user.claim_message || `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ @user ha vinculado a *{character}* [_{series}_] a su red ✿`;
                    const text = template
                        .replace(/@user/g, `@${sender.split('@')[0]}`)
                        .replace(/\{character\}/g, spawned.name)
                        .replace(/\{series\}/g, spawned.serie) +
                        (spawned.role ? `\n𐐪𐑂 Rol: ${spawned.role}` : '');
                    
                    sock.sendMessage(jid, {
                        text,
                        mentions: [sender]
                    }, { quoted: m });
                }
            );
        });
    }
};
