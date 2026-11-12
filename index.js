'use strict';

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');

// --- 1. CONFIGURACIÓN DEL SERVIDOR WEB (EXPRESS PARA RENDER) ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('🌸 ¡YukiBot-MD está activo, conectado y funcionando correctamente! 🚀');
});

app.listen(PORT, () => {
    console.log(`🌐 Servidor HTTP web escuchando en el puerto ${PORT}`);
});

// --- 2. CARGADOR DE COMANDOS ---
const commands = new Map();
const aliases = new Map();

function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    if (!fs.existsSync(commandsPath)) {
        console.log('⚠️ La carpeta "commands" no existe. Creándola...');
        fs.mkdirSync(commandsPath, { recursive:umlah = true });
        return;
    }

    const categories = fs.readdirSync(commandsPath);
    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        if (fs.statSync(categoryPath).isDirectory()) {
            const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(categoryPath, file);
                try {
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);
                    if (command && command.name) {
                        commands.set(command.name, command);
                        if (command.aliases && Array.isArray(command.aliases)) {
                            command.aliases.forEach(alias => aliases.set(alias, command.name));
                        }
                    }
                } catch (err) {
                    console.error(`❌ Error cargando el comando ${file}:`, err);
                }
            }
        }
    }
    console.log(`✨ Se cargaron exitosamente ${commands.size} comandos.`);
}

// --- 3. INICIALIZACIÓN DE WHATSAPP CON BAILEYS ---
async function startYukiBot() {
    // Nota: Aquí puedes cambiar './auth_info' por tu conexión con Neon/Postgres si usas almacenamiento en nube
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`📦 Usando Baileys v. ${version.join('.')}, es la última: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        browser: ['YukiBot-MD', 'Safari', '1.0.0']
    });

    loadCommands();

    // Manejador de mensajes
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const messageType = Object.keys(m.message)[0];
        let body = '';

        if (messageType === 'conversation') {
            body = m.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            body = m.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage' && m.message.imageMessage.caption) {
            body = m.message.imageMessage.caption;
        }

        // Definir prefijo (ej: '!', '.', etc.)
        const prefix = '!';
        if (!body || !body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = commands.get(commandName) || commands.get(aliases.get(commandName));
        if (!command) return;

        try {
            console.log(`🤖 Ejecutando comando: ${commandName} solicitado por ${m.key.remoteJid}`);
            await command.execute(sock, m, args);
        } catch (error) {
            console.error(`❌ Error al ejecutar el comando ${commandName}:`, error);
        }
    });

    // Actualización de credenciales y conexión
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Conexión cerrada debido a:', lastDisconnect.error, ', reconectando:', shouldReconnect);
            if (shouldReconnect) {
                startYukiBot();
            }
        } else if (connection === 'open') {
            console.log('🌸 ¡YukiBot-MD se ha conectado a WhatsApp exitosamente!');
        }
    });
}

startYukiBot();
