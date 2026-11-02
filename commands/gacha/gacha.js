const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

// Variable temporal en memoria para almacenar el último personaje droppeado en el chat
const activeSpawns = new Map(); // key: jid -> { charId, name, serie, price, image_url }

module.exports = {
    name: 'gacha',
    aliases: [],
    category: 'gacha',
    description: 'Sistema de gacha para invocar, reclamar y gestionar personajes y waifus.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const prefix = '.';
        const commandUsed = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();

        db.run(`INSERT OR IGNORE INTO users (jid) VALUES (?)`, [sender]);

        // --- 1. TIRAR GACHA (.roll | .rw | .rollwaifu) ---
        if (['roll', 'rw', 'rollwaifu'].includes(commandUsed)) {
            db.all(`SELECT * FROM characters`, [], async (err, chars) => {
                if (!chars || chars.length === 0) {
                    return await sock.sendMessage(jid, { text: '❌ No hay personajes registrados en el gacha todavía.' }, { quoted: m });
                }

                const randomChar = chars[Math.floor(Math.random() * chars.length)];
                activeSpawns.set(jid, randomChar);

                const caption = `✨ *¡UN PERSONAJE HA APARECIDO!* ✨\n\n` +
                    `👤 *Nombre:* ${randomChar.name}\n` +
                    `📺 *Serie:* ${randomChar.serie}\n` +
                    `💎 *Valor:* $${randomChar.price.toLocaleString('en-US')}\n\n` +
                    `Usa \`.claim\` para reclamarlo a tu harem.`;

                try {
                    await sock.sendMessage(jid, { 
                        image: { url: randomChar.image_url }, 
                        caption: caption 
                    }, { quoted: m });
                } catch {
                    await sock.sendMessage(jid, { text: caption }, { quoted: m });
                }
            });
            return;
        }

        // --- 2. RECLAMAR (.claim | .c | .reclamar) ---
        if (['claim', 'c', 'reclamar'].includes(commandUsed)) {
            const spawned = activeSpawns.get(jid);
            if (!spawned) {
                return await sock.sendMessage(jid, { text: '⚠️ No hay ningún personaje disponible para reclamar en este chat. Usa `.roll` primero.' }, { quoted: m });
            }

            // Verificar si ya fue reclamado o asignarlo al usuario
            db.run(
                `INSERT INTO user_harem (user_jid, character_id)
                 VALUES (?, ?)
                 ON CONFLICT (user_jid, character_id) DO NOTHING`,
                [sender, spawned.id],
                async function(err) {
                    if (err) {
                        return await sock.sendMessage(jid, { text: `❌ Hubo un error al intentar reclamar a *${spawned.name}*.` }, { quoted: m });
                    }
                    if (!this.changes) {
                        return await sock.sendMessage(jid, { text: `Ya tienes a *${spawned.name}* en tu harem.` }, { quoted: m });
                    }

                    activeSpawns.delete(jid);
                    await sock.sendMessage(jid, {
                        text: `🎉 ¡Felicidades @${sender.split('@')[0]}! Has reclamado exitosamente a *${spawned.name}* (${spawned.serie}) para tu harem.`,
                        mentions: [sender]
                    }, { quoted: m });
                }
            );
            return;
        }

        // --- 3. MOSTRAR HAREM (.harem | .waifus | .claims) ---
        if (['harem', 'waifus', 'claims'].includes(commandUsed)) {
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                              m.message?.extendedTextMessage?.contextInfo?.participant || sender;

            db.all(`SELECT c.name, c.serie FROM user_harem h JOIN characters c ON h.character_id = c.id WHERE h.user_jid = ?`, [targetJid], async (err, rows) => {
                if (!rows || rows.length === 0) {
                    return await sock.sendMessage(jid, { text: `🎒 @${targetJid.split('@')[0]} aún no tiene personajes en su harem.`, mentions: [targetJid] }, { quoted: m });
                }

                let text = `💖 *HAREM DE @${targetJid.split('@')[0]}* (Total: ${rows.length}) 💖\n\n` +
                    rows.map((r, i) => `${i + 1}. *${r.name}* — _${r.serie}_`).join('\n');

                await sock.sendMessage(jid, { text, mentions: [targetJid] }, { quoted: m });
            });
            return;
        }

        // --- 4. ESTABLECER WAIFU PRINCIPAL (.principal | .setmain) ---
        if (['principal', 'setmain', 'waifuprincipal', 'setfav', 'setfavourite'].includes(commandUsed)) {
            const charName = args.join(' ').trim();
            if (!charName) {
                return await sock.sendMessage(jid, { text: '⚠️ Indica el nombre exacto de tu personaje favorito en tu harem.' }, { quoted: m });
            }

            db.get(`SELECT c.id, c.name FROM user_harem h JOIN characters c ON h.character_id = c.id WHERE h.user_jid = ? AND c.name LIKE ?`, 
                [sender, `%${charName}%`], async (err, row) => {
                if (!row) {
                    return await sock.sendMessage(jid, { text: `❌ No posees ningún personaje con ese nombre en tu harem.` }, { quoted: m });
                }

                db.run(`UPDATE users SET main_waifu = ? WHERE jid = ?`, [row.name, sender], async () => {
                    await sock.sendMessage(jid, { text: `⭐ ¡Has establecido a *${row.name}* como tu waifu / personaje principal!` }, { quoted: m });
                });
            });
        }
    }
};