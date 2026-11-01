const firstNames = ['Ari', 'Nara', 'Kaia', 'Ren', 'Mika', 'Sora', 'Yuna', 'Noa', 'Akira', 'Lumi'];
const surnames = ['Aster', 'Kisaragi', 'Tsukino', 'Amaya', 'Hoshino', 'Kurose', 'Minazuki', 'Fujita', 'Shiranui', 'Kazehara'];
const roles = ['guardiana de las estrellas', 'alquimista viajera', 'piloto de mechas', 'detective sobrenatural', 'cantante de una ciudad flotante'];
const designs = [
    'Silueta atlética, abrigo corto blanco con detalles turquesa, guantes oscuros y ojos color ámbar.',
    'Cabello azul noche, chaqueta amplia violeta, botas plateadas y accesorios con forma de luna.',
    'Vestido asimétrico coral y negro, una capa translúcida y mechones verdes en el cabello.',
    'Uniforme futurista marfil con líneas doradas, bufanda roja y una pequeña insignia de cristal.',
    'Ropa de viajera en tonos jade y crema, cinturón con frascos y cabello recogido en dos trenzas.'
];
const personalities = [
    'Curiosa y optimista, aunque se mete en problemas por ayudar a desconocidos.',
    'Serena y observadora; tiene un humor seco que aparece cuando menos se espera.',
    'Valiente y competitiva, pero siempre cumple las promesas que hace.',
    'Ingeniosa y amable, con una fascinación por los mapas y las historias antiguas.',
    'Reservada al principio, leal y muy protectora con sus amistades.'
];

function choose(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function createFallbackCharacter() {
    const name = `${choose(firstNames)} ${choose(surnames)}`;
    const role = choose(roles);
    const design = choose(designs);
    return {
        name,
        role,
        description: `${name} es una ${role} que recorre mundos desconocidos en busca de respuestas y nuevas amistades.`,
        design,
        personality: choose(personalities),
        pinterest_query: `original anime character illustration ${design}`
    };
}

module.exports = { createFallbackCharacter };
