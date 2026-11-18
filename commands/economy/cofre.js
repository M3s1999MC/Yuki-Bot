const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'cofre',
    aliases: ['chest'],
    category: 'economy',
    description: 'Abre un cofre misterioso diario para ganar Bolívares.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        
        // Recompensa aleatoria entre 2,000 y 7,000 Bolívares
        const bolivaresGanados = Math.floor(Math.random() * 5000) + 2000;

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return sock.sendMessage(jid, { text: '(「✿」 "ERROR DE RED" 🥀)\n\nNo se pudo verificar tu cuenta en el sistema central.' }, { quoted: m });
            }

            db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [bolivaresGanados, sender], async (updateErr) => {
                if (updateErr) {
                    console.error('Error al abrir el cofre:', updateErr.message);
                    return;
                }

                const text = `(「✿」 "COFRE MISTERIOSO ABIERTO" 🌸)\n\n` +
                             `₊˚ˑ༄ ¡Encontraste un botín secreto en el fondo de la red!\n` +
                             `❀ 💰 *Recompensa:* \`+$${bolivaresGanados.toLocaleString('es-CO')} Bolívares\` 💵\n` +
                             `───────────────────\n` +
                             `❀ _¡Vuelve mañana por más provisión para la hiperinflación!_ ☕`;

                await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
            });
        });
    }
};
