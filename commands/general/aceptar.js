const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');
const marry = require('./marry');

module.exports = {
    name: 'aceptar',
    aliases: ['accept'],
    category: 'profile',
    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);

        // 1. Busca por grupo (esto arregla el bug del @lid vs @s.whatsapp.net)
        let propuesta = marry.pending.get(jid);

        // 2. Si no hay por grupo, busca por target (por si acaso)
        if (!propuesta && marry.pendingByTarget) {
            propuesta = marry.pendingByTarget.get(sender);
        }

        // 3. Si todavía no, busca en TODAS las propuestas si el sender es el que debe aceptar
        // Esto cubre el caso donde el JID cambió de @lid a @s.whatsapp.net
        if (!propuesta && marry.pendingByTarget) {
            for (const p of marry.pendingByTarget.values()) {
                if (p.jid === jid) {
                    propuesta = p;
                    break;
                }
            }
        }

        if (!propuesta) {
            return sock.sendMessage(jid, { text: `「✿」 Cielito, no tienes ninguna propuesta pendiente 🥺\nQue te hagan !marry etiquetándote primero 🌸` }, { quoted: m });
        }

        // No dejes que el que propuso se auto-acepte
        // Si el que pone !aceptar es el mismo que propuso y hay forma de saberlo, lo dejamos pasar solo si es el target
        // Como el JID puede cambiar, solo bloqueamos si el JID es EXACTAMENTE igual al del proponente
        if (propuesta.sender === sender) {
            return sock.sendMessage(jid, { text: `「✿」 Cielito, tú eres el que propuso, no te puedes auto-aceptar 🥺\nQue la otra personita ponga !aceptar 🌸` }, { quoted: m });
        }

        const novio = propuesta.sender;
        // El que acepta es el sender actual, no el target guardado, así guardamos el JID correcto
        const acepta = sender;

        clearTimeout(propuesta.timeout);
        marry.pending.delete(jid);
        if (marry.pendingByTarget) {
            marry.pendingByTarget.delete(propuesta.target);
            marry.pendingByTarget.delete(propuesta.sender);
            marry.pendingByTarget.delete(sender);
        }
        if (marry.clearPending) marry.clearPending(jid, propuesta.target);

        db.updateUser(novio, { married: acepta }, () => {});
        db.updateUser(acepta, { married: novio }, () => {});

        await sock.sendMessage(jid, {
            text: `「✿」 ¡¡SE CASARON!! 💍✨🌸\n\n¡Qué lindos! @${novio.split('@')[0]} y @${acepta.split('@')[0]} ahora son esposos! (⁠♡⁠ω⁠♡⁠) 💕\n\nYa les puse su anillito en el !profile, vayan a presumirlo, bebés! 💒`,
            mentions: [novio, acepta]
        }, { quoted: m });
    }
};