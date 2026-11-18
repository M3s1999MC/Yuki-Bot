const economy = require('../../utils/economy');
const adventure = require('../../utils/adventure');
const { reply, senderJid, targetJid, mentionTag } = require('../../utils/commandHelpers');

module.exports = {
    name: 'economyinfo',
    aliases: ['einfo'],
    category: 'economy',
    description: 'Ver tu información financiera y de aventura en Bolívares: !economyinfo [@usuario]',

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

            const walletF = wallet.toLocaleString('es-CO');
            const bankF = bank.toLocaleString('es-CO');
            const totalF = total.toLocaleString('es-CO');
            const puesto = Number(better?.n || 0) + 1;
            const totalPersonas = Number(people?.n || 0);
            const nivel = Number(user.level) || 1;
            const exp = Number(user.exp) || 0;

            const text = `「✿」 INFORMACIÓN FINANCIERA 💼✨\n\n` +
                         `₊˚ˑ༄ Perfil de economía y estatus de: ${mentionTag(jid)}\n\n` +
                         `❀ 👛 *Billetera:* \`$${walletF} Bolívares\`\n` +
                         `❀ 🏦 *Banco Central:* \`$${bankF} Bolívares\`\n` +
                         `❀ 💰 *Patrimonio Neto:* \`$${totalF} Bolívares\`\n` +
                         `❀ 🏆 *Ranking:* \`#${puesto} de ${totalPersonas}\`\n` +
                         `❀ ✨ *Nivel:* \`Nivel ${nivel} (${exp} XP)\`\n` +
                         `❀ ❤️ *Vida actual:* \`${hp}/${adventure.MAX_HP} HP\`\n` +
                         `───────────────────\n` +
                         `❀ _¡Mantén tus fondos a salvo de la hiperinflación!_ 🌸`;

            return reply(sock, m, text, [jid]);

        } catch (error) {
            console.error('Error en !economyinfo:', error.message);
            return reply(sock, m, '「✿」 ERROR DE RED // No pude consultar la información financiera; inténtalo de nuevo en un momento. 🥀');
        }
    }
};
