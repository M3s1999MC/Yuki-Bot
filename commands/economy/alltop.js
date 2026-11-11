const economy = require('../../utils/economy');
const { reply } = require('../../utils/commandHelpers');

const MEDALS = ['🥇', '🥈', '🥉'];

function displayName(row, jidKey = 'jid') {
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (name && name !== 'Usuario') return name;
    return String(row[jidKey] || '').split('@')[0] || 'Usuario';
}

function renderBlock(title, rows, formatValue, jidKey) {
    if (!rows.length) return '';
    const lines = rows.map((row, index) => `${MEDALS[index] || `${index + 1}.`} ${displayName(row, jidKey)} — ${formatValue(row)}`);
    return `*${title}*\n${lines.join('\n')}`;
}

async function safeAll(sql, params) {
    try {
        return await economy.all(sql, params);
    } catch (error) {
        console.error('alltop: no se pudo consultar un ranking:', error.message);
        return [];
    }
}

module.exports = {
    name: 'alltop',
    aliases: ['tops'],
    category: 'economy',
    description: 'Ver los primeros puestos de todos los rankings en un solo mensaje',

    async execute(sock, m) {
        const chat = m.key.remoteJid;
        const wealth = await safeAll(
            'SELECT jid, name, (COALESCE(wallet, 0) + COALESCE(bank, 0)) AS total FROM users ORDER BY total DESC LIMIT 3', []
        );
        const experience = await safeAll('SELECT jid, name, COALESCE(exp, 0) AS exp FROM users ORDER BY exp DESC LIMIT 3', []);
        const characters = await safeAll(
            'SELECT u.jid AS jid, u.name AS name, COUNT(*) AS total FROM user_harem h JOIN users u ON u.jid = h.user_jid GROUP BY u.jid, u.name ORDER BY total DESC LIMIT 3', []
        );
        const messages = chat.endsWith('@g.us')
            ? await safeAll(
                'SELECT c.user_jid AS jid, u.name AS name, c.count AS total FROM message_counts c LEFT JOIN users u ON u.jid = c.user_jid WHERE c.group_jid = ? ORDER BY c.count DESC LIMIT 3', [chat]
            )
            : [];

        const blocks = [
            renderBlock('💰 Patrimonio', wealth, row => economy.money(row.total)),
            renderBlock('⭐ Experiencia', experience, row => `${Number(row.exp).toLocaleString('es-CO')} XP`),
            renderBlock('🎴 Personajes', characters, row => `${row.total}`),
            renderBlock('💬 Mensajes del grupo', messages, row => `${Number(row.total).toLocaleString('es-CO')}`)
        ].filter(Boolean);

        if (!blocks.length) return reply(sock, m, '「✿」 Todavía no hay datos para los rankings. 🌸');
        return reply(sock, m, `「✿」 🏆 *Primeros puestos*\n\n${blocks.join('\n\n')}`);
    },
    displayName
};
