const { createCipheriv, createDecipheriv, randomBytes } = require('crypto');
const { BufferJSON, initAuthCreds, proto } = require('@whiskeysockets/baileys');

const TABLE_NAME = 'yuki_whatsapp_auth';

function parseEncryptionKey(value) {
    if (typeof value !== 'string' || !/^[a-f\d]{64}$/i.test(value)) {
        throw new Error('YUKI_AUTH_ENCRYPTION_KEY must be a 64-character hexadecimal key.');
    }

    return Buffer.from(value, 'hex');
}

function encryptValue(value, key) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const plaintext = JSON.stringify(value, BufferJSON.replacer);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

    return [
        iv.toString('base64'),
        cipher.getAuthTag().toString('base64'),
        ciphertext.toString('base64')
    ].join('.');
}

function decryptValue(encryptedValue, key) {
    const [encodedIv, encodedTag, encodedCiphertext, ...extraParts] = encryptedValue.split('.');
    if (!encodedIv || !encodedTag || !encodedCiphertext || extraParts.length > 0) {
        throw new Error('Stored WhatsApp auth data has an invalid encrypted format.');
    }

    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(encodedIv, 'base64'));
    decipher.setAuthTag(Buffer.from(encodedTag, 'base64'));
    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(encodedCiphertext, 'base64')),
        decipher.final()
    ]).toString('utf8');

    return JSON.parse(plaintext, BufferJSON.reviver);
}

async function createNeonAuthState(pool, encryptionKey) {
    const key = parseEncryptionKey(encryptionKey);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
            auth_key TEXT PRIMARY KEY,
            encrypted_value TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    const readData = async (authKey) => {
        const { rows } = await pool.query(
            `SELECT encrypted_value FROM ${TABLE_NAME} WHERE auth_key = $1`,
            [authKey]
        );
        return rows.length ? decryptValue(rows[0].encrypted_value, key) : null;
    };

    const writeData = async (authKey, value) => {
        const encryptedValue = encryptValue(value, key);
        await pool.query(
            `INSERT INTO ${TABLE_NAME} (auth_key, encrypted_value)
             VALUES ($1, $2)
             ON CONFLICT (auth_key)
             DO UPDATE SET encrypted_value = EXCLUDED.encrypted_value, updated_at = NOW()`,
            [authKey, encryptedValue]
        );
    };

    const removeData = async (authKey) => {
        await pool.query(`DELETE FROM ${TABLE_NAME} WHERE auth_key = $1`, [authKey]);
    };

    let creds = await readData('creds');
    if (!creds) {
        creds = initAuthCreds();
        await writeData('creds', creds);
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }));
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const authKey = `${category}-${id}`;
                            tasks.push(value ? writeData(authKey, value) : removeData(authKey));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: async () => writeData('creds', creds)
    };
}

module.exports = { createNeonAuthState };
