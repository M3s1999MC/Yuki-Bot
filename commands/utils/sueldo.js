module.exports = {
    name: 'sueldo',
    aliases: ['salario'],
    description: 'Revela tu sueldo imaginario del día',
    async execute(sock, m) {
        const jid = m.key.participant || m.key.remoteJid;
        const sueldo = Math.floor(Math.random() * 5000) + 50;
        await sock.sendMessage(m.key.remoteJid, { 
            text: `💸 El sueldo imaginario de @${jid.split('@')[0]} hoy es de **$${sueldo} en fichas de parque**.`,
            mentions: [jid]
        }, { quoted: m });
    }
};
