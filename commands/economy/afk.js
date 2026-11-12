module.exports = {
    name: 'afk',
    aliases: ['ausente'],
    category: 'economy',
    description: 'Activa o desactiva el modo AFK y gana monedas por minuto.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const motivo = args.join(' ') || 'Sin motivo';

        await sock.sendMessage(jid, {
            text: `(「✿」 "ESTADO DE AUSENCIA ACTIVADO"🌸)\n\n💤 @${sender.split('@')[0]} se encuentra ausente.\n📝 *Motivo:* ${motivo}`,
            mentions: [sender]
        }, { quoted: m });
    }
};
