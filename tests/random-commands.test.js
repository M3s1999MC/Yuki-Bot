const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Aislar la base de datos: nunca tocar database/yuki.db al cargar otros comandos.
delete process.env.DATABASE_URL;
process.env.YUKI_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'yuki-test-'));

const commands = {
    '8ball': require('../commands/random/8ball'),
    chiste: require('../commands/random/chiste'),
    frase: require('../commands/random/frase'),
    ruletarusa: require('../commands/random/ruletarusa'),
    hack: require('../commands/random/hack'),
    dado: require('../commands/random/dado'),
    f: require('../commands/random/f'),
    taza: require('../commands/random/taza'),
    pruebacolor: require('../commands/general/pruebacolor')
};

const AUTHOR = '573001112233@s.whatsapp.net';
const TARGET = '573004445566@s.whatsapp.net';

function fakeSock() {
    const sent = [];
    return { sent, sendMessage: async (jid, content, options) => { sent.push({ jid, content, options }); } };
}

function fakeMessage(text, { mentioned, quotedParticipant } = {}) {
    const context = {};
    if (mentioned) context.mentionedJid = [mentioned];
    if (quotedParticipant) context.participant = quotedParticipant;
    return {
        key: { remoteJid: '120363000000000000@g.us', participant: AUTHOR },
        message: { extendedTextMessage: { text, contextInfo: context } }
    };
}

async function run(name, text, extra) {
    const sock = fakeSock();
    const args = text.trim().split(/\s+/).slice(1);
    await commands[name].execute(sock, fakeMessage(text, extra), args, '!');
    return sock.sent;
}

test('todos los comandos exportan nombre y execute', () => {
    for (const [key, command] of Object.entries(commands)) {
        assert.equal(typeof command.name, 'string', key);
        assert.equal(typeof command.execute, 'function', key);
    }
});

test('el handler carga los comandos sin alias duplicados (ninguno le quita su nombre a otro)', () => {
    // Proceso hijo: cargar todos los comandos imprime en consola y no debe mezclarse con el ejecutor de tests.
    const { execFileSync } = require('node:child_process');
    const handlerPath = path.join(__dirname, '..', 'handlers', 'commandHandler');
    const script = `
        const lines = [];
        const grab = (...parts) => lines.push(parts.join(' '));
        console.log = grab; console.warn = grab; console.error = grab;
        const CommandHandler = require(${JSON.stringify(handlerPath)});
        const handler = new CommandHandler();
        process.stdout.write('\\n@@RESULT@@' + JSON.stringify({
            size: handler.commands.size,
            duplicates: lines.filter(line => /Alias duplicado/.test(line))
        }));
        setTimeout(() => process.exit(0), 200);
    `;
    const env = { ...process.env, YUKI_DATA_DIR: process.env.YUKI_DATA_DIR };
    delete env.DATABASE_URL;
    const output = execFileSync(process.execPath, ['-e', script], { env, encoding: 'utf8', timeout: 60000 });
    const result = JSON.parse(output.split('@@RESULT@@')[1]);
    assert.ok(result.size > 150, `se esperaban más de 150 comandos, hay ${result.size}`);
    assert.deepEqual(result.duplicates, []);
});

test('8ball pide una pregunta y responde una de las respuestas conocidas', async () => {
    const empty = await run('8ball', '!8ball');
    assert.match(empty[0].content.text, /pregunta de sí o no/);

    const sent = await run('8ball', '!8ball ¿Hoy llueve?');
    assert.equal(sent.length, 1);
    assert.ok(commands['8ball'].answers.some(answer => sent[0].content.text.includes(answer)));
});

test('chiste y frase responden con contenido de su lista', async () => {
    const joke = await run('chiste', '!chiste');
    assert.ok(commands.chiste.jokes.some(item => joke[0].content.text.includes(item)));
    const phrase = await run('frase', '!frase');
    assert.ok(commands.frase.phrases.some(item => phrase[0].content.text.includes(item)));
    assert.ok(commands.chiste.jokes.length >= 20 && commands.frase.phrases.length >= 20);
});

test('ruletarusa: una recámara con castigo y cinco seguras', async () => {
    const original = Math.random;
    try {
        Math.random = () => 0;
        const bang = await run('ruletarusa', '!ruletarusa');
        assert.match(bang[0].content.text, /BANG/);
        assert.match(bang[0].content.text, /de mentira/);
        assert.deepEqual(bang[0].content.mentions, [AUTHOR]);

        Math.random = () => 0.99;
        const safe = await run('ruletarusa', '!ruletarusa');
        assert.match(safe[0].content.text, /Click/);
    } finally {
        Math.random = original;
    }
});

test('hack exige un objetivo y solo usa datos obviamente falsos', async () => {
    const none = await run('hack', '!hack');
    assert.match(none[0].content.text, /Menciona a alguien/);

    const sent = await run('hack', `!hack @573004445566`, { mentioned: TARGET });
    const text = sent[0].content.text;
    assert.match(text, /192\.0\.2\.\d+/, 'la IP debe ser del rango de documentación');
    assert.match(text, /@ejemplo\.invalid/);
    assert.match(text, /de broma/);
    assert.ok(sent[0].content.mentions.includes(TARGET));
    assert.ok(!text.includes('573004445566@s.whatsapp.net'));
});

test('hack también funciona respondiendo a un mensaje', async () => {
    const sent = await run('hack', '!hack', { quotedParticipant: TARGET });
    assert.match(sent[0].content.text, /Iniciando hackeo/);
});

test('dado valida las caras (2 a 100) y devuelve un resultado dentro del rango', async () => {
    for (const bad of ['!dado 1', '!dado 101', '!dado abc', '!dado 2.5', '!dado -3']) {
        const sent = await run('dado', bad);
        assert.match(sent[0].content.text, /entre 2 y 100/, bad);
    }
    for (let i = 0; i < 50; i += 1) {
        const sent = await run('dado', '!dado 20');
        const value = Number(sent[0].content.text.match(/salió: \*(\d+)\*/)[1]);
        assert.ok(value >= 1 && value <= 20);
    }
    const defaultDie = await run('dado', '!dado');
    assert.match(defaultDie[0].content.text, /dado de 6 caras/);
});

test('f rinde homenaje con y sin motivo', async () => {
    const plain = await run('f', '!f');
    assert.match(plain[0].content.text, /presenta sus respetos\./);
    const withReason = await run('f', '!f el wifi de ayer');
    assert.match(withReason[0].content.text, /por \*el wifi de ayer\*/);
});

test('taza elige la bebida según el comando usado y exige destinatario', async () => {
    const none = await run('taza', '!mate');
    assert.match(none[0].content.text, /Menciona a alguien/);

    const mate = await run('taza', '!mate @573004445566', { mentioned: TARGET });
    assert.match(mate[0].content.text, /un mate/);
    const cafe = await run('taza', '!café @573004445566', { mentioned: TARGET });
    assert.match(cafe[0].content.text, /un café/);
    const taza = await run('taza', '!taza @573004445566', { mentioned: TARGET });
    assert.match(taza[0].content.text, /chocolate caliente/);
    assert.deepEqual(taza[0].content.mentions, [AUTHOR, TARGET]);
});

test('pruebacolor muestra los estilos de formato', async () => {
    const sent = await run('pruebacolor', '!pruebacolor');
    assert.match(sent[0].content.text, /\*Negrita\*/);
    assert.match(sent[0].content.text, /~Tachado~/);
});

test('funciona con mensajes temporales (el texto y la mención llegan envueltos)', async () => {
    const sock = fakeSock();
    const inner = fakeMessage('!mate @573004445566', { mentioned: TARGET });
    const wrapped = {
        key: inner.key,
        message: { ephemeralMessage: { message: inner.message } }
    };
    await commands.taza.execute(sock, wrapped, ['@573004445566'], '!');
    assert.match(sock.sent[0].content.text, /un mate/);
    assert.deepEqual(sock.sent[0].content.mentions, [AUTHOR, TARGET]);

    const hackSock = fakeSock();
    await commands.hack.execute(hackSock, wrapped, [], '!');
    assert.match(hackSock.sent[0].content.text, /Iniciando hackeo/);
});
