module.exports = {
    name: 'encuesta',
    aliases: ['poll'],
    description: 'Genera una encuesta rápida para que el grupo vote',
    async execute(sock, m, args) {
        const preg = args.join(' ') || '¿Qué hacemos hoy?';
        await sock.sendMessage(m.key.remoteJid, {
            poll: {
                name: `📊 ${preg}`,
                values: ['Opción 1 👍', 'Opción 2 👎', 'No sé 🤷‍♂️'],
                selectableCount: 1
            }
        });
    }
};
