module.exports = {
    name: 'ping',
    aliases: ['p'],
    category: 'general',
    description: 'Muestra la latencia y velocidad de respuesta del bot.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const start = Date.now();
        
        const sent = await sock.sendMessage(jid, { text: 'Midiendo latencia...' }, { quoted: m });
        const latency = Date.now() - start;

        await sock.sendMessage(jid, { 
            text: `**¡Pong!**\n⚡ Latencia: *${latency} ms*` 
        }, { edit: sent.key });
    }
};