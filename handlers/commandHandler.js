const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const { checkAdmin } = require('../utils/permissions');

class CommandHandler {
    constructor() {
        this.commands = new Map();
        this.aliases = new Map();
        this.loadCommands();
    }

    loadCommands() {
        const categoriesPath = path.join(__dirname, '../commands');
        
        if (!fs.existsSync(categoriesPath)) {
            console.warn('⚠️ La carpeta "commands" no existe.');
            return;
        }

        const loadedFiles = [];
        const failedFiles = [];
        const categories = fs.readdirSync(categoriesPath);
        
        for (const category of categories) {
            const categoryPath = path.join(categoriesPath, category);
            
            if (fs.statSync(categoryPath).isDirectory()) {
                const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
                
                for (const file of commandFiles) {
                    const filePath = path.join(categoryPath, file);

                    try {
                        delete require.cache[require.resolve(filePath)];
                        const command = require(filePath);

                        if (typeof command?.name !== 'string' || typeof command.execute !== 'function') {
                            failedFiles.push({ filePath, error: 'El módulo debe exportar un nombre y una función execute.' });
                            continue;
                        }

                        const previous = this.commands.get(command.name);
                        const aliases = [...new Set([
                            ...(Array.isArray(previous?.aliases) ? previous.aliases : []),
                            ...(Array.isArray(command.aliases) ? command.aliases : [])
                        ].filter(alias => typeof alias === 'string' && alias.length > 0))];
                        const registeredCommand = {
                            ...command,
                            aliases,
                            adminOnly: Boolean(previous?.adminOnly || command.adminOnly),
                            botAdminOnly: Boolean(previous?.botAdminOnly || command.botAdminOnly)
                        };

                        if (previous) {
                            console.warn(
                                `⚠️ [Yuki] Comando duplicado "${command.name}": ` +
                                `${path.relative(categoriesPath, filePath)} reemplaza al módulo anterior; se conservarán sus alias y restricciones.`
                            );
                        }
                        this.commands.set(command.name, registeredCommand);
                        aliases.forEach(alias => {
                            const aliasOwner = this.aliases.get(alias);
                            if (aliasOwner && aliasOwner !== command.name) {
                                console.error(
                                    `❌ [Yuki] Alias duplicado "${alias}": ` +
                                    `${aliasOwner} conserva el alias; no se asignó a ${command.name}.`
                                );
                                return;
                            }
                            this.aliases.set(alias, command.name);
                        });
                        loadedFiles.push({
                            filePath,
                            name: command.name,
                            aliases
                        });
                    } catch (error) {
                        failedFiles.push({ filePath, error });
                    }
                }
            }
        }

        console.log(`📦 [Yuki] Comandos cargados correctamente: ${loadedFiles.length}`);
        for (const command of loadedFiles) {
            const aliases = command.aliases.length ? ` | alias: ${command.aliases.join(', ')}` : '';
            console.log(`  ✅ ${path.relative(categoriesPath, command.filePath)} -> ${command.name}${aliases}`);
        }

        if (failedFiles.length) {
            console.error(`❌ [Yuki] Archivos de comandos con errores: ${failedFiles.length}`);
            for (const failure of failedFiles) {
                console.error(`  ❌ ${path.relative(categoriesPath, failure.filePath)}`);
                if (failure.error instanceof Error) {
                    console.error(failure.error.stack || failure.error.message);
                } else {
                    console.error(`     ${failure.error}`);
                }
            }
        } else {
            console.log('✅ [Yuki] Todos los archivos de comandos se cargaron correctamente.');
        }
    }

    async handle(sock, m, body, usedPrefix, commandName, args) {
        const jid = m.key.remoteJid;

        // Buscar comando por nombre directo o por alias
        const resolvedCommandName = this.commands.has(commandName) ? commandName : this.aliases.get(commandName);
        const command = this.commands.get(resolvedCommandName);

        if (!command) {
            // El comando no existe en la lista
            return;
        }

        try {
            if (jid.endsWith('@g.us')) {
                const settings = await new Promise((resolve, reject) => {
                    db.getSafeGroup(jid, (err, row) => err ? reject(err) : resolve(row));
                });
                if (!settings.bot_active && !['bot', 'botgc', 'onbot'].includes(commandName)) {
                    await sock.sendMessage(jid, { text: '「✿」 Yuki está en pausa en este grupo. Un administrador puede reactivarla con !bot on.' }, { quoted: m });
                    return;
                }
                const currentBotJid = sock.user?.id?.split(':')[0];
                const primaryCommands = ['setprimary', 'botprincipal', 'setbot', 'delprimary', 'unsetprimary', 'quitarprimary', 'delbotprincipal'];
                if (settings.primary_bot_jid && currentBotJid !== settings.primary_bot_jid.split(':')[0] && !primaryCommands.includes(commandName)) {
                    return;
                }

                const requiresAdmin = settings.admin_only || command.adminOnly || command.botAdminOnly;
                if (requiresAdmin) {
                    const sender = m.key.participant || jid;
                    const permissions = await checkAdmin(sock, jid, sender);
                    if (!permissions.isUserAdmin) {
                        await sock.sendMessage(jid, {
                            text: settings.admin_only
                                ? '「✿」 El modo Solo Admins está activo en este grupo.'
                                : '「✿」 Este comando es exclusivo para administradores del grupo.'
                        }, { quoted: m });
                        return;
                    }
                    if (command.botAdminOnly && !permissions.isBotAdmin) {
                        await sock.sendMessage(jid, { text: '「✿」 Necesito ser administrador para completar este comando.' }, { quoted: m });
                        return;
                    }
                }
            }

            // Ejecutar el comando pasando los parámetros estándar
            await command.execute(sock, m, args, usedPrefix);
        } catch (error) {
            console.error(`❌ Error crítico ejecutando el comando '${commandName}':`, error);
            await sock.sendMessage(jid, { 
                text: `❌ Ocurrió un error interno al ejecutar *${usedPrefix}${commandName}*. Revisa la consola para ver los detalles.` 
            }, { quoted: m });
        }
    }
}

module.exports = CommandHandler;
