const M = require('../../utils/marriage');
const { tryRespondToDuel } = require('../../utils/duelReply');

module.exports = {
    name: 'rechazar',
    aliases: ['reject'],
    category: 'social',
    description: 'Rechaza una propuesta de matrimonio o un duelo.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const me = M.getSender(m);
        const p = M.proposals[me];

        if (!p) {
            if (await tryRespondToDuel(sock, m, 'rechazar')) return;
            return sock.sendMessage(jid, { 
                text: '₊˚ˑ༄ [✿] No tienes ninguna propuesta o reto pendiente en este momento. 🪞' 
            }, { quoted: m });
        }

        clearTimeout(p.timer);
        delete M.proposals[me];
        sock.sendMessage(jid, {
            text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ Vínculo rechazado: *${M.tag(me)}* ha declinado la propuesta de *${M.tag(p.from)}*. 🥀`,
            mentions: [me, p.from],
        }, { quoted: m });
    }
};
