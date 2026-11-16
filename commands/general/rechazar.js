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
            return sock.sendMessage(jid, { text: '「✿」 No tienes propuestas pendientes. Si es un duelo, responde al mensaje del reto con !rechazar.' }, { quoted: m });
        }

        clearTimeout(p.timer);
        delete M.proposals[me];
        sock.sendMessage(jid, {
            text: `「✿」 💔 ${M.tag(me)} rechazó a ${M.tag(p.from)}`,
            mentions: [me, p.from],
        }, { quoted: m });
    }
};