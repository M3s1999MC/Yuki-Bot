const { getMessageSenderJid } = require('../../utils/messageSender');
const { sendWithGif } = require('../../utils/reactions');

// Fuente de GIF por acción (nekos.best 'n:' / waifu.pics 'w:'); si fallan, se manda solo el texto.
const GIF_SOURCES = {
    kiss: ['n:kiss', 'w:kiss'], besar: ['n:kiss', 'w:kiss'],
    hug: ['n:hug', 'w:hug'], abrazar: ['n:hug', 'w:hug'],
    slap: ['n:slap', 'w:slap'], bofetada: ['n:slap', 'w:slap'], golpear: ['n:slap', 'w:slap'],
    pat: ['n:pat', 'w:pat'], darpalmada: ['n:pat', 'w:pat'], caricia: ['n:pat', 'w:pat'], acariciar: ['n:pat', 'w:pat'],
    cuddle: ['n:cuddle', 'w:cuddle'], acurrucar: ['n:cuddle', 'w:cuddle'],
    kill: ['w:kill', 'n:shoot'], matar: ['w:kill', 'n:shoot'], asesinar: ['w:kill', 'n:shoot'],
    poke: ['n:poke', 'w:poke'], picar: ['n:poke', 'w:poke'],
    wink: ['n:wink', 'w:wink'], 'guiñar': ['n:wink', 'w:wink']
};

module.exports = {
    name: 'actions',
    aliases: [
        'kiss', 'besar',
        'hug', 'abrazar',
        'slap', 'bofetada', 'golpear',
        'pat', 'darpalmada', 'caricia', 'acariciar',
        'cuddle', 'acurrucar',
        'kill', 'matar', 'asesinar',
        'poke', 'picar',
        'wink', 'guiñar'
    ],
    category: 'general',
    description: 'Realiza acciones de rol e interacción social con otros usuarios.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const prefix = '!';
        const commandUsed = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();

        // Obtener al usuario objetivo (mencionado o citado)
        const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                          m.message?.extendedTextMessage?.contextInfo?.participant;

        if (!targetJid) {
            return await sock.sendMessage(jid, { 
                text: '⚠️ Debes mencionar o responder al mensaje de la persona con la que deseas interactuar.' 
            }, { quoted: m });
        }

        const senderTag = `@${sender.split('@')[0]}`;
        const targetTag = `@${targetJid.split('@')[0]}`;
        const mentions = [sender, targetJid];

        let actionText = '';

        switch (commandUsed) {
            case 'kiss':
            case 'besar':
                actionText = `${senderTag} le ha dado un tierno beso a ${targetTag} 😘`;
                break;
            case 'hug':
            case 'abrazar':
                actionText = `${senderTag} le ha dado un cálido abrazo a ${targetTag} 🤗`;
                break;
            case 'slap':
            case 'bofetada':
            case 'golpear':
                actionText = `${senderTag} le ha propinado una fuerte bofetada a ${targetTag} 👋💥`;
                break;
            case 'pat':
            case 'darpalmada':
            case 'caricia':
            case 'acariciar':
                actionText = `${senderTag} acaricia suavemente la cabeza de ${targetTag} 🐾`;
                break;
            case 'cuddle':
            case 'acurrucar':
                actionText = `${senderTag} se acurruca cariñosamente junto a ${targetTag} 🥰`;
                break;
            case 'kill':
            case 'matar':
            case 'asesinar':
                actionText = `${senderTag} ha eliminado dramáticamente a ${targetTag} 💀🔪`;
                break;
            case 'poke':
            case 'picar':
                actionText = `${senderTag} le está picando las costillas a ${targetTag} 👉`;
                break;
            case 'wink':
            case 'guiñar':
                actionText = `${senderTag} le ha guiñado el ojo a ${targetTag} 😉`;
                break;
            default:
                actionText = `${senderTag} interactúa con ${targetTag} ✨`;
                break;
        }

        await sendWithGif(sock, m, { text: actionText, mentions, sources: GIF_SOURCES[commandUsed] });
    }
};