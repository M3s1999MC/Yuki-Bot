const economy = require('../../utils/economy');
const { claim, formatDuration } = require('../../utils/cooldowns');
const { CHEST } = require('../../utils/ecoConfig');
const { reply, senderJid } = require('../../utils/commandHelpers');

// Probabilidades acumuladas: común 60 %, raro 30 %, épico 9 %, legendario 1 %.
const TIERS = [
    { upTo: 0.6, name: 'Común', emoji: '📦', min: 300, max: 900 },
    { upTo: 0.9, name: 'Raro', emoji: '🎁', min: 1000, max: 2000 },
    { upTo: 0.99, name: 'Épico', emoji: '💎', min: 2500, max: 5000 },
    { upTo: 1.01, name: 'Legendario', emoji: '👑', min: 8000, max: 15000 }
];

function openChest(rng = Math.random) {
    const roll = rng();
    const tier = TIERS.find(item => roll < item.upTo);
    return { tier, amount: economy.rollBetween(tier.min, tier.max, rng) };
}

module.exports = {
    name: 'cofre',
    aliases: ['chest'],
    category: 'economy',
    description: 'Abre un cofre misterioso (cada 24 horas)',

    async execute(sock, m) {
        const jid = senderJid(m, sock);
        try {
            await economy.ensureUser(jid);
            const cooldown = await claim(jid, CHEST.key, CHEST.ms);
            if (!cooldown.ok) {
                return reply(sock, m, `「✿」 ⏳ Ya abriste tu cofre de hoy. Vuelve en *${formatDuration(cooldown.remainingMs)}*.`);
            }
            const { tier, amount } = openChest();
            await economy.credit(jid, amount);
            return reply(sock, m, `「✿」 ${tier.emoji} Abriste un cofre *${tier.name}*.\n\n*+${economy.money(amount)}* 🌸`);
        } catch (error) {
            console.error('Error en !cofre:', error.message);
            return reply(sock, m, '「✿」 No pude abrir el cofre; inténtalo de nuevo en un momento.');
        }
    },
    TIERS,
    openChest
};
