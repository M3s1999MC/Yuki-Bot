const M = require('../../utils/marriage');

module.exports = {
    name: 'marry',
    aliases: ['casar'],
    category: 'social',
    description: 'Propón matrimonio a alguien.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const me = M.getSender(m);
        const target = M.getMentioned(m);
        const send = (text, mentions = []) => sock.sendMessage(jid, { text, mentions }, { quoted: m });

        if (!target) return send('「✿」 Menciona a alguien: !marry @usuario');
        if (target === me) return send('「✿」 No puedes casarte contigo mismo 🌸');

        try {
            const [u1, u2] = await Promise.all([M.getUser(me), M.getUser(target)]);
            const p1 = M.partnerOf(u1);
            if (p1) return send(`「✿」 Ya estás casado con ${M.tag(p1)} 💍`, [p1]);
            if (M.partnerOf(u2)) return send(`「✿」 ${M.tag(target)} ya está casado/a 💔`, [target]);

            clearTimeout(M.proposals[target]?.timer);
            M.proposals[target] = {
                from: me,
                timer: setTimeout(() => delete M.proposals[target], 2 * 60 * 1000),
            };
            send(
                `「✿」 💍 ${M.tag(me)} le propuso matrimonio a ${M.tag(target)}\n\n` +
                `Responde con *!aceptar* o *!rechazar* (2 min)`,
                [me, target]
            );
        } catch (e) {
            console.error('Error en marry:', e.message);
            send('「✿」 No pude procesar la propuesta.');
        }
    }
};