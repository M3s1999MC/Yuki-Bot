module.exports = {
    name: 'invertir',
    aliases: ['inversion'],
    category: 'economy',
    description: 'Fondo de inversión simulado.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const monto = parseInt(args[0]);

        if (!monto || isNaN(monto)) {
            return await sock.sendMessage(jid, { text: '(「✿」 "MERCADO BURSÁTIL"🌸)\n\nIndica el monto a invertir.\n*Uso:* `!invertir <cantidad>`' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `(「✿」 "INVERSIÓN PROCESADA"🌸)\n\n📈 Tu fondo de ¥${monto.toLocaleString()} ha sido colocado en la bolsa de Yuki.` }, { quoted: m });
    }
};
