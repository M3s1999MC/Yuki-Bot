module.exports = {
    name: 'negocio',
    alias: ['miempresa'],
    desc: 'Revisa y cobra las ganancias de tu negocio simulado',
    run: async (sock, m, args, db) => {
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
