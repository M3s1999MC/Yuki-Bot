module.exports = {
    name: 'moneda',
    aliases: ['flip', 'lanzarmoneda'],
    category: 'fun',
    description: 'Lanza una moneda con posibilidad de caer de canto.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const roll = Math.random();

        let result;
        if (roll < 0.02) {
            result = '🪙 *¡CAYÓ DE CANTO!* Resultado rarísimo cortesía de Yuki.';
        } else if (roll < 0.51) {
            result = '🌕 *CARA* — Hoy toca ir con decisión.';
        } else {
            result = '🌑 *CRUZ* — Hoy toca observar con calma.';
        }

        await sock.sendMessage(jid, {
            text: `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ *Moneda*\n❀ ${result}`
        }, { quoted: m });
    }
};
