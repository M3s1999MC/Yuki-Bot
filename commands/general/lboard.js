const db = require('../../database/db');

function isUsableName(value) {
    const name = typeof value === 'string' ? value.trim() : '';
    return Boolean(name)
        && name !== 'Usuario'
        && !name.includes('@')
        && !/^[0-9+\s().-]+$/.test(name)
        && !/\d{7,}/.test(name);
}

module.exports = {
    name: 'lboard',
    aliases: ['lb', 'xptop'],
    category: 'utility',
    description: 'Muestra los contactos que más usan el bot.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        db.all(
            `SELECT name, level, exp FROM users
             WHERE exp > 0
             ORDER BY exp DESC
             LIMIT 5`,
            [],
            async (err, rows) => {
                if (err) {
                    console.error('Error al consultar contactos activos:', err.message);
                    return await sock.sendMessage(jid, {
                        text: '₊˚ˑ༄ [!] No se pudo consultar la actividad de los usuarios en la base de datos 🥀'
                    }, { quoted: m });
                }
                if (!rows || rows.length === 0) {
                    return await sock.sendMessage(jid, {
                        text: '₊˚ˑ༄ [✿] Aún no hay usuarios activos registrados en el ranking. 🪞'
                    }, { quoted: m });
                }

                db.getContactNames(async (contactErr, contactNames) => {
                    if (contactErr) {
                        return await sock.sendMessage(jid, {
                            text: '₊˚ˑ༄ [!] No se pudieron consultar los nombres de los contactos.'
                        }, { quoted: m });
                    }

                    const usedNames = new Set(rows
                        .filter(row => isUsableName(row.name))
                        .map(row => row.name.trim().toLocaleLowerCase()));
                    const availableNames = [...new Set(contactNames
                        .filter(isUsableName)
                        .map(name => name.trim())
                        .filter(name => !usedNames.has(name.toLocaleLowerCase())))];

                    for (let index = availableNames.length - 1; index > 0; index--) {
                        const randomIndex = Math.floor(Math.random() * (index + 1));
                        [availableNames[index], availableNames[randomIndex]] =
                            [availableNames[randomIndex], availableNames[index]];
                    }

                    const namedRows = [];
                    for (const row of rows) {
                        if (isUsableName(row.name)) {
                            namedRows.push({ ...row, displayName: row.name.trim() });
                        } else if (availableNames.length > 0) {
                            namedRows.push({
                                ...row,
                                displayName: `${availableNames.pop()}`
                            });
                        }
                    }

                    if (namedRows.length === 0) {
                        return await sock.sendMessage(jid, {
                            text: '₊˚ˑ༄ [✿] No hay contactos con nombres disponibles para mostrar en el top.'
                        }, { quoted: m });
                    }

                    let text = `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 // LEADERBOARD 𓍢ִ໋☕\n\n`;
                    namedRows.forEach((row, index) => {
                        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                        text += `❀ ${medals[index]} *${row.displayName}* ── _${row.exp} EXP_ (Nv. ${row.level || 1})\n`;
                    });

                    text += `\n° 𐐪𐑂 Ranking actualizado en tiempo real. ✿`;

                    await sock.sendMessage(jid, { text }, { quoted: m });
                });
            }
        );
    }
};
