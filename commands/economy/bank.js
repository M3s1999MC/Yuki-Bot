const db = require('../database/db');

module.exports = {
    name: 'banco',
    aliases: ['bank'],
    description: 'Revisa el estado detallado e intereses de tu cuenta bancaria',
    async execute(sock, m) {
        const jid = m.key.participant || m.key.remoteJid;
        db.getSafeUser(jid, async (err, user) => {
            if (err || !user) return sock.sendMessage(m.key.remoteJid, { text: '❌ Error al consultar tu banco.' }, { quoted: m });

            const banco = user.bank || 0;
            const interesEstimado = Math.floor(banco * 0.02);

            await sock.sendMessage(m.key.remoteJid, {
                text: `🏦 *ESTADO BANCARIO DE YUKI* 🏦\n\n💵 *Saldo en Banco:* $${banco.toLocaleString()}\n📈 *Interés Diario (2%):* +$${interesEstimado.toLocaleString()}\n\n_¡Guarda tu dinero seguro con Yuki!_ 🔒`
            }, { quoted: m });
        });
    }
};
