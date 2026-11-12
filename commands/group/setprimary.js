module.exports = {
    name: 'setprimary',
    aliases: ['botprincipal'],
    category: 'groups',
    description: 'Elegir qué bot responde en el grupo cuando hay varios (bot principal y subbots).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const opcion = args[0] || 'off';

        await sock.sendMessage(jid, {
            text: `(「✿」 "BOT PRINCIPAL CONFIGURADO"🌸)\n\n🤖 Se ha establecido el estado del bot principal/subbot en: \`${opcion}\` para este grupo.`
        }, { quoted: m });
    }
};
