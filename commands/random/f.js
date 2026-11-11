const { reply, mentionTag, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'f',
    aliases: [],
    category: 'random',
    description: 'Envía un respetuoso mensaje rindiendo homenaje',

    async execute(sock, m, args) {
        const jid = senderJid(m, sock);
        const reason = args.join(' ').trim().slice(0, 200);
        const text = reason
            ? `「✿」 🫡 ${mentionTag(jid)} presenta sus respetos por *${reason}*.\n\n*F*`
            : `「✿」 🫡 ${mentionTag(jid)} presenta sus respetos.\n\n*F*`;
        return reply(sock, m, text, jid ? [jid] : []);
    }
};
