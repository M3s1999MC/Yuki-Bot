const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

module.exports = {
    name: 'aceptar',
    aliases: ['accept'],
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
        console.log(`[ACEPTAR-NEON] M=${sender} en ${jid} | Hay propuesta? ${!!propuesta} | ${JSON.stringify(propuesta)}`);

        if (!propuesta) {
            return sock.sendMessage(jid, { text: `「✿」 Cielito, no tienes ninguna propuesta pendiente 🥺\nQue te hagan !marry etiquetándote primero 🌸` }, { quoted: m });
        }
        if (propuesta.sender === sender) {
            return sock.sendMessage(jid, { text: `「✿」 Cielito, tú eres el que propuso, no te puedes auto-aceptar 🥺\nQue la otra personita ponga !aceptar 🌸` }, { quoted: m });
        }

        const novio = propuesta.sender; // Noah
        const acepta = sender; // M

        await sql`DELETE FROM marry_pending WHERE group_jid = ${jid}`;

        db.updateUser(novio, { married: acepta }, () => {});
        db.updateUser(acepta, { married: novio }, () => {});

        await sock.sendMessage(jid, {
            text: `「✿」 ¡¡SE CASARON!! 💍✨🌸\n\n¡Qué lindos! @${novio.split('@')[0]} y @${acepta.split('@')[0]} ahora son esposos! (⁠♡⁠ω⁠♡⁠) 💕\n\nYa les puse su anillito en el !profile, vayan a presumirlo, bebés! 💒`,
            mentions: [novio, acepta]
        }, { quoted: m });
    }
};