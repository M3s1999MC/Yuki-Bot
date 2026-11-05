const db = require('../database/db');

module.exports = {
    name: 'negocio',
    aliases: ['miempresa'],
    description: 'Revisa y cobra las ganancias de tu negocio simulado',
    async execute(sock, m) {
        const jid = m.key.participant || m.key.remoteJid;
        const ganancia = Math.floor(Math.random() * 1500) + 500;

        db.getSafeUser(jid, async (err, user) => {
            if (err || !user) return;
            const nuevoSaldo = (user.wallet || 0) + ganancia;

            db.run(`UPDATE users SET wallet = ? WHERE jid = ?`, [nuevoSaldo, jid], async () => {
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `🏪 *TU NEGOCIO LOCAL*\n\n¡Tu puesto de arepas y servicios digitales recaudó ganancias hoy!\n💰 *Cobrado:* +$${ganancia.toLocaleString()}\n👛 *Billetera:* $${nuevoSaldo.toLocaleString()}`
                }, { quoted: m });
            });
        });
    }
};
