const economy = require('../../utils/economy');
const missions = require('../../utils/missions');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'emisiones',
    aliases: ['misioneseconomia', 'misioneseco', 'tareas'],
    category: 'economy',
    description: 'Misiones diarias de economía con recompensas: !emisiones [cobrar]',

    async execute(sock, m, args) {
        try {
            const jid = senderJid(m, sock);
            const wantsClaim = ['cobrar', 'reclamar', 'claim'].includes(String((args || [])[0] || '').toLowerCase());
            let header = '';
            if (wantsClaim) {
                const claimed = await missions.claimAll(jid);
                const total = claimed.reduce((sum, item) => sum + item.reward, 0);
                header = claimed.length
                    ? `🎉 Cobraste *${economy.money(total)}* y ${claimed.reduce((sum, item) => sum + item.exp, 0)} XP.\n\n`
                    : 'No tienes misiones completas por cobrar todavía.\n\n';
            }
            const list = await missions.status(jid);
            const lines = list.map(item => {
                const mark = item.claimed ? '✅ cobrada' : item.done ? '🎁 lista para cobrar' : `${item.progress}/${item.goal}`;
                return `• ${item.label} — ${mark}\n   Premio: ${economy.money(item.reward)} + ${item.exp} XP`;
            });
            return reply(sock, m, `「✿」 📋 *Misiones diarias de economía*\n\n${header}${lines.join('\n')}\n\nCobra las completas con *!emisiones cobrar*. Se reinician a medianoche (hora de Colombia).`);
        } catch (error) {
            console.error('Error en !emisiones:', error.message);
            return reply(sock, m, '「✿」 No pude consultar las misiones; inténtalo de nuevo en un momento.');
        }
    }
};
