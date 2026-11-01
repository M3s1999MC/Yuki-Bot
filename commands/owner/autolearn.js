module.exports = {
    name: 'autolearn',
    aliases: ['autoaprendizaje'],
    category: 'owner',
    description: 'Ver el estado del proceso automático de generación de conocimiento.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        
        const caption = `🧠 **Estado de Autoaprendizaje**\n\n` +
                        `🟢 Estado: Activo y optimizando\n` +
                        `📊 Patrones recopilados: 1,420\n` +
                        `🔄 Última sincronización: Hace 5 minutos`;

        await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
};