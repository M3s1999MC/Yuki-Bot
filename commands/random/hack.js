const { reply, pickOne, randomInt, mentionTag, targetJid, senderJid } = require('../../utils/commandHelpers');

// Todo es inventado: IP del rango de documentación (192.0.2.0/24), correos .invalid y datos absurdos.
const secrets = [
    'memes_que_nadie_entiende.zip (4.2 GB)',
    'tareas_que_no_hice_final_FINAL2.docx',
    'historial_de_busqueda: "como hacer que el cafe se enfrie mas rapido"',
    'fotos_de_mi_gato_durmiendo.rar (981 archivos)',
    'lista_de_cosas_que_dire_manana_y_no_hare.txt'
];
const passwords = ['123456', 'password', 'contraseña', 'qwerty', 'mi_gato_123', 'admin'];

module.exports = {
    name: 'hack',
    aliases: ['hackear'],
    category: 'random',
    description: 'Simula de forma cómica y falsa el hackeo de un usuario mencionado',

    async execute(sock, m, args, usedPrefix = '!') {
        const target = targetJid(m);
        if (!target) {
            return reply(sock, m, `「✿」 Menciona a alguien o responde su mensaje para "hackearlo" 😈\n_Ejemplo:_ ${usedPrefix}hack @usuario`);
        }
        const author = senderJid(m, sock);
        const tag = mentionTag(target);
        const text = `「✿」 💻 *Iniciando hackeo a ${tag}...*\n\n` +
            `▰▰▰▰▰▰▰▰▰▰ 100%\n\n` +
            `🌐 IP: 192.0.2.${randomInt(1, 254)}\n` +
            `📧 Correo: ${tag.slice(1, 5) || 'user'}${randomInt(10, 99)}@ejemplo.invalid\n` +
            `🔑 Contraseña: ${pickOne(passwords)}\n` +
            `📂 Archivo secreto: ${pickOne(secrets)}\n\n` +
            `🤡 *Todo esto es de broma:* no se hackeó nada y no hay datos reales.`;
        return reply(sock, m, text, [target, author].filter(Boolean));
    }
};
