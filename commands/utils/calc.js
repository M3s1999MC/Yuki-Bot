module.exports = {
    name: 'calc',
    aliases: ['calcular'],
    description: 'Realiza cálculos matemáticos rápidos',
    async execute(sock, m, args) {
        const expr = args.join('');
        if (!expr) return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Ingresa una operación. Ejemplo: `!calc 50*12`' }, { quoted: m });
        try {
            const res = eval(expr.replace(/[^0-9+\-*/.]/g, ''));
            await sock.sendMessage(m.key.remoteJid, { text: `🧮 *Resultado:* ${res}` }, { quoted: m });
        } catch {
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Operación matemática no válida.' }, { quoted: m });
        }
    }
};
