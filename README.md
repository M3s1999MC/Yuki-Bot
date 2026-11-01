# Yuki-Bot
Bot de Yuki

## Datos persistentes en Neon y Render

Los datos de economía, perfiles, gachas, grupos y la sesión de WhatsApp se guardan en PostgreSQL en Neon:

1. Crea una base PostgreSQL en Neon y copia su cadena de conexión (`DATABASE_URL`).
2. En Render, agrega `DATABASE_URL` con esa cadena y `YUKI_AUTH_ENCRYPTION_KEY` con una clave hexadecimal de 64 caracteres generada en tu computadora:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Conserva una copia segura de la clave de cifrado. No la cambies ni la subas a GitHub: sin ella no se puede recuperar la sesión guardada.
4. Guarda las variables y espera el despliegue. Las tablas de datos del bot y la tabla de sesión se crean automáticamente. Al usar una base nueva tendrás que escanear el QR inicial una vez; después las credenciales y claves se guardan cifradas en PostgreSQL y se reutilizan en los reinicios.

`QR_ACCESS_TOKEN` sigue siendo necesaria para abrir la página privada `/qr` al vincular WhatsApp. Si `DATABASE_URL` no está configurada, el bot conserva el comportamiento anterior y guarda la sesión en archivos locales, que pueden perderse cuando Render reinicie el servicio gratuito.

El bot no solicita la descarga completa del historial de chats al vincularse, para reducir la espera. Baileys mantiene la sincronización básica que necesita para la sesión; los mensajes nuevos siguen llegando, pero el historial completo anterior no se carga.

Si vuelve a aparecer un QR después de una vinculación exitosa, comprueba en los logs que cargó la sesión persistente y que `DATABASE_URL` y `YUKI_AUTH_ENCRYPTION_KEY` siguen siendo las mismas. Mantén una sola instancia del bot conectada a esa sesión. Si quitas Yuki de Dispositivos vinculados, WhatsApp revoca la sesión y el bot elimina automáticamente solo sus datos de autenticación para solicitar un QR nuevo; no borra el resto de la base.

Neon conserva los datos y la sesión, pero no evita que Render Gratis suspenda el servicio por inactividad. El código no puede garantizar disponibilidad 24/7 en ese plan; para mantener el bot siempre activo se necesita un plan/servicio que permita procesos permanentes.

## Migrar los datos locales de SQLite a Neon

Antes de desplegar esta versión, configura `DATABASE_URL` en tu `.env` local con la URL de Neon y ejecuta una sola vez:

```powershell
npm run migrate:neon
```

El comando copia las tablas y filas de `database/yuki.db` a Neon dentro de una transacción. No borra ni modifica el archivo SQLite local y registra la migración para evitar repetirla. Si alguna fila ya existe en Neon, conserva la fila de Neon. Después configura la misma `DATABASE_URL` en Render. No conectes dos instancias del bot a la vez durante la migración.

`YUKI_AUTH_ENCRYPTION_KEY` solo cifra la sesión de WhatsApp; la persistencia de los demás datos usa `DATABASE_URL`.
