require('../utils/loadEnv')();

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
if (!process.env.DATABASE_URL) {
    throw new Error('Configura DATABASE_URL en .env con la URL de Neon antes de migrar.');
}
let databaseUrl;
try {
    databaseUrl = new URL(process.env.DATABASE_URL);
} catch {
    throw new Error('DATABASE_URL no es una URL válida. No se modificó ninguna base de datos.');
}
if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
    throw new Error('DATABASE_URL debe ser una URL PostgreSQL de Neon. No se modificó ninguna base de datos.');
}
const db = require('../database/db');

const sourcePath = path.resolve(__dirname, '../database/yuki.db');
const migrationKey = 'database/yuki.db-to-neon-v1';

function openSqlite(filePath) {
    return new Promise((resolve, reject) => {
        const source = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, error => {
            if (error) reject(error);
            else resolve(source);
        });
    });
}

function sqliteAll(source, sql, params = []) {
    return new Promise((resolve, reject) => {
        source.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
    });
}

function quoteIdentifier(identifier) {
    return `"${identifier.replace(/"/g, '""')}"`;
}

async function migrate() {
    if (!fs.existsSync(sourcePath)) {
        throw new Error('No se encontró database/yuki.db; no se modificó Neon.');
    }

    await db.ready;
    const source = await openSqlite(sourcePath);
    const client = await db.pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS yuki_sqlite_migrations (
                migration_key TEXT PRIMARY KEY,
                completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
        const existing = await client.query(
            'SELECT migration_key FROM yuki_sqlite_migrations WHERE migration_key = $1',
            [migrationKey]
        );
        if (existing.rowCount) {
            throw new Error('La migración de database/yuki.db ya se ejecutó; se cancela para evitar duplicados.');
        }

        const tables = await sqliteAll(
            source,
            `SELECT name FROM sqlite_master
             WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
        );
        const orderedTables = tables
            .map(row => row.name)
            .sort((left, right) => (left === 'characters' ? -1 : right === 'characters' ? 1 : left.localeCompare(right)));
        const summaries = [];

        await client.query('BEGIN');
        for (const table of orderedTables) {
            const quotedTable = quoteIdentifier(table);
            const columns = await sqliteAll(source, `PRAGMA table_info(${quotedTable})`);
            if (!columns.length) continue;

            const targetColumns = await client.query(
                `SELECT column_name FROM information_schema.columns
                 WHERE table_schema = current_schema() AND table_name = $1`,
                [table.toLowerCase()]
            );
            const targetColumnNames = new Set(targetColumns.rows.map(row => row.column_name));
            const importColumns = columns
                .map(column => column.name)
                .filter(name => targetColumnNames.has(name.toLowerCase()));
            if (importColumns.length !== columns.length) {
                const missing = columns
                    .map(column => column.name)
                    .filter(name => !targetColumnNames.has(name.toLowerCase()));
                throw new Error(`La tabla ${table} contiene columnas ausentes en Neon: ${missing.join(', ')}.`);
            }

            const rows = await sqliteAll(source, `SELECT * FROM ${quotedTable}`);
            if (rows.length === 0) {
                summaries.push({ table, imported: 0 });
                continue;
            }

            const quotedColumns = importColumns.map(name => quoteIdentifier(name.toLowerCase()));
            let imported = 0;
            const batchSize = 200;
            for (let offset = 0; offset < rows.length; offset += batchSize) {
                const batch = rows.slice(offset, offset + batchSize);
                const values = [];
                const rowPlaceholders = batch.map(row => {
                    const placeholders = importColumns.map(name => {
                        values.push(row[name]);
                        return `$${values.length}`;
                    });
                    return `(${placeholders.join(', ')})`;
                });
                const insertSql = `INSERT INTO ${quotedTable} (${quotedColumns.join(', ')})
                    VALUES ${rowPlaceholders.join(', ')} ON CONFLICT DO NOTHING`;
                const result = await client.query(insertSql, values);
                imported += result.rowCount;
            }

            if (importColumns.some(name => name.toLowerCase() === 'id')) {
                await client.query(
                    `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL)
                     FROM ${quotedTable}`,
                    [table.toLowerCase()]
                );
            }
            summaries.push({ table, imported, existing: rows.length - imported });
        }

        await client.query(
            'INSERT INTO yuki_sqlite_migrations (migration_key) VALUES ($1)',
            [migrationKey]
        );
        await client.query('COMMIT');

        const total = summaries.reduce((sum, item) => sum + item.imported, 0);
        console.log(`Migración completada: ${total} filas copiadas de ${summaries.length} tablas a Neon.`);
        for (const item of summaries) {
            const retained = item.existing ? ` (${item.existing} ya existían en Neon)` : '';
            console.log(`- ${item.table}: ${item.imported} filas copiadas${retained}`);
        }
    } catch (error) {
        await client.query('ROLLBACK').catch(rollbackError => {
            console.error('No se pudo revertir la migración:', rollbackError.message);
        });
        throw error;
    } finally {
        client.release();
        await new Promise((resolve, reject) => {
            source.close(error => error ? reject(error) : resolve());
        });
    }
}

migrate()
    .catch(error => {
        console.error('No se migraron los datos de SQLite a Neon:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await db.close();
    });
