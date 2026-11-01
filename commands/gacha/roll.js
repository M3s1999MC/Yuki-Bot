const db = require('../../database/db');
const activeSpawns = require('../../utils/gachaSpawns');

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
            const imageCandidates = shuffled.filter(character =>
                typeof character.image_url === 'string' && character.image_url.trim()
            );
            const candidates = [...imageCandidates.slice(0, 5), ...shuffled.filter(character =>
                !imageCandidates.slice(0, 5).includes(character)
            )];

            for (const character of candidates) {
                const caption = `「✿」 ¡Apareció un personaje! 🌸\n\n` +
                    `👤 *${character.name}*\n` +
                    `📚 ${character.serie}\n` +
                    `🎭 Rol: ${character.role || 'Personaje'}\n` +
                    `💎 Valor: *${Number(character.price || 0).toLocaleString('es-CO')}*\n\n` +
                    `Responde a este mensaje con !claim para reclamarlo.`;

                if (character.image_url) {
                    try {
                        await sock.sendMessage(jid, {
                            image: { url: character.image_url },
                            caption
                        }, { quoted: m });
                        activeSpawns.set(jid, character);
                        return;
                    } catch (sendErr) {
                        console.error(`No se pudo enviar la imagen de ${character.name}:`, sendErr.message);
                        continue;
                    }
                }

                activeSpawns.set(jid, character);
                return sock.sendMessage(jid, { text: caption }, { quoted: m });
            }

            return sock.sendMessage(jid, { text: '「✿」 No pude mostrar un personaje del catálogo.' }, { quoted: m });
        });
    }
};
