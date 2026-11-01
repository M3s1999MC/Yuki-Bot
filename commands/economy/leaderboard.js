const db = require('../../database/db');

module.exports = {
    name: 'leaderboard',
    aliases: ['top', 'ranking'],
    category: 'economy',
    description: 'Muestra a los usuarios más ricos del bot.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        db.all(`SELECT jid, name, (COALESCE(wallet, 0) + COALESCE(bank, 0)) as total FROM users ORDER BY total DESC LIMIT 10`, [], async (err, rows) => {
            if (err) {
                console.error('Error al consultar ranking económico:', err.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude consultar el ranking.' }, { quoted: m });
            }
            if (!rows.length) {
                return sock.sendMessage(jid, { text: '「✿」 Todavía no hay registros en el ranking. 🌸' }, { quoted: m });
            }

            let text = `「✿」 Top de billeteras y bancos 🏆\n\n`;
            const mentions = [];
            rows.forEach((r, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const label = r.jid ? `@${r.jid.split('@')[0]}` : (r.name || 'Usuario');
                if (r.jid) mentions.push(r.jid);
                text += `${medals[index] || `${index + 1}.`} ${label} — *$${Number(r.total || 0).toLocaleString('es-CO')}*\n`;
            });

            await sock.sendMessage(jid, { text, mentions }, { quoted: m });
        });
    }
};