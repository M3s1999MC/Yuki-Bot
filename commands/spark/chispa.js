const SETTINGS = [
    'un ascensor que se detiene entre dos pisos sin número',
    'una tienda abierta a las 3:17 AM donde solo venden objetos sin nombre',
    'una estación de tren abandonada con un solo altavoz encendido',
    'un cuarto iluminado por una luz verde tenue y un zumbido constante',
    'una azotea en plena lluvia ligera mirando luces lejanas'
];

const CONSTRAINTS = [
    'sin usar la letra E',
    'solo con frases cortas de máximo 6 palabras',
    'como si fuera el final de un episodio',
    'con un tono totalmente calmo frente a algo absurdo',
    'describiendo todo como si fuera un manual técnico'
];

const TWISTS = [
    'el objeto que buscan estaba en su bolsillo desde el inicio',
    'alguien toca la puerta con el mismo ritmo de un latido',
    'la escena se congela y vuelve a empezar un segundo antes',
    'un personaje secundario revela que ya sabía el desenlace'
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

module.exports = {
    name: 'chispa',
    aliases: ['reto', 'prompt', 'idea'],
    category: 'fun',
    description: 'Genera un reto creativo rápido con escenario, regla y giro.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const text = [
            '₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ *Chispa Creativa* ⚡',
            `❀ *Escenario:* ${pick(SETTINGS)}`,
            `❀ *Regla:* _${pick(CONSTRAINTS)}_`,
            `❀ *Giro:* ${pick(TWISTS)}`
        ].join('\n');

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
