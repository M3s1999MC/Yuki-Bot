const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');
const { claim, formatDuration } = require('../../utils/cooldowns');

// Banco de preguntas de trivia con su respectiva respuesta correcta y premio en Bolívares
const PREGUNTAS = [
    {
        pregunta: "¿Cuál es el planeta más grande del sistema solar?",
        opciones: ["Saturno", "Júpiter", "Neptuno", "Marte"],
        correcta: "b", // índice 1 o letra 'b'
        premio: 1500
    },
    {
        pregunta: "¿En qué año comenzó la Segunda Guerra Mundial?",
        opciones: ["1939", "1941", "1945", "1914"],
        correcta: "a",
        premio: 1500
    },
    {
        pregunta: "¿Cuál es el elemento químico cuyo símbolo es Au?",
        opciones: ["Plata", "Cobre", "Oro", "Aluminio"],
        correcta: "c",
        premio: 1500
    },
    {
        pregunta: "¿Quién escribió la novela 'Cien años de soledad'?",
        opciones: ["Mario Vargas Llosa", "Gabriel García Márquez", "Pablo Neruda", "Isabel Allende"],
        correcta: "b",
        premio: 1500
    },
    {
        pregunta: "¿Cuál es el océano más grande de la Tierra?",
        opciones: ["Atlántico", "Índico", "Ártico", "Pacífico"],
        correcta: "d",
        premio: 1500
    }
];

module.exports = {
    name: 'trivia',
    aliases: ['preguntados', 'quiz'],
    category: 'economy',
    description: 'Responde preguntas de cultura general para ganar Bolívares en la red.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const respuestaUsuario = args[0]?.toLowerCase();

        // Si el usuario no responde con una opción, mostramos una pregunta aleatoria
        if (!respuestaUsuario || !['a', 'b', 'c', 'd'].includes(respuestaUsuario)) {
            // Cooldown de 15 segundos para pedir una nueva trivia
            const cooldown = await claim(sender, 'trivia_cd', 15000);
            if (!cooldown.ok) {
                const remainingFormatted = formatDuration(cooldown.remainingMs);
                return sock.sendMessage(jid, { 
                    text: `「✿」 COOLDOWN DE TRIVIA ⏳\n\n₊˚ˑ༄ Ya hay una pregunta activa o debes esperar *${remainingFormatted}* para solicitar otra.` 
                }, { quoted: m });
            }

            // Seleccionar pregunta aleatoria
            const triviaItem = PREGUNTAS[Math.floor(Math.random() * PREGUNTAS.length)];
            
            // Guardar temporalmente la respuesta correcta en memoria o cache simple (o usar un sistema de sesión si se prefiere)
            // Para simplicidad y robustez en comandos individuales, guardaremos el reto activo o seleccionaremos por hash, 
            // pero lo ideal es almacenar el estado o validar directamente. Aquí usaremos un enfoque interactivo limpio:
            
            const texto = `「✿」 TRIVIA DE CULTURA GENERAL 🧠✨\n\n` +
                          `₊˚ˑ༄ Pon a prueba tus conocimientos y gana Bolívares:\n\n` +
                          `❓ *${triviaItem.pregunta}*\n\n` +
                          `a) ${triviaItem.opciones[0]}\n` +
                          `b) ${triviaItem.opciones[1]}\n` +
                          `c) ${triviaItem.opciones[2]}\n` +
                          `d) ${triviaItem.opciones[3]}\n\n` +
                          `───────────────────\n` +
                          `❀ *Responde con:* \`${usedPrefix}trivia <a|b|c|d>\`\n` +
                          `❀ *Premio:* \`$${triviaItem.premio.toLocaleString('es-CO')} Bolívares\` 🌸`;

            // Nota: Para verificar la respuesta de forma precisa en la misma sesión, 
            // guardamos la letra correcta en una propiedad global temporal o en la BD si se requiere persistencia.
            // Aquí guardamos la respuesta correcta en global.activeTrivia por simplicidad del chat:
            global.activeTrivia = global.activeTrivia || {};
            global.activeTrivia[sender] = {
                correcta: triviaItem.correcta,
                premio: triviaItem.premio,
                pregunta: triviaItem.pregunta
            };

            return await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
        }

        // Si el usuario envió una respuesta (!trivia a/b/c/d)
        global.activeTrivia = global.activeTrivia || {};
        const triviaActiva = global.activeTrivia[sender];

        if (!triviaActiva) {
            return sock.sendMessage(jid, { 
                text: `「✿」 SIN TRIVIA ACTIVA 🥀\n\n₊˚ˑ༄ Primero solicita una pregunta escribiendo simplemente \`${usedPrefix}trivia\` sin opciones.` 
            }, { quoted: m });
        }

        const esCorrecta = respuestaUsuario === triviaActiva.correcta;
        const premio = triviaActiva.premio;
        const premioF = premio.toLocaleString('es-CO');

        // Limpiar trivia activa para este usuario
        delete global.activeTrivia[sender];

        if (esCorrecta) {
            db.getSafeUser(sender, (errUser) => {
                if (errUser) {
                    return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude acreditar tu premio. 🥀' }, { quoted: m });
                }

                db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [premio, sender], async (updateErr) => {
                    if (updateErr) {
                        return sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // No se pudo actualizar tu billetera. 🥀' }, { quoted: m });
                    }

                    const text = `「✿」 ¡RESPUESTA CORRECTA! 🎉✨\n\n` +
                                 `₊˚ˑ༄ ¡Demostraste gran cultura general en el ciberespacio!\n` +
                                 `❀ 💰 *Premio acreditado:* \`+$${premioF} Bolívares\`\n` +
                                 `───────────────────\n` +
                                 `❀ _¡Vuelve a jugar con_ \`${usedPrefix}trivia\` _cuando quieras!_ 🌸`;

                    await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                });
            });
        } else {
            const letraCorrecta = triviaActiva.correcta.toUpperCase();
            const text = `「✿」 RESPUESTA INCORRECTA 🥀\n\n` +
                         `₊˚ˑ༄ Esa no era la respuesta correcta para la pregunta.\n` +
                         `❀ *La opción correcta era:* \`${letraCorrecta}\`\n` +
                         `───────────────────\n` +
                         `❀ _¡Sigue intentando en la red de Yuki!_ 📉`;

            await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
        }
    }
};
