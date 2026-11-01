module.exports = {
    name: 'botones',
    aliases: ['btn', 'buttons'],
    category: 'utility',
    description: 'Muestra un ejemplo de menú interactivo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const caption = `🌸 **Menú Interactivo de Prueba**\n\nSelecciona una opción o escribe el comando correspondiente.`;
        
        await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
};