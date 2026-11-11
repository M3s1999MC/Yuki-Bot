// utils/jobs.js
// Trabajos con espera (cooldown) guardada en la base de datos. Cada trabajo paga un rango y puede fallar.
const { claim, release, formatDuration } = require('./cooldowns');
const economy = require('./economy');

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

const JOBS = [
    {
        key: 'migajear', name: 'migajear', aliases: ['limosna', 'ayudas'], emoji: '🪙', label: 'Migajear',
        desc: 'Pedir ayudas, ganancia mínima pero rápida (cada 30 minutos)',
        cooldownMs: 30 * MIN, min: 50, max: 200, failChance: 0, lossMin: 0, lossMax: 0,
        wins: ['Pasaste la tarde pidiendo ayudas y la gente fue generosa.', 'Alguien te dejó unas monedas y un buen consejo.', 'Encontraste unas monedas debajo de una banca del parque.'],
        fails: []
    },
    {
        key: 'vendedor', name: 'vendedor', aliases: ['ambulante'], emoji: '🛒', label: 'Vendedor ambulante',
        desc: 'Ventas ambulantes, ganancia pequeña pero segura (cada 30 minutos)',
        cooldownMs: 30 * MIN, min: 150, max: 450, failChance: 0, lossMin: 0, lossMax: 0,
        wins: ['Vendiste todas tus empanadas antes del mediodía.', 'Una señora compró tus dulces para toda la familia.', 'Con el calor que hacía, se acabaron las bebidas frías.'],
        fails: []
    },
    {
        key: 'uber', name: 'uber', aliases: ['conductor'], emoji: '🚗', label: 'Uber',
        desc: 'Conducción de viajes, riesgo de choques y multas (cada 45 minutos)',
        cooldownMs: 45 * MIN, min: 200, max: 700, failChance: 0.2, lossMin: 100, lossMax: 400,
        wins: ['Llevaste a un pasajero al aeropuerto y dejó buena propina.', 'Hora pico: cobraste tarifa doble.', 'Un turista te pagó de más por el tour improvisado.'],
        fails: ['Un bache enorme te costó una llanta.', 'Te pusieron una multa por estacionar mal.']
    },
    {
        key: 'espiar', name: 'espiar', aliases: ['espia'], emoji: '🕵️', label: 'Espionaje',
        desc: 'Espionaje, riesgo de ser descubierto (cada 1 hora)',
        cooldownMs: HOUR, min: 400, max: 1400, failChance: 0.35, lossMin: 200, lossMax: 700,
        wins: ['Conseguiste información valiosa y la vendiste muy bien.', 'Un sobre misterioso pagó tus servicios de investigador.', 'Tu informe secreto interesó a un cliente generoso.'],
        fails: ['Te descubrieron y tuviste que pagar para salir del lío.', 'Tu disfraz de arbusto no engañó a nadie.']
    },
    {
        key: 'ninero', name: 'niñero', aliases: ['ninero', 'cuidador'], emoji: '🧸', label: 'Niñero',
        desc: 'Cuidado de niños, pago alto con riesgo de descuido (cada 1 hora)',
        cooldownMs: HOUR, min: 500, max: 1500, failChance: 0.25, lossMin: 200, lossMax: 600,
        wins: ['Los niños se durmieron temprano y los padres pagaron extra.', 'Jugaste a los piratas toda la tarde y cobraste muy bien.', 'Hiciste las tareas con ellos y te dieron propina.'],
        fails: ['Se acabó la leche y tuviste que reponerla de tu bolsillo.', 'Un jarrón se rompió bajo tu cuidado.']
    },
    {
        key: 'explorar', name: 'explorar', aliases: ['investigar'], emoji: '🧭', label: 'Exploración',
        desc: 'Exploración, ganancia media-alta (cada 1 hora y 30 minutos)',
        cooldownMs: 90 * MIN, min: 700, max: 2000, failChance: 0.15, lossMin: 200, lossMax: 600,
        wins: ['Encontraste un mapa antiguo y lo vendiste a un coleccionista.', 'Tu expedición desenterró unas monedas viejas.', 'Descubriste una cueva y un guía pagó por la ubicación.'],
        fails: ['Te perdiste en el bosque y pagaste un guía para salir.']
    },
    {
        key: 'youtuber', name: 'youtuber', aliases: ['cc'], emoji: '🎬', label: 'Youtuber',
        desc: 'Contenido en YouTube, buena ganancia (cada 2 horas)',
        cooldownMs: 2 * HOUR, min: 900, max: 2600, failChance: 0.1, lossMin: 200, lossMax: 500,
        wins: ['Tu video se hizo popular y los anuncios pagaron bien.', 'Una marca patrocinó tu canal esta semana.', 'Llegaron suscriptores nuevos y las donaciones también.'],
        fails: ['Tu video fue desmonetizado por usar música sin permiso.']
    },
    {
        key: 'influencer', name: 'influencer', aliases: ['tiktoker'], emoji: '📱', label: 'Influencer',
        desc: 'Contenido viral, buena ganancia con riesgo de fracaso (cada 2 horas)',
        cooldownMs: 2 * HOUR, min: 800, max: 3000, failChance: 0.3, lossMin: 300, lossMax: 900,
        wins: ['Tu baile se volvió viral y llegaron los patrocinios.', 'Una marca te regaló un contrato por tu último video.', 'Tu reseña tuvo millones de vistas.'],
        fails: ['Tu publicación no gustó y pagaste una campaña para recuperarte.', 'Una colaboración salió mal y tuviste que indemnizar.']
    },
    {
        key: 'mazmorra', name: 'mazmorra', aliases: ['castillo'], emoji: '🏰', label: 'Mazmorra',
        desc: 'Máximo riesgo, máxima recompensa (cada 2 horas)',
        cooldownMs: 2 * HOUR, min: 500, max: 5000, failChance: 0.45, lossMin: 500, lossMax: 1500,
        wins: ['Derrotaste al jefe final y saqueaste su tesoro.', 'Encontraste un cofre escondido tras una trampa.', 'Rescataste a un mago que te pagó con oro.'],
        fails: ['El dragón de la mazmorra te dejó sin bolsillos.', 'Una trampa te hizo soltar parte del botín.']
    },
    {
        key: 'superalbanil', name: 'superalbañil', aliases: ['superalbanil', 'albañil', 'albanil'], emoji: '🧱', label: 'Superalbañil',
        desc: 'Construcción pesada, la mejor paga (cada 3 horas)',
        cooldownMs: 3 * HOUR, min: 2000, max: 4500, failChance: 0.05, lossMin: 200, lossMax: 600,
        wins: ['Terminaste una obra enorme y el contratista pagó el bono.', 'Levantaste muros todo el día y cobraste la mejor paga.', 'Tu obra quedó tan derecha que te recomendaron a otros clientes.'],
        fails: ['Se rompió una herramienta y tuviste que reponerla.']
    }
];

const JOBS_BY_KEY = new Map(JOBS.map(job => [job.key, job]));

function cooldownKey(job) {
    return `job:${job.key}`;
}

/**
 * Ejecuta un trabajo: reclama la espera de forma atómica, tira el resultado y mueve el dinero.
 * `rng` se puede inyectar para pruebas. Si algo falla después de reclamar la espera, la libera.
 * @returns {Promise<{ok:false, remainingMs:number} | {ok:true, success:boolean, amount:number, text:string}>}
 */
async function performJob(jid, job, { now = Date.now(), rng = Math.random } = {}) {
    await economy.ensureUser(jid);
    const cooldown = await claim(jid, cooldownKey(job), job.cooldownMs, now);
    if (!cooldown.ok) return { ok: false, remainingMs: cooldown.remainingMs };

    try {
        if (rng() < job.failChance && job.fails.length) {
            const wanted = economy.rollBetween(job.lossMin, job.lossMax, rng);
            const lost = await economy.debitUpTo(jid, wanted);
            return { ok: true, success: false, amount: lost, text: economy.pickFrom(job.fails, rng) };
        }
        const gain = economy.rollBetween(job.min, job.max, rng);
        await economy.credit(jid, gain);
        return { ok: true, success: true, amount: gain, text: economy.pickFrom(job.wins, rng) };
    } catch (error) {
        await release(jid, cooldownKey(job)).catch(() => {});
        throw error;
    }
}

function formatJobResult(job, result) {
    if (!result.ok) {
        return `「✿」 ⏳ Aún no puedes usar *${job.label}*. Vuelve en *${formatDuration(result.remainingMs)}*.`;
    }
    if (result.success) {
        return `「✿」 ${job.emoji} *${job.label}*\n${result.text}\n\n*+${economy.money(result.amount)}* 🌸`;
    }
    if (result.amount > 0) {
        return `「✿」 ${job.emoji} *${job.label}*\n${result.text}\n\n*-${economy.money(result.amount)}* 💸`;
    }
    return `「✿」 ${job.emoji} *${job.label}*\n${result.text}\n\nPor suerte no tenías nada que perder. 😅`;
}

module.exports = { JOBS, JOBS_BY_KEY, cooldownKey, performJob, formatJobResult };
