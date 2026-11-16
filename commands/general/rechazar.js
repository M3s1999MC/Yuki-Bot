const M = require('../../utils/marriage');

module.exports = {
    name: 'rechazar',
    aliases: ['reject'],
    category: 'social',
    description: 'Rechaza una propuesta de matrimonio.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const me = M.getSender(m);
        const p = M.proposals[me];

        if (!p) return sock.sendMessage(jid, { text: '「✿」 No tienes propuestas pendientes.' }, { quoted: m });

        clearTimeout(p.timer);
        delete M.proposals[me];
        sock.sendMessage(jid, {
            text: `「✿」 💔 ${M.tag(me)} rechazó a ${M.tag(p.from)}`,
            mentions: [me, p.from],
        }, { quoted: m });
    }
};