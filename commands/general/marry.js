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

        if (!target) return send('₊˚ˑ༄ [✿] Debes mencionar a alguien: \`!marry @usuario\` 🥀');
        if (target === me) return send('₊˚ˑ༄ [✿] No puedes casarte contigo mismo, ¡qué solitario! 🌸');

        try {
            const [u1, u2] = await Promise.all([M.getUser(me), M.getUser(target)]);
            const p1 = M.partnerOf(u1);
            if (p1) return send(`₊˚ˑ༄ [✿] Ya estás casado con ${M.tag(p1)} 💍`, [p1]);
            if (M.partnerOf(u2)) return send(`₊˚ˑ༄ [✿] Lo siento, *${M.tag(target)}* ya está casado/a con otra persona 💔`, [target]);

            clearTimeout(M.proposals[target]?.timer);
            M.proposals[target] = {
                from: me,
                timer: setTimeout(() => delete M.proposals[target], 2 * 60 * 1000),
            };
            send(
                `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ PROPUESTA DE MATRIMONIO 💍\n\n` +
                `❀ ❟ *${M.tag(me)}* le ha propuesto matrimonio a *${M.tag(target)}*.\n\n` +
                `° Responde con \`!aceptar\` o \`!rechazar\` (Expira en 2 minutos). ✿`,
                [me, target]
            );
        } catch (e) {
            console.error('Error en marry:', e.message);
            send('₊˚ˑ༄ [!] Error crítico al procesar la propuesta en el sistema.');
        }
    }
};
