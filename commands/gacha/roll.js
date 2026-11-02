const db = require('../../database/db');
const activeSpawns = require('../../utils/gachaSpawns');
const { searchPinterestImage } = require('../../utils/imageSearch');

module.exports = {
    name: 'roll',
    aliases: ['rw', 'rollwaifu', 'waifu'],
    category: 'gacha',
    description: 'Invoca un personaje del catálogo gacha.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        db.all(`SELECT id, name, serie, price, image_url FROM characters`, [], async (err, characters) => {
            if (err) {
                console.error('Error al consultar el catálogo gacha:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar el catálogo gacha.' }, { quoted: m });
            }
            if (!characters.length) {
                return sock.sendMessage(jid, { text: '「✿」 El catálogo está vacío por ahora. 🌸' }, { quoted: m });
            }

            const shuffled = [...characters].sort(() => Math.random() - 0.5);
            const character = shuffled[0];
            let result;
            try {
                result = await searchPinterestImage(`${character.name} ${character.serie} anime character`);
            } catch (imageErr) {
                console.error(`No se pudo buscar una imagen de Pinterest para ${character.name}:`, imageErr.message);
                const caption = `「✿」 ¡Apareció un personaje! 🌸\n\n` +
                    `👤 *${character.name}*\n` +
                    `📚 ${character.serie}\n` +
                    `💎 Valor: *${Number(character.price || 0).toLocaleString('es-CO')}*\n\n` +
                    `No pude obtener su imagen de Pinterest. Responde a este mensaje con !claim para reclamarlo.`;
                activeSpawns.set(jid, { ...character, image_url: null });
                return sock.sendMessage(jid, { text: caption }, { quoted: m });
            }

            const caption = `「✿」 ¡Apareció un personaje! 🌸\n\n` +
                `👤 *${character.name}*\n` +
                `📚 ${character.serie}\n` +
                `🎭 Rol: ${character.role || 'Personaje'}\n` +
                `💎 Valor: *${Number(character.price || 0).toLocaleString('es-CO')}*\n\n` +
                `Responde a este mensaje con !claim para reclamarlo.`;
            try {
                await sock.sendMessage(jid, {
                    image: result.buffer,
                    caption
                }, { quoted: m });
            } catch (sendErr) {
                console.error(`No se pudo enviar la imagen de Pinterest para ${character.name}:`, sendErr.message);
                activeSpawns.set(jid, { ...character, image_url: null });
                return sock.sendMessage(jid, {
                    text: `「✿」 Apareció *${character.name}* de ${character.serie}, pero WhatsApp no aceptó su imagen. Responde a este mensaje con !claim para reclamarlo.`
                }, { quoted: m });
            }

            activeSpawns.set(jid, { ...character, image_url: result.url });
            db.run(`UPDATE characters SET image_url = ? WHERE id = ?`, [result.url, character.id], err => {
                if (err) console.error(`No se pudo guardar la imagen de Pinterest de ${character.name}:`, err.message);
            });
        });
    }
};
