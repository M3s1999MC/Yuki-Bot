const db = require('../../database/db');

module.exports = {
    name: 'mining_legacy',
    aliases: [],
    category: 'economy',
    description: 'Baja a la mina y consigue minerales o monedas.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || m.key.remoteJid) : jid;
        const username = sender.split('@')[0];

        // Asegurar usuario
        db.run(`INSERT OR IGNORE INTO users (jid, name, wallet) VALUES (?, ?, 0)`, [sender, username], () => {
            // Recompensa aleatoria de minería
            const oresFound = ['Carbón 🪨', 'Hierro ⛓️', 'Oro 🪙', 'Diamante 💎', 'Esmeralda 💚'];
            const randomOre = oresFound[Math.floor(Math.random() * oresFound.length)];
            const earnedCoins = Math.floor(Math.random() * 300) + 50;

            db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [earnedCoins, sender], (err) => {
                if (err) {
                    return sock.sendMessage(jid, { text: '❌ Error al minar.' }, { quoted: m });
                }

                const caption = `⛏️ **¡Has bajado a la mina!**\n\n` +
                                `📦 Encontraste: *${randomOre}*\n` +
                                `💰 Ganancia: *$${earnedCoins.toLocaleString()} coins*`;

                sock.sendMessage(jid, { text: caption }, { quoted: m });
            });
        });
    }
};