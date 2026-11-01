const { sessions } = require('../../utils/practiceSessions');

module.exports = {
    name: 'practicar',
    aliases: ['practice', 'entrenar'],
    category: 'utilidades',
    description: 'Inicia o termina una práctica de conversación local.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        if (jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '「✿」 Inicia la práctica por privado para mantener la conversación personal.' }, { quoted: m });
        }

        const action = (args[0] || '').toLowerCase();
        if (['off', 'stop', 'salir', 'fin'].includes(action)) {
            sessions.delete(sender);
            return sock.sendMessage(jid, { text: '「✿」 Práctica terminada. ¡Buen trabajo! 🌸' }, { quoted: m });
        }

        sessions.set(sender, { turns: 0 });
        await sock.sendMessage(jid, {
            text: '「✿」 Práctica iniciada ✨\n\n_Haré de match con respuestas de práctica locales. Escribe !practicar off para terminar._\n\n¡Hola! ¿Cómo estuvo tu día? 😊'
        }, { quoted: m });
    }
};
