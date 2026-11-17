const { mentionTag, senderJid } = require('../../utils/commandHelpers');
const { sendWithGif } = require('../../utils/reactions');

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
        return sendWithGif(sock, m, { text, mentions: jid ? [jid] : [], sources: ['n:nod', 'n:thumbsup'] });
    }
};
