const { reply, usedCommand, targetJid, mentionTag, senderJid } = require('../../utils/commandHelpers');

const drinks = {
    cafe: { label: 'un café', emoji: '☕' },
    mate: { label: 'un mate', emoji: '🧉' },
    taza: { label: 'una taza de chocolate caliente', emoji: '🍫' }
};

function normalize(word) {
    return String(word || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

module.exports = {
    name: 'taza',
    aliases: ['café', 'cafe', 'mate'],
    category: 'random',
    description: 'Invita una bebida caliente a otro usuario',

    async execute(sock, m, args, usedPrefix = '!') {
        const used = normalize(usedCommand(m));
        const drink = drinks[used] || drinks.taza;
        const target = targetJid(m);
        if (!target) {
            return reply(sock, m, `「✿」 Menciona a alguien o responde su mensaje para invitarle ${drink.label} ${drink.emoji}\n_Ejemplo:_ ${usedPrefix}${used || 'taza'} @usuario`);
        }
        const author = senderJid(m, sock);
        const text = `「✿」 ${drink.emoji} ${mentionTag(author)} le invita ${drink.label} a ${mentionTag(target)}.\n_Que lo disfrute con calma._ 🌸`;
        return reply(sock, m, text, [author, target].filter(Boolean));
    },
    drinks
};
