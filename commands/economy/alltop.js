const db = require('../../database/db');

function formatNumber(num) {
    return Number(num || 0).toLocaleString('es-CO');
}

function queryRows(sql, params = []) {
    return new Promise((resolve) => {
        if (!db || typeof db.all !== 'function') {
            return resolve(null);
        }
        db.all(sql, params, (err, rows) => {
            if (err || !Array.isArray(rows)) {
                return resolve(null);
            }
            resolve(rows);
        });
    });
}

function formatUserLabel(row, fallbackNumber) {
    const raw = row?.name || row?.username || row?.pushName || row?.jid || `Jugador ${fallbackNumber}`;
    if (typeof raw === 'string' && raw.includes('@')) {
        return `@${raw.split('@')[0]}`;
    }
    return raw;
}

module.exports = {
    name: 'alltop',
    aliases: ['tops'],
    category: 'economy',
    description: 'Ver los primeros puestos de todos los rankings.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        // Intenta consultar rankings reales desde la base de datos con respaldos seguros
        const wealthRows =
            await queryRows(
                `SELECT jid, COALESCE(wallet, 0) + COALESCE(bank, 0) AS total
                 FROM users
                 ORDER BY total DESC
                 LIMIT 5`
            ) ||
            await queryRows(
                `SELECT jid, COALESCE(wallet, 0) AS total
                 FROM users
                 ORDER BY total DESC
                 LIMIT 5`
            );

        const expRows =
            await queryRows(
                `SELECT jid, COALESCE(level, 1) AS level, COALESCE(xp, 0) AS xp
                 FROM users
                 ORDER BY level DESC, xp DESC
                 LIMIT 5`
            ) ||
            await queryRows(
                `SELECT jid, COALESCE(xp, 0) AS xp
                 FROM users
                 ORDER BY xp DESC
                 LIMIT 5`
            );

        const mentions = [];
        const medals = ['🥇', '🥈', '🥉', '✦', '✦'];

        let wealthLines = [
            '  ✦ _Aún no hay registros de moneditas por aquí~_ 🍡'
        ];
        if (wealthRows && wealthRows.length > 0) {
            wealthLines = wealthRows.map((row, idx) => {
                const label = formatUserLabel(row, idx + 1);
                if (row?.jid && typeof row.jid === 'string' && row.jid.includes('@')) {
                    mentions.push(row.jid);
                }
                const totalVal = Number(row.total ?? row.wallet ?? 0);
                return `  ${medals[idx] || '✦'} *${idx + 1}.* ${label} — \`$${formatNumber(totalVal)} Bolívares\``;
            });
        }

        let expLines = [
            '  ✦ _¡Ven a charlar y jugar conmigo para subir de nivel!_ ✨'
        ];
        if (expRows && expRows.length > 0) {
            expLines = expRows.map((row, idx) => {
                const label = formatUserLabel(row, idx + 1);
                if (row?.jid && typeof row.jid === 'string' && row.jid.includes('@')) {
                    mentions.push(row.jid);
                }
                if (row.level !== undefined) {
                    return `  ${medals[idx] || '✦'} *${idx + 1}.* ${label} — *Nivel ${Number(row.level) || 1}* (\`${formatNumber(row.xp)} XP\`)`;
                }
                return `  ${medals[idx] || '✦'} *${idx + 1}.* ${label} — \`${formatNumber(row.xp)} XP\``;
            });
        }

        const uniqueMentions = [...new Set(mentions)];

        const text = [
            '🌸 ˚୨୧⋆｡˚ ⋆ *TABLERO DE ESTRELLAS* ⋆ ˚｡⋆୨୧˚ 🌸',
            '🍡 _¡Mira quiénes están brillando más en la casita de Yuki hoy!_ ✨',
            '',
            '💰 *Top Patrimonio*',
            ...wealthLines,
            '',
            '✨ *Top Experiencia*',
            ...expLines,
            '',
            '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
            '♡ _¿Te animas a colarte en el top la próxima vez?_',
            '_Con cariño, Orihime 🌸_'
        ].join('\n');

        await sock.sendMessage(jid, { text, mentions: uniqueMentions }, { quoted: m });
    }
};
