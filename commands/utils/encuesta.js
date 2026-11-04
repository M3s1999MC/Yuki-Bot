module.exports = {
    name: 'encuesta',
    alias: ['poll'],
    desc: 'Genera una encuesta rápida para que el grupo vote',
    run: async (sock, m, args) => {
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
