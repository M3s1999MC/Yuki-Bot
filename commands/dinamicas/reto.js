const { trackBotSentMessage } = require('../../handlers/aiChat');

const TRUTHS = [
    '¿Cuál es la cosa más rara que has buscado o comido esta semana?',
    '¿A quién de este grupo le confiarías tu contraseña y a quién ni tu cargador?',
    '¿Cuál es tu excusa favorita cuando llegas tarde o desapareces del chat?'
];

const DARES = [
    'Manda el último sticker que usaste sin dar ninguna explicación.',
    'Escribe los próximos tres mensajes usando puras minúsculas o sin vocales en uno.',
    'Dedícale un cumplido exageradamente dramático a la última persona que habló en el grupo.'
];

module.exports = {
    name: 'reto',
    aliases: ['verdadoreto'],
    category: 'dinamicas',
    description: 'Saca una verdad o un reto rápido para animar el chat.',

    async execute(sock, m, args = []) {
        const jid = m?.key?.remoteJid;
        if (!jid) return;

        try {
            if (typeof sock.sendPresenceUpdate === 'function') {
                await sock.sendPresenceUpdate('composing', jid).catch(() => {});
            }

            const modeArg = (Array.isArray(args) && args[0] ? args[0] : '').toLowerCase();
            let mode = 'reto';
            if (modeArg.startsWith('v')) mode = 'verdad';
            else if (modeArg.startsWith('r')) mode = 'reto';
            else mode = Math.random() < 0.5 ? 'verdad' : 'reto';

            const pool = mode === 'verdad' ? TRUTHS : DARES;
            const picked = pool[Math.floor(Math.random() * pool.length)];
            const senderJid = m?.key?.participant || m?.key?.remoteJid;
            const senderTag = senderJid ? `@${senderJid.split('@')[0].split(':')[0]}` : 'Tú';

            const reply = [
                mode === 'verdad' ? '🍡 *Verdad de Orihime*' : '⚡ *Reto de Orihime*',
                `• *Para:* ${senderTag}`,
                ``,
                `${picked}`
            ].join('\n');

            const sent = await sock.sendMessage(
                jid,
                { text: reply, mentions: senderJid ? [senderJid] : [] },
                { quoted: m }
            );
            trackBotSentMessage?.(sent?.key);
        } catch (err) {
            console.error('[reto] Error al lanzar reto:', err.message || err);
            const errMsg = await sock.sendMessage(
                jid,
                { text: '😅 Se me cayó el papelito del reto... ¿probamos de nuevo? 🌸' },
                { quoted: m }
            );
            trackBotSentMessage?.(errMsg?.key);
        } finally {
            if (typeof sock.sendPresenceUpdate === 'function') {
                await sock.sendPresenceUpdate('paused', jid).catch(() => {});
            }
        }
    }
};
