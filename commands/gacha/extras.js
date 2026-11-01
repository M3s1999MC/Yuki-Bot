const db = require('../../database/db');
const { askAI } = require('../../utils/aiClient');
const { createFallbackCharacter } = require('../../utils/gachaCharacter');
const { generateOriginalCharacterImage } = require('../../utils/openaiImageGeneration');

function parseGeneratedCharacter(response) {
    const jsonText = response.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonText) throw new Error('La IA no devolvió la ficha en el formato esperado.');

    const character = JSON.parse(jsonText);
    const fields = ['name', 'role', 'description', 'design', 'personality'];
    if (fields.some(field => typeof character[field] !== 'string' || !character[field].trim())) {
        throw new Error('La ficha generada está incompleta.');
    }
    return character;
}

module.exports = {
    name: 'gacha_extras',
    aliases: [
        'vote', 'votar', 'setclaimmsg', 'setclaim', 'delclaimmsg', 'resetclaimmsg',
        'genchar', 'generar', 'genrandom'
    ],
    category: 'gacha',
    description: 'Vota por personajes, personaliza reclamos y genera o añade personajes.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const command = body.replace(/^!/, '').trim().split(/\s+/)[0].toLowerCase();
        const input = args.join(' ').trim();

        if (['setclaimmsg', 'setclaim'].includes(command)) {
            if (!input) {
                return sock.sendMessage(jid, {
                    text: '「✿」 Escribe el mensaje. Variables disponibles: @user, {character}, {series}.'
                }, { quoted: m });
            }
            return db.getSafeUser(sender, (err) => {
                if (err) {
                    console.error('Error al registrar usuario para mensaje de claim:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu perfil.' }, { quoted: m });
                }
                db.run(`UPDATE users SET claim_message = ? WHERE jid = ?`, [input, sender], (updateErr) => {
                    if (updateErr) {
                        console.error('Error al guardar mensaje de claim:', updateErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo guardar tu mensaje personalizado.' }, { quoted: m });
                    }
                    sock.sendMessage(jid, { text: '「✿」 Tu mensaje de reclamo personalizado quedó guardado. 🌸' }, { quoted: m });
                });
            });
        }

        if (['delclaimmsg', 'resetclaimmsg'].includes(command)) {
            return db.getSafeUser(sender, (err) => {
                if (err) {
                    console.error('Error al registrar usuario para mensaje de claim:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu perfil.' }, { quoted: m });
                }
                db.run(`UPDATE users SET claim_message = NULL WHERE jid = ?`, [sender], (updateErr) => {
                    if (updateErr) {
                        console.error('Error al restablecer mensaje de claim:', updateErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo restablecer el mensaje.' }, { quoted: m });
                    }
                    sock.sendMessage(jid, { text: '「✿」 Se restableció el mensaje de reclamo por defecto. 🌸' }, { quoted: m });
                });
            });
        }

        if (['vote', 'votar'].includes(command)) {
            if (!input) {
                return sock.sendMessage(jid, { text: '「✿」 Indica el nombre del personaje al que quieres votar.' }, { quoted: m });
            }
            return db.get(`SELECT name FROM characters WHERE name LIKE ? COLLATE NOCASE LIMIT 1`, [`%${input}%`], (findErr, character) => {
                if (findErr || !character) {
                    if (findErr) console.error('Error al buscar personaje para votar:', findErr.message);
                    return sock.sendMessage(jid, { text: '「✿」 No encontré ese personaje en el catálogo.' }, { quoted: m });
                }
                db.run(`INSERT OR IGNORE INTO gacha_votes (group_jid, user_jid, character_name) VALUES (?, ?, ?)`, [jid, sender, character.name], function(voteErr) {
                    if (voteErr) {
                        console.error('Error al registrar voto gacha:', voteErr.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo registrar tu voto.' }, { quoted: m });
                    }
                    if (!this.changes) {
                        return sock.sendMessage(jid, { text: '「✿」 Ya votaste por este personaje en este chat. 💖' }, { quoted: m });
                    }
                    db.run(`UPDATE characters SET price = price + 100 WHERE name = ?`, [character.name], (priceErr) => {
                        if (priceErr) {
                            console.error('Error al aumentar el valor del personaje:', priceErr.message);
                            return sock.sendMessage(jid, { text: '「✿」 Tu voto quedó guardado, pero no pude actualizar el valor.' }, { quoted: m });
                        }
                        db.run(`UPDATE harem SET value = value + 100 WHERE character_name = ?`, [character.name], (haremErr) => {
                            if (haremErr) console.error('Error al actualizar valor en harem:', haremErr.message);
                        });
                        sock.sendMessage(jid, { text: `「✿」 Tu voto elevó el valor de *${character.name}* en 💎 100. 🌸` }, { quoted: m });
                    });
                });
            });
        }

        if (['genchar', 'generar', 'genrandom'].includes(command)) {
            if (!input) {
                let character;
                try {
                    await sock.sendMessage(jid, {
                        text: '「✿」 Imaginando un personaje original...'
                    }, { quoted: m });
                    const response = await askAI(
                        'Inventa un personaje totalmente original y aleatorio, sin basarlo en franquicias existentes. Genera en español: un nombre memorable; un rol; una descripción breve y atractiva; un diseño/estética visual concreto con silueta, ropa, rasgos y colores; y una personalidad distintiva. Devuelve únicamente un objeto JSON válido con las cadenas name, role, description, design y personality. No incluyas Markdown ni texto fuera del JSON.',
                        {
                            system: 'Eres una creadora experta de personajes originales para historias y animación. Cada propuesta debe ser distintiva, coherente y fácil de visualizar.'
                        }
                    );
                    character = parseGeneratedCharacter(response);
                } catch (err) {
                    console.error('No se pudo generar el personaje con IA; usando el generador local:', err.message);
                    character = createFallbackCharacter();
                }

                const caption = [
                    `「✿」 *${character.name}* ✨`,
                    `🎭 *Rol:* ${character.role}`,
                    `📖 *Descripción:* ${character.description}`,
                    `🎨 *Diseño / estética:* ${character.design}`,
                    `💫 *Personalidad:* ${character.personality}`
                ].join('\n');

                try {
                    const image = await generateOriginalCharacterImage(character);
                    return await sock.sendMessage(jid, {
                        image,
                        caption: caption.slice(0, 1000)
                    }, { quoted: m });
                } catch (imageErr) {
                    console.error('No se pudo generar la ilustración original para genchar:', imageErr.message);
                    return await sock.sendMessage(jid, {
                        text: `${caption}\n\n⚠️ No se pudo generar la ilustración: ${imageErr.message}`
                    }, { quoted: m });
                }
            }

            const [name, series, imageUrl] = input.split('|').map(part => part.trim());
            let parsedImageUrl;
            try { parsedImageUrl = new URL(imageUrl); } catch {}
            if (!name || !series || !imageUrl || !parsedImageUrl || !['http:', 'https:'].includes(parsedImageUrl.protocol)) {
                return sock.sendMessage(jid, {
                    text: '「✿」 Usa !genchar personaje | serie | URL_de_imagen para añadir un personaje al catálogo.'
                }, { quoted: m });
            }
            return db.run(`INSERT OR IGNORE INTO characters (name, serie, price, image_url) VALUES (?, ?, 1000, ?)`, [name, series, imageUrl], async function(err) {
                if (err) {
                    console.error('Error al añadir personaje al catálogo:', err.message);
                    return sock.sendMessage(jid, { text: '「✿」 No se pudo añadir el personaje.' }, { quoted: m });
                }
                const text = this.changes
                    ? `「✿」 *${name}* de _${series}_ se añadió al catálogo. 🌸`
                    : `「✿」 *${name}* ya estaba en el catálogo.`;
                if (!this.changes) return sock.sendMessage(jid, { text }, { quoted: m });
                try {
                    await sock.sendMessage(jid, {
                        image: { url: imageUrl },
                        caption: `${text}\n🖼️ Imagen registrada en el catálogo.`
                    }, { quoted: m });
                } catch (imageErr) {
                    console.error('No se pudo enviar la vista previa de genchar:', imageErr.message);
                    await sock.sendMessage(jid, { text: `${text}\n⚠️ La URL se guardó, pero la vista previa no se pudo enviar.` }, { quoted: m });
                }
            });
        }
    }
};
