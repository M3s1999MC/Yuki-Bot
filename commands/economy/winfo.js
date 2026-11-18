const { getMessageSenderJid } = require('../../utils/messageSender');
const { getCooldownInfo, formatDuration } = require('../../utils/cooldowns');

module.exports = {
    name: 'winfo',
    aliases: ['cooldowns', 'esperas', 'espera', 'cd'],
    category: 'economy',
    description: 'Consulta el estado actual de tus tiempos de espera (cooldowns) para comandos de la red en Bolívares.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const targetUser = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
        const username = targetUser.split('@')[0];

        // Lista de comandos con cooldown monitoreados en la economía de Yuki
        const comandosMonitoreados = [
            { id: 'work', nombre: '💼 Trabajo' },
            { id: 'rob', nombre: '🦹‍♂️ Robo / Atraco' },
            { id: 'mine', nombre: '⛏️ Minería' },
            { id: 'ruleta', nombre: '🎡 Ruleta' },
            { id: 'trivia_cd', nombre: '🧠 Trivia' },
            { id: 'fish', nombre: '🎣 Pesca' }
        ];

        let cooldownsText = '';

        for (const cmd of comandosMonitoreados) {
            const cdInfo = await getCooldownInfo(targetUser, cmd.id);
            if (cdInfo.active) {
                const restanteFormateado = formatDuration(cdInfo.remainingMs);
                cooldownsText += `❀ ${cmd.nombre}: ⏳ \`${restanteFormateado}\` restantes\n`;
            } else {
                cooldownsText += `❀ ${cmd.nombre}: ✅ \`¡Disponible!\`\n`;
            }
        }

        const text = `「✿」 PANEL DE COOLDOWNS ⏳✨\n\n` +
                     `₊˚ˑ༄ Estado de tiempos de espera para @${username}:\n\n` +
                     cooldownsText +
                     `───────────────────\n` +
                     `❀ _¡Usa tus comandos a tiempo en la red de Yuki!_ 🌸`;

        await sock.sendMessage(jid, { text, mentions: [targetUser] }, { quoted: m });
    }
};
