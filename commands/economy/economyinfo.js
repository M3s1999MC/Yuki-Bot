const economy = require('../../utils/economy');
const adventure = require('../../utils/adventure');
const { reply, senderJid, targetJid, mentionTag } = require('../../utils/commandHelpers');

module.exports = {
    name: 'economyinfo',
    aliases: ['einfo'],
    category: 'economy',
    description: 'Ver tu información de economía (o la de otro): !economyinfo [@usuario]',

    async execute(sock, m) {
        try {
            const jid = targetJid(m) || senderJid(m, sock);
            const user = await economy.ensureUser(jid);
            const wallet = Math.max(0, Number(user.wallet) || 0);
            const bank = Math.max(0, Number(user.bank) || 0);
            const total = wallet + bank;
            const better = await economy.get('SELECT COUNT(*) AS n FROM users WHERE (COALESCE(wallet, 0) + COALESCE(bank, 0)) > ?', [total]);
            const people = await economy.get('SELECT COUNT(*) AS n FROM users', []);
            const hp = await adventure.getHp(jid);
            const text = `「✿」 💼 *Economía de ${mentionTag(jid)}*\n\n👛 Billetera: ${economy.money(wallet)}\n🏦 Banco: ${economy.money(bank)}\n💰 Patrimonio: *${economy.money(total)}*\n🏆 Puesto: #${Number(better?.n || 0) + 1} de ${Number(people?.n || 0)}\n⭐ Nivel ${Number(user.level) || 1} (${Number(user.exp) || 0} XP)\n❤️ Vida: ${hp}/${adventure.MAX_HP}`;
            return reply(sock, m, text, [jid]);
        } catch (error) {
            console.error('Error en !economyinfo:', error.message);
            return reply(sock, m, '「✿」 No pude consultar la información; inténtalo de nuevo en un momento.');
        }
    }
};
