const M = require('../../utils/marriage');

module.exports = {
    name: 'divorciar',
    aliases: ['divorcio', 'divorce'],
    category: 'social',
    description: 'Termina tu matrimonio.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const me = M.getSender(m);
        const send = (text, mentions = []) => sock.sendMessage(jid, { text, mentions }, { quoted: m });

        try {
            const partner = M.partnerOf(await M.getUser(me));
            if (!partner) return send('「✿」 No estás casado con nadie.');

            await M.setMarried(me, M.SINGLE);
            await M.setMarried(partner, M.SINGLE);
            send(`「✿」 💔 ${M.tag(me)} se divorció de ${M.tag(partner)}`, [me, partner]);
        } catch (e) {
            console.error('Error en divorciar:', e.message);
            send('「✿」 No pude procesar el divorcio.');
        }
    }
};