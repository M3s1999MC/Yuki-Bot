module.exports = {
    name: 'invertir',
    alias: ['inversion'],
    desc: 'Arriesga parte de tu saldo en un fondo simulado',
    run: async (sock, m, args, db) => {
        const jid = m.key.participant || m.key.remoteJid;
        const cantidad = parseInt(args[0]);
        if (isNaN(cantidad) || cantidad <= 0) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Ingresa una cantidad válida para invertir. Ejemplo: `!invertir 500`' }, { quoted: m });

        db.getSafeUser(jid, async (err, user) => {
            if (err || !user) return;
            if ((user.wallet || 0) < cantidad) return sock.sendMessage(m.key.remoteJid, { text: '❌ No tienes suficiente dinero en tu billetera.' }, { quoted: m });

            const gano = Math.random() < 0.5;
            const nuevoSaldo = gano ? user.wallet + cantidad : user.wallet - cantidad;

            db.run(`UPDATE users SET wallet = ? WHERE jid = ?`, [nuevoSaldo, jid], async () => {
                if (gano) {
                    await sock.sendMessage(m.key.remoteJid, { text: `📈 *¡INVERSIÓN EXITOSA!* Ganaste +$${cantidad.toLocaleString()}. Saldo actual: $${nuevoSaldo.toLocaleString()}` }, { quoted: m });
                } else {
                    await sock.sendMessage(m.key.remoteJid, { text: `📉 *¡INVERSIÓN FALLIDA!* Perdiste -$${cantidad.toLocaleString()}. Saldo actual: $${nuevoSaldo.toLocaleString()}` }, { quoted: m });
                }
            });
        });
    }
};
