const { getMessageSenderJid } = require('../../utils/messageSender');

const SIGNS = [
    'Cuando el reloj marque un número capicúa',
    'Si alguien escribe un punto final sin motivo',
    'Tras tres mensajes seguidos en mayúsculas',
    'Justo antes de que cargue una página lenta'
];

const TWISTS = [
    'aparecerá una idea brillante justo cuando ya ibas a cerrar todo',
    'un archivo que creías perdido volverá a dar señales de vida',
    'alguien cambiará de opinión a mitad de la frase',
    'una coincidencia tonta hará reír al chat sin aviso'
];

const WARNINGS = [
    'No confíes en el primer impulso.',
    'Guarda tu avance antes de probar algo nuevo.',
    'Respira hondo y deja que el momento pase.',
    'A veces lo más simple resuelve el lío.'
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

module.exports = {
    name: 'profecia',
    aliases: ['oraculo', 'prediccion'],
    category: 'fun',
    description: 'Lanza una profecía con el sello de Yuki.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target = mentioned || getMessageSenderJid(m, sock);
        const tag = `@${target.split('@')[0]}`;

        const text = [
            `₊˚ˑ༄ 𝖄𝖚𝖐𝖎 ꔛ *Oráculo para ${tag}* 🔮`,
            `❀ *Señal:* ${pick(SIGNS)},`,
            `❀ *Suceso:* ${pick(TWISTS)}.`,
            `❀ *Aviso:* _${pick(WARNINGS)}_`
        ].join('\n');

        await sock.sendMessage(jid, { text, mentions: [target] }, { quoted: m });
    }
};
