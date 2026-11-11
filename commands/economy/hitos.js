const economy = require('../../utils/economy');
const { reply, senderJid, targetJid, mentionTag } = require('../../utils/commandHelpers');

const MILESTONES = [
    { at: 1000, badge: '🥉 Primer ahorro' },
    { at: 10000, badge: '🥈 Ahorrador' },
    { at: 50000, badge: '🥇 Inversor' },
    { at: 100000, badge: '💎 Cien mil' },
    { at: 500000, badge: '👑 Medio millón' },
    { at: 1000000, badge: '🏆 Millonario' },
    { at: 10000000, badge: '🌟 Magnate' }
];

function evaluate(total) {
    const reached = MILESTONES.filter(item => total >= item.at);
    const next = MILESTONES.find(item => total < item.at) || null;
    return { reached, next };
}

module.exports = {
    name: 'hitos',
    aliases: ['elogros', 'metas'],
    category: 'economy',
    description: 'Insignias por llegar a ciertas cantidades de dinero: !hitos [@usuario]',

    async execute(sock, m) {
        try {
            const jid = targetJid(m) || senderJid(m, sock);
            const total = await economy.netWorth(jid);
            const { reached, next } = evaluate(total);
            const badges = reached.length ? reached.map(item => `• ${item.badge}`).join('\n') : 'Todavía no tiene insignias.';
            const goal = next
                ? `Siguiente meta: *${next.badge}* (faltan ${economy.money(next.at - total)}).`
                : '¡Tiene todas las insignias! 🎉';
            return reply(sock, m, `「✿」 🏅 *Hitos de ${mentionTag(jid)}*\nPatrimonio: *${economy.money(total)}*\n\n${badges}\n\n${goal}`, [jid]);
        } catch (error) {
            console.error('Error en !hitos:', error.message);
            return reply(sock, m, '「✿」 No pude consultar los hitos; inténtalo de nuevo en un momento.');
        }
    },
    MILESTONES,
    evaluate
};
