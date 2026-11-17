// utils/reactions.js
// Reacciones de anime: texto con menciones y, si se consigue, un GIF (nekos.best / waifu.pics).
// Si la API, la descarga o ffmpeg fallan, se envía solo el texto: la reacción nunca se pierde.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { reply, senderJid, targetJid, mentionTag } = require('./commandHelpers');

// [clave, alias, fuente del GIF, emoji, texto sin objetivo, texto con objetivo]. {a} = quien la hace, {b} = objetivo.
const REACTIONS = [
    ['angry', ['enojado'], ['n:angry', 'n:pout', 'w:bully'], '😠', '{a} está enojado/a (╬-_,-)', '{a} está enojado/a con {b} (╬-_,-)'],
    ['baka', ['tonto'], 'n:baka', '💢', '{a} grita «¡baka!» (¬_¬ )', '{a} le dice baka a {b} (¬_¬ )'],
    ['bite', ['morder'], 'n:bite', '😬', '{a} muerde el aire (｡•́︿•̀｡)', '{a} muerde a {b} (｡•́︿•̀｡)'],
    ['bleh', ['lengua'], 'n:smug', '😛', '{a} saca la lengua (≧ω≦)', '{a} le saca la lengua a {b} (≧ω≦)'],
    ['blush', ['sonrojar'], 'n:blush', '😊', '{a} se sonrojó (///ω///)', '{a} se sonrojó por {b} (///ω///)'],
    ['bonk', ['golpe'], 'w:bonk', '🔨', '{a} da un bonk (ーー;)', '{a} le dio un bonk a {b} (ーー;)'],
    ['bored', ['aburrido'], 'n:bored', '🥱', '{a} está aburrido/a (_ _)..zzZ', '{a} se aburre con {b} (_ _)..zzZ'],
    ['celebrate', ['celebrar'], 'n:dance', '🎉', '{a} celebra ✨(★ω★)', '{a} celebra junto a {b} ✨(★ω★)'],
    ['clap', ['aplaudir'], null, '👏', '{a} aplaude (・ω・)b', '{a} aplaude a {b} (・ω・)b'],
    ['cookie', ['galleta'], 'n:nom', '🍪', '{a} come una galleta (๑\'ᵕ\'๑)', '{a} le da una galleta a {b} (๑\'ᵕ\'๑)'],
    ['cringe', ['grima'], 'w:cringe', '😬', '{a} siente cringe (•_•;)', '{a} siente cringe por {b} (•_•;)'],
    ['cry', ['llorar'], 'n:cry', '😭', '{a} está llorando (╥﹏╥)', '{a} llora por {b} (╥﹏╥)'],
    ['dance', ['bailar'], 'n:dance', '💃', '{a} se pone a bailar ₍ᐢ- ̫-ᐢ₎', '{a} baila con {b} ₍ᐢ- ̫-ᐢ₎'],
    ['dramatic', ['drama'], null, '🎭', '{a} hace un drama (o_O)✨', '{a} le hace un drama a {b} (o_O)✨'],
    ['drunk', ['borracho'], null, '🥴', '{a} anda pasado/a de copas (＠_＠;)', '{a} anda pasado/a de copas con {b} (＠_＠;)'],
    ['eat', ['comida'], 'n:nom', '🍽️', '{a} come algo delicioso ( ˘ ³˘)♥', '{a} come junto a {b} ( ˘ ³˘)♥'],
    ['facepalm', ['decepcion'], 'n:facepalm', '🤦', '{a} se lleva la mano a la cara (facepalm)', '{a} se decepciona de {b} (facepalm)'],
    ['feed', ['alimentar'], 'n:feed', '🍙', '{a} come algo (๑\'um\'๑)', '{a} le da de comer a {b} (๑\'um\'๑)'],
    ['handhold', ['tomar-mano'], 'n:handhold', '🤝', '{a} extiende la mano ⸜(｡˃ ᵕ ˂ )⸝♡', '{a} toma la mano de {b} ⸜(｡˃ ᵕ ˂ )⸝♡'],
    ['happy', ['feliz'], 'n:happy', '😄', '{a} está feliz (˶˃ᆺ˂˶)', '{a} está feliz con {b} (˶˃ᆺ˂˶)'],
    ['heat', ['calor'], null, '🥵', '{a} tiene mucho calor (;;;*_*)', '{a} se muere de calor junto a {b} (;;;*_*)'],
    ['highfive', ['chocar'], 'n:highfive', '🙌', '{a} choca esos cinco o/o', '{a} chocó esos cinco con {b} o/o'],
    ['jump', ['saltar'], null, '🦘', '{a} salta de la emoción ૮ ˶ᵔ ᵕ ᵔ˶ ա', '{a} salta junto a {b} ૮ ˶ᵔ ᵕ ᵔ˶ ա'],
    ['patear', ['patada'], 'n:kick', '🦶', '{a} patea el aire (╬-_,-)', '{a} le dio una patada a {b} (╬-_,-)'],
    ['killall', ['matartodos'], null, '💻', '{a} ejecuta un killall (en broma) [404]', '{a} ejecuta killall contra {b} (en broma) [404]'],
    ['laugh', ['reir'], 'n:laugh', '😂', '{a} se ríe (*^ω^*)', '{a} se ríe de {b} (*^ω^*)'],
    ['lick', ['lamer'], 'w:lick', '👅', '{a} lame el aire ˘ ³˘', '{a} lamió a {b} ˘ ³˘'],
    ['love', ['amor'], null, '💖', '{a} se siente enamorado/a ( ˘ ³˘)♥', '{a} está enamorado/a de {b} ( ˘ ³˘)♥'],
    ['lurk', ['acechar'], 'n:lurk', '👀', '{a} acecha desde las sombras (👁️ ͜ʖ👁️)', '{a} acecha a {b} (👁️ ͜ʖ👁️)'],
    ['nod', ['asentir'], 'n:nod', '👍', '{a} asiente (._.) ( l: )', '{a} asiente mirando a {b} (._.) ( l: )'],
    ['nom', ['comer'], 'n:nom', '😋', '{a} hace ñam (๑\'um\'๑)', '{a} le hace ñam a {b} (๑\'um\'๑)'],
    ['nope', ['negar'], 'n:nope', '🙅', '{a} dice que no (🙅‍♀️)', '{a} le dice que no a {b} (🙅‍♀️)'],
    ['peck', ['piquito'], ['n:peck', 'n:kiss'], '😚', '{a} manda un piquito (3\')', '{a} le dio un piquito a {b} (3\')'],
    ['pout', ['pucheros'], 'n:pout', '🥺', '{a} hace pucheros (｡•́︿•̀｡)', '{a} le hace pucheros a {b} (｡•́︿•̀｡)'],
    ['psycho', ['psicopata', 'psicópata'], null, '🔪', '{a} se hace el/la psicópata (¬‿¬)', '{a} se hace el/la psicópata con {b} (¬‿¬)'],
    ['punch', ['puñetazo'], 'n:punch', '👊', '{a} lanza un puñetazo (ง •̀_•́)ง', '{a} le dio un puñetazo a {b} (ง •̀_•́)ง'],
    ['push', ['empujar'], 'n:yeet', '🫸', '{a} empuja (¬_¬)q', '{a} empujó a {b} (¬_¬)q'],
    ['run', ['correr'], 'n:run', '🏃', '{a} sale corriendo 💨', '{a} sale corriendo de {b} 💨'],
    ['sad', ['triste'], 'n:cry', '😢', '{a} está triste (;-;)', '{a} está triste por {b} (;-;)'],
    ['scared', ['asustado'], null, '😱', '{a} está asustado/a (⊙_⊙;)', '{a} se asustó por {b} (⊙_⊙;)'],
    ['scream', ['gritar'], null, '😱', '{a} grita (⁰д⁰)', '{a} le grita a {b} (⁰д⁰)'],
    ['shoot', ['disparar'], ['n:shoot', 'n:smug'], '🔫', '{a} dispara con el dedo (¬‿¬)☞', '{a} le disparó con el dedo a {b} (¬‿¬)☞'],
    ['shrug', ['encogerse'], 'n:shrug', '🤷', '{a} se encoge de hombros ¯\\_(ツ)_/¯', '{a} se encoge de hombros ante {b} ¯\\_(ツ)_/¯'],
    ['shy', ['timido', 'tímido'], 'n:blush', '😳', '{a} siente timidez (*/ω＼*)', '{a} siente timidez frente a {b} (*/ω＼*)'],
    ['sigh', ['suspirar'], null, '😮‍💨', '{a} suspira (ーー;)', '{a} suspira por {b} (ーー;)'],
    ['sleep', ['dormir'], 'n:sleep', '😴', '{a} se queda dormido/a (u.u)zzz', '{a} se duerme junto a {b} (u.u)zzz'],
    ['smile', ['sonreir'], 'n:smile', '😊', '{a} sonríe ( ´ ▽ ` )', '{a} le sonríe a {b} ( ´ ▽ ` )'],
    ['smug', ['engreido'], 'n:smug', '😏', '{a} se ve engreído/a (¬‿¬)', '{a} se siente superior a {b} (¬‿¬)'],
    ['stare', ['mirar'], 'n:stare', '👁️', '{a} se queda mirando ⊙.☉', '{a} mira fijamente a {b} ⊙.☉'],
    ['step', ['pisar'], null, '👣', '{a} pisa fuerte (-_-メ)', '{a} pisó a {b} (-_-メ)'],
    ['surprised', ['sorprendido'], null, '😲', '{a} está sorprendido/a (Σ(O_O))', '{a} se sorprendió con {b} (Σ(O_O))'],
    ['tea', ['te', 'té'], ['n:sip', 'n:smile'], '🍵', '{a} toma té c[_l_', '{a} toma té con {b} c[_l_'],
    ['think', ['pensar'], 'n:think', '🤔', '{a} se pone a pensar (˘･_･˘)', '{a} piensa en {b} (˘･_･˘)'],
    ['thumbsup', ['aprobar'], 'n:thumbsup', '👍', '{a} levanta el pulgar (•̀ω•́)b', '{a} aprueba a {b} (•̀ω•́)b'],
    ['tickle', ['cosquillas'], 'n:tickle', '🤭', '{a} se ríe de las cosquillas (≧◡≦)', '{a} le hace cosquillas a {b} (≧◡≦)'],
    ['wave', ['saludar'], 'n:wave', '👋', '{a} saluda (๑u@)ﾉ', '{a} saluda a {b} (๑u@)ﾉ'],
    ['yawn', ['bostezar'], 'n:yawn', '🥱', '{a} bosteza (=ω=)..zzZ', '{a} bosteza junto a {b} (=ω=)..zzZ']
].map(([key, aliases, source, emoji, solo, target]) => ({ key, aliases, source, emoji, solo, target }));

const BY_KEY = new Map(REACTIONS.map(item => [item.key, item]));

function renderText(reaction, actor, target) {
    const template = target ? reaction.target : reaction.solo;
    return template.replace(/\{a\}/g, mentionTag(actor)).replace(/\{b\}/g, mentionTag(target));
}

const MAX_GIF_BYTES = 8 * 1024 * 1024;

async function fetchJson(url, fetchImpl) {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/** URL del GIF para una fuente 'n:categoria' (nekos.best) o 'w:categoria' (waifu.pics). */
async function gifUrl(source, fetchImpl = fetch) {
    const [kind, category] = String(source).split(':');
    if (kind === 'n') return (await fetchJson(`https://nekos.best/api/v2/${category}`, fetchImpl)).results?.[0]?.url;
    if (kind === 'w') return (await fetchJson(`https://api.waifu.pics/sfw/${category}`, fetchImpl)).url;
    return null;
}

let ffmpegChecked = null;
function hasFfmpeg() {
    if (!ffmpegChecked) {
        ffmpegChecked = new Promise(resolve => {
            const probe = spawn('ffmpeg', ['-version'], { stdio: 'ignore' });
            probe.on('error', () => resolve(false));
            probe.on('close', code => resolve(code === 0));
        });
    }
    return ffmpegChecked;
}

/** Convierte el GIF a MP4 (WhatsApp solo anima GIF como video). Devuelve null si no se puede. */
async function gifToMp4(buffer) {
    if (!(await hasFfmpeg())) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yuki-gif-'));
    const input = path.join(dir, 'in.gif');
    const output = path.join(dir, 'out.mp4');
    try {
        fs.writeFileSync(input, buffer);
        await new Promise((resolve, reject) => {
            const proc = spawn('ffmpeg', ['-y', '-i', input, '-movflags', 'faststart', '-pix_fmt', 'yuv420p',
                '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-an', output], { stdio: 'ignore' });
            const timer = setTimeout(() => { proc.kill('SIGKILL'); reject(new Error('ffmpeg tardó demasiado')); }, 20000);
            proc.on('error', reject);
            proc.on('close', code => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`ffmpeg salió con ${code}`)); });
        });
        return fs.readFileSync(output);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

const asList = source => (source ? [].concat(source) : []);

/** Prueba cada fuente en orden y devuelve el primer GIF convertido a video; null si ninguna funciona. */
async function loadMediaFrom(sources, { fetchImpl = fetch, convert = gifToMp4, label = 'reacción' } = {}) {
    for (const source of asList(sources)) {
        try {
            const url = await gifUrl(source, fetchImpl);
            if (!url) continue;
            const response = await fetchImpl(url, { signal: AbortSignal.timeout(8000) });
            if (!response.ok) continue;
            const buffer = Buffer.from(await response.arrayBuffer());
            if (!buffer.length || buffer.length > MAX_GIF_BYTES) continue;
            const media = await convert(buffer);
            if (media) return media;
        } catch (error) {
            console.error(`${label}: sin GIF de ${source} (${error.message})`);
        }
    }
    return null;
}

/** Descarga el GIF de la reacción y lo deja listo para enviar como video; null si algo falla. */
function loadReactionMedia(reaction, options = {}) {
    return loadMediaFrom(reaction.source, { ...options, label: `Reacción ${reaction.key}` });
}

// Con YUKI_REACTION_GIFS=off (o dentro de las pruebas, salvo que se inyecte fetch) no se usa la red.
function gifsEnabled(options) {
    if (options.fetchImpl) return true;
    if (process.env.YUKI_REACTION_GIFS === 'off') return false;
    return !process.env.NODE_TEST_CONTEXT;
}

/**
 * Envía el texto con un GIF animado si se consigue; si no, solo el texto (la respuesta nunca se pierde).
 * `sources`: fuentes 'n:categoria' (nekos.best) o 'w:categoria' (waifu.pics), probadas en orden.
 */
async function sendWithGif(sock, m, { text, mentions = [], sources, options = {} }) {
    const chat = m.key.remoteJid;
    const media = gifsEnabled(options) ? await loadMediaFrom(sources, options) : null;
    if (media) {
        try {
            return await sock.sendMessage(chat, { video: media, gifPlayback: true, caption: text, mentions }, { quoted: m });
        } catch (error) {
            console.error(`No se pudo enviar el GIF (${error.message}); se manda solo el texto`);
        }
    }
    return sock.sendMessage(chat, mentions.length ? { text, mentions } : { text }, { quoted: m });
}

function makeReaction(key, options = {}) {
    const reaction = BY_KEY.get(key);
    if (!reaction) throw new Error(`Reacción desconocida: ${key}`);
    return {
        name: reaction.key,
        aliases: reaction.aliases,
        category: 'anime',
        description: `Reacción de anime: ${reaction.key} [@usuario]`,

        async execute(sock, m) {
            const actor = senderJid(m, sock);
            if (!actor) return reply(sock, m, '「✿」 No pude identificarte. Inténtalo de nuevo.');
            const target = targetJid(m);
            const other = target && target !== actor ? target : null;
            return sendWithGif(sock, m, {
                text: `「✿」 ${renderText(reaction, actor, other)}`,
                mentions: other ? [actor, other] : [actor],
                sources: reaction.source,
                options
            });
        }
    };
}

module.exports = { REACTIONS, BY_KEY, renderText, gifUrl, loadMediaFrom, loadReactionMedia, sendWithGif, makeReaction };
