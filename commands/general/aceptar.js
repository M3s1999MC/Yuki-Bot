const M = require('../../utils/marriage');
const { tryRespondToDuel } = require('../../utils/duelReply');

module.exports = {
    name: 'aceptar',
    aliases: ['accept'],
    category: 'social',
    description: 'Acepta una propuesta de matrimonio o un duelo.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const me = M.getSender(m);
        const p = M.proposals[me];
        const send = (text, mentions = []) => sock.sendMessage(jid, { text, mentions }, { quoted: m });

        if (!p) {
            if (await tryRespondToDuel(sock, m, 'aceptar')) return;
            return send('「✿」 No tienes propuestas pendientes. Si es un duelo, responde al mensaje del reto con !aceptar.');
        }
        clearTimeout(p.timer);
        delete M.proposals[me];

        try {
            const [u1, u2] = await Promise.all([M.getUser(me), M.getUser(p.from)]);
            if (M.partnerOf(u1) || M.partnerOf(u2))
                return send('「✿」 Alguno de los dos ya se casó con otra persona.');

            await M.setMarried(me, p.from);
            await M.setMarried(p.from, me);
            send(`「✿」 🎉 ¡${M.tag(p.from)} y ${M.tag(me)} ahora están casados! 💒`, [me, p.from]);
        } catch (e) {
            console.error('Error en aceptar:', e.message);
            send('「✿」 No pude registrar el matrimonio.');
        }
    }
};