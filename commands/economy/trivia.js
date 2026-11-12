module.exports = {
    name: 'trivia',
    category: 'economy',
    description: 'Responde una pregunta de cultura general y gana monedas y experiencia.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        // Base de preguntas rápida (puedes ampliarla o conectarla a una BD)
        const preguntas = [
            {
                pregunta: '¿Cuál es el planeta más grande del sistema solar?',
                opciones: ['a) Saturno', 'b) Júpiter', 'c) Neptuno', 'd) Marte'],
                respuesta: 'b'
            },
            {
                pregunta: '¿En qué país se originó el anime?',
                opciones: ['a) Corea del Sur', 'b) China', 'c) Japón', 'd) Tailandia'],
                respuesta: 'c'
            },
            {
                pregunta: '¿Cuál es el elemento químico cuyo símbolo es Au?',
                opciones: ['a) Plata', 'b) Oro', 'c) Cobre', 'd) Aluminio'],
                respuesta: 'b'
            }
        ];

        const seleccion = preguntas[Math.floor(Math.random() * preguntas.length)];

        const texto = `🧠 *TRIVIA DE CULTURA GENERAL* 🧠\n\n` +
                      `❓ ${seleccion.pregunta}\n\n` +
                      seleccion.opciones.join('\n') + `\n\n` +
                      `💡 *Responde citando este mensaje o escribiendo la letra (ej: !trivia b)*`;

        await sock.sendMessage(jid, { text: texto }, { quoted: m });
    }
};
