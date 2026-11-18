const db = require('../../database/db');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
    name: 'leaderboard',
    aliases: ['top', 'ranking'],
    category: 'economy',
    description: 'Muestra a los usuarios más ricos del bot con su patrimonio en Bolívares.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        db.all(`SELECT jid, name, (COALESCE(wallet, 0) + COALESCE(bank, 0)) as total FROM users ORDER BY total DESC LIMIT 10`, [], async (err, rows) => {
            if (err) {
                console.error('Error al consultar ranking económico:', err.message);
                return sock.sendMessage(jid, { 
                    text: '「✿」 ERROR DE RED // No pude consultar el ranking financiero. 🥀' 
                }, { quoted: m });
            }

            if (!rows.length) {
                return sock.sendMessage(jid, { 
                    text: '「✿」 RANKING VACÍO // Todavía no hay registros financieros en el sistema. 🌸' 
                }, { quoted: m });
            }

            const mentions = [];
            const lines = rows.map((r, index) => {
                const prefix = MEDALS[index] || `${index + 1}.`;
                const label = r.jid ? `@${r.jid.split('@')[0]}` : (r.name || 'Usuario');
                if (r.jid) mentions.push(r.jid);
                
                const saldoFormateado = Number(r.total || 0).toLocaleString('es-CO');
                return `${prefix} ${label} — \`$${saldoFormateado} Bolívares\``;
            });

            const text = `「✿」 TOP DE RIQUEZA // Billeteras y Bancos 🏆✨\n\n` +
                         `₊˚ˑ༄ Los magnates más acaudalados de la red de Yuki:\n\n` +
                         lines.join('\n') + `\n\n` +
                         `───────────────────\n` +
                         `❀ _¡Sigue acumulando fondos para llegar a la cima!_ 🌸`;

            await sock.sendMessage(jid, { text, mentions }, { quoted: m });
        });
    }
};
