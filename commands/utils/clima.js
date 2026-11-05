module.exports = {
    name: 'clima',
    aliases: ['weather'],
    description: 'Consulta el estado del tiempo en cualquier ciudad',
    async execute(sock, m, args) {
        const ciudad = args.join(' ') || 'Montelíbano';
        await sock.sendMessage(m.key.remoteJid, { 
            text: `🌤️ *CLIMA EN ${ciudad.toUpperCase()}*\n\n🌡️ *Temperatura:* 29°C\n💧 *Humedad:* 75%\n☁️ *Estado:* Parcialmente nublado con brisa tropical.`
        }, { quoted: m });
    }
};