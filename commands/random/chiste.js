const { reply, pickOne } = require('../../utils/commandHelpers');

const jokes = [
    '¿Qué hace una abeja en el gimnasio? ¡Zum-ba! 🐝',
    '¿Por qué los pájaros vuelan hacia el sur? Porque caminando tardarían demasiado. 🐦',
    '¿Cuál es el colmo de un electricista? Que su esposa se llame Luz y sus hijos le sigan la corriente. 💡',
    '¿Cuál es el café más peligroso del mundo? El ex-preso. ☕',
    '¿Qué le dice un gusano a otro gusano? Voy a dar una vuelta a la manzana. 🍎',
    '¿Por qué el libro de matemáticas está triste? Porque tiene demasiados problemas. 📚',
    '¿Cómo se llama el campeón de buceo japonés? Tokofondo. ¿Y el subcampeón? Kasitoko. 🤿',
    '¿Qué le dice un semáforo a otro? No me mires que me pongo rojo. 🚦',
    '¿Qué le dijo un pez a otro pez? Nada. 🐟',
    '¿Por qué el programador se quedó sin amigos? Porque siempre estaba en bucle. 💻',
    'Un programador va al súper y su pareja le dice: "Compra una barra de pan y, si hay huevos, trae seis". Vuelve con seis barras de pan: "¡Había huevos!" 🥖',
    '¿Qué hace un mudo bailando? Una mudanza. 💃',
    '¿Cuál es el animal más antiguo? La cebra, porque está en blanco y negro. 🦓',
    '¿Por qué la computadora fue al médico? Porque tenía un virus. 🖥️',
    '¿Qué le dice una pared a otra? Nos vemos en la esquina. 🧱',
    '¿Cómo se despiden los químicos? Ácido un placer. 🧪',
    '¿Qué le dice un techo a otro techo? Techo de menos. 🏠',
    '¿Qué le dijo el cero al ocho? Bonito cinturón. 🔢',
    '¿Qué le dice una iguana a su hermana gemela? Somos iguanitas. 🦎',
    '¿Qué le dice un zapato a otro? ¡Qué vida más arrastrada! 👟',
    '¿Por qué el esqueleto no fue a la fiesta? Porque no tenía con quién bailar... ni cuerpo para ello. 💀',
    '¿Qué hace un perro con un taladro? Taladrando. 🐶',
    '¿Por qué los astronautas no se quedan a vivir en la Luna? Porque no tiene atmósfera. 🌙',
    '¿Cómo se llama un boomerang que no vuelve? Palo. 🪃'
];

module.exports = {
    name: 'chiste',
    aliases: ['joke'],
    category: 'random',
    description: 'Envía un chiste aleatorio para romper el hielo en el grupo',

    async execute(sock, m) {
        return reply(sock, m, `「✿」 😂 ${pickOne(jokes)}`);
    },
    jokes
};
