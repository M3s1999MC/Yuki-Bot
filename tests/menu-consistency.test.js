const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');

// Carga el handler en un proceso aparte (imprime en consola y abre la base de datos) con una base temporal.
function loadRegisteredNames() {
    const handlerPath = path.join(root, 'handlers', 'commandHandler');
    const script = `
        const lines = [];
        console.log = console.warn = console.error = (...parts) => lines.push(parts.join(' '));
        const CommandHandler = require(${JSON.stringify(handlerPath)});
        const handler = new CommandHandler();
        const names = [...handler.commands.keys(), ...handler.aliases.keys()];
        process.stdout.write('\\n@@RESULT@@' + JSON.stringify(names));
        setTimeout(() => process.exit(0), 200);
    `;
    const env = { ...process.env, YUKI_DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'yuki-menu-')) };
    delete env.DATABASE_URL;
    const output = execFileSync(process.execPath, ['-e', script], { env, encoding: 'utf8', timeout: 60000, cwd: root });
    return new Set(JSON.parse(output.split('@@RESULT@@')[1]));
}

function menuNames() {
    const text = fs.readFileSync(path.join(root, 'commands', 'general', 'menu.js'), 'utf8').replace(/\r/g, '');
    const found = [];
    for (const line of text.split('\n')) {
        if (!line.startsWith('✧ ')) continue;
        for (const part of line.slice(2).split(' | ')) {
            const token = part.trim().split(/\s+/)[0];
            if (/^[!.]/.test(token)) found.push({ name: token.slice(1).toLowerCase(), line: line.trim() });
        }
    }
    return found;
}

test('todo comando anunciado en el menú existe en el código', () => {
    const registered = loadRegisteredNames();
    const missing = menuNames().filter(item => !registered.has(item.name));
    assert.deepEqual(
        missing.map(item => `${item.name}  (en: ${item.line.slice(0, 70)})`),
        [],
        'Estos nombres aparecen en el menú pero el bot no los carga'
    );
});
