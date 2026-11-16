const { getMessageSenderJid } = require('../../utils/messageSender');
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

module.exports = {
    name: 'rechazar',
    aliases: ['reject'],
    category: 'profile',
    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        await sql`CREATE TABLE IF NOT EXISTS marry_pending (
            group_jid TEXT PRIMARY KEY,
            sender TEXT NOT NULL,
            target TEXT NOT NULL,
            created_at BIGINT NOT NULL
        )`;

        const rows = await sql`SELECT * FROM marry_pending WHERE group_jid = ${jid}`;
        const propuesta = rows[0];

        if (!propuesta) {
            return sock.sendMessage(jid, { text: `「✿」 No tienes nada que rechazar, cielito 🌸` }, { quoted: m });
        }

        const novio = propuesta.sender;
        await sql`DELETE FROM marry_pending WHERE group_jid = ${jid}`;

        await sock.sendMessage(jid, {
            text: `「✿」 Ay nooo... 💔🥺\n\n@${sender.split('@')[0]} rechazó a @${novio.split('@')[0]}... @${novio.split('@')[0]}, ven, te doy un abracito, no llores cielito (⁠｡⁠•́⁠︿⁠•̀⁠｡⁠)\n\nHabrá alguien más que sí te quiera, lo prometo 🌸`,
            mentions: [sender, novio]
        }, { quoted: m });
    }
};