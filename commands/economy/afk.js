module.exports = {
    name: 'afk',
    aliases: ['ausente'],
    category: 'economy',
    description: 'Activa el modo AFK y gana monedas por cada minuto que estés ausente.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const motivo = args.join(' ') || 'Sin motivo especificado';

        // TODO: Guardar en Neon/Postgres: { user_id: sender, afk_since: Date.now(), reason: motivo }
        // Nota: En tu manejador de mensajes principal (index.js), verifica si el usuario tenía AFK activo
        // al escribir un nuevo mensaje para calcular: minutos = Math.floor((Date.now() - afk_since) / 60000)
        // y darle minutos * 15 yenes.

        await sock.sendMessage(jid, {
            text: `💤 *@${sender.split('@')[0]}* ahora está en modo AFK.\n📝 *Motivo:* ${motivo}\n🪙 *Bono:* Ganarás ¥15 por cada minuto ausente.`,
            mentions: [sender]
        }, { quoted: m });
    }
};
