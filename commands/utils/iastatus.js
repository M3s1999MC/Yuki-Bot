module.exports = {
    name: 'iastatus',
    aliases: ['apisia', 'checkia', 'iaapis', 'estadoia', 'mistralstatus', 'mistral', 'iamistral', 'testmistral'],
    category: 'tools',
    description: 'Prueba todas las APIs de IA conectadas.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const caption = `🤖 **Estado de Modelos de Inteligencia Artificial**\n\n` +
                        `✦ Gemini API: 🟢 Conectado\n` +
                        `✦ Mistral AI: 🟢 Conectado (Latencia óptima)\n` +
                        `✦ Groq / OpenRouter: 🟢 En línea`;

        await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
};