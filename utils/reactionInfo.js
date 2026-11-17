// utils/reactionInfo.js
// Cómo se muestran las reacciones en el menú: grupo y descripción de cada una.
const GROUPS = [
    { id: 'afecto', title: '💞 Cariño y afecto' },
    { id: 'alegria', title: '😄 Alegría y saludos' },
    { id: 'tristeza', title: '😢 Tristeza, enojo y miedo' },
    { id: 'pena', title: '😳 Timidez y miradas' },
    { id: 'bromas', title: '👊 Golpes y bromas' },
    { id: 'diario', title: '🌸 Del día a día' }
];

// clave del comando -> [grupo, descripción]
const INFO = {
    // Acciones que vienen de commands/general/actions.js
    hug: ['afecto', 'Abraza a alguien'],
    kiss: ['afecto', 'Besa a alguien'],
    cuddle: ['afecto', 'Acurrúcate junto a alguien'],
    pat: ['afecto', 'Acaricia la cabeza de alguien'],
    wink: ['alegria', 'Guiña un ojo a alguien'],
    slap: ['bromas', 'Dale una bofetada a alguien'],
    poke: ['bromas', 'Pica a alguien con el dedo'],
    kill: ['bromas', 'Elimina a alguien de forma dramática (en broma)'],

    handhold: ['afecto', 'Toma de la mano a alguien'],
    highfive: ['afecto', 'Choca los cinco con alguien'],
    peck: ['afecto', 'Dale un piquito a alguien'],
    love: ['afecto', 'Muestra que estás enamorado/a'],
    feed: ['afecto', 'Dale de comer a alguien'],
    cookie: ['afecto', 'Comparte una galleta'],
    tea: ['afecto', 'Toma té con alguien'],

    happy: ['alegria', 'Muestra lo feliz que estás'],
    smile: ['alegria', 'Sonríe'],
    laugh: ['alegria', 'Ríete de algo o de alguien'],
    dance: ['alegria', 'Ponte a bailar'],
    celebrate: ['alegria', 'Celebra con todos'],
    clap: ['alegria', 'Aplaude'],
    thumbsup: ['alegria', 'Aprueba con el pulgar arriba'],
    nod: ['alegria', 'Asiente con la cabeza'],
    wave: ['alegria', 'Saluda con la mano'],
    jump: ['alegria', 'Salta de la emoción'],

    cry: ['tristeza', 'Llora'],
    sad: ['tristeza', 'Muestra que estás triste'],
    angry: ['tristeza', 'Muestra que estás enojado/a'],
    pout: ['tristeza', 'Haz pucheros'],
    facepalm: ['tristeza', 'Llévate la mano a la cara por decepción'],
    sigh: ['tristeza', 'Suspira'],
    scream: ['tristeza', 'Grita'],
    scared: ['tristeza', 'Muestra que estás asustado/a'],
    cringe: ['tristeza', 'Siente cringe'],
    dramatic: ['tristeza', 'Haz un drama'],

    blush: ['pena', 'Sonrójate'],
    shy: ['pena', 'Muestra tu timidez'],
    stare: ['pena', 'Mira fijamente a alguien'],
    lurk: ['pena', 'Acecha en silencio desde las sombras'],
    smug: ['pena', 'Pon cara de superioridad'],
    bleh: ['pena', 'Saca la lengua'],
    surprised: ['pena', 'Muestra sorpresa'],

    punch: ['bromas', 'Dale un puñetazo a alguien'],
    bonk: ['bromas', 'Dale un bonk a alguien'],
    patear: ['bromas', 'Dale una patada a alguien'],
    push: ['bromas', 'Empuja a alguien'],
    bite: ['bromas', 'Muerde a alguien'],
    lick: ['bromas', 'Lame a alguien'],
    tickle: ['bromas', 'Hazle cosquillas a alguien'],
    baka: ['bromas', 'Dile «baka» (tonto) a alguien'],
    step: ['bromas', 'Pisa a alguien'],
    shoot: ['bromas', 'Dispara con el dedo a alguien'],
    killall: ['bromas', 'Ejecuta un killall contra alguien (en broma)'],
    psycho: ['bromas', 'Hazte el/la psicópata'],

    eat: ['diario', 'Come algo delicioso'],
    nom: ['diario', 'Haz «ñam» mordiendo algo'],
    sleep: ['diario', 'Quédate dormido/a'],
    yawn: ['diario', 'Bosteza'],
    bored: ['diario', 'Muestra que estás aburrido/a'],
    drunk: ['diario', 'Anda pasado/a de copas'],
    heat: ['diario', 'Muestra que tienes mucho calor'],
    think: ['diario', 'Ponte a pensar'],
    run: ['diario', 'Sal corriendo'],
    shrug: ['diario', 'Encógete de hombros'],
    nope: ['diario', 'Di que no']
};

module.exports = { GROUPS, INFO };
