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
            if (!partner) return send('₊˚ˑ༄ [✿] No estás casado con nadie en este momento. 🪞');

            await M.setMarried(me, M.SINGLE);
            await M.setMarried(partner, M.SINGLE);
            send(`₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ Vínculo disuelto: *${M.tag(me)}* y *${M.tag(partner)}* han terminado su matrimonio. 🥀`, [me, partner]);
        } catch (e) {
            console.error('Error en divorciar:', e.message);
            send('₊˚ˑ༄ [!] Error crítico al procesar la ruptura en la base de datos.');
        }
    }
};
