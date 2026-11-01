const db = require('../../database/db');

const minerals = [
    { name: 'carbón', chance: 50, value: 150, emoji: '⚫' },
    { name: 'hierro', chance: 30, value: 350, emoji: '⚙️' },
    { name: 'oro', chance: 15, value: 800, emoji: '🟡' },
    { name: 'diamante', chance: 5, value: 2000, emoji: '💎' }
];

module.exports = {
    name: 'minar',
    aliases: ['mine', 'mina'],
    category: 'otros',
    description: 'Baja a la mina y consigue minerales.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        const roll = Math.random() * 100;
        let cumulative = 0;
        const mineral = minerals.find(item => {
            cumulative += item.chance;
            return roll < cumulative;
        }) || minerals[0];

        db.getSafeUser(sender, (ensureErr) => {
            if (ensureErr) {
                console.error('Error al registrar usuario para minería:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu inventario.' }, { quoted: m });
            }
            db.run(
                `INSERT INTO user_minerals (user_jid, mineral, quantity) VALUES (?, ?, 1)
                 ON CONFLICT(user_jid, mineral) DO UPDATE SET quantity = quantity + 1`,
                [sender, mineral.name],
                (err) => {
                    if (err) {
                        console.error('Error al guardar mineral:', err.message);
                        return sock.sendMessage(jid, { text: '「✿」 No se pudo guardar el mineral encontrado.' }, { quoted: m });
                    }
                    sock.sendMessage(jid, {
                        text: `「✿」 Bajaste a la mina y encontraste ${mineral.emoji} *${mineral.name}*. ⛏️\n💰 Valor al vender: *$${mineral.value.toLocaleString('es-CO')}*`
                    }, { quoted: m });
                }
            );
        });
    }
};
