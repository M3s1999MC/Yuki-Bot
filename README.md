# Yuki-Bot
Bot de Yuki

## Sesión persistente de WhatsApp en Render

La sesión de Baileys puede guardarse en PostgreSQL en lugar del disco temporal de Render:

1. Crea una base PostgreSQL en Neon y copia su cadena de conexión (`DATABASE_URL`).
2. En Render, agrega `DATABASE_URL` con esa cadena y `YUKI_AUTH_ENCRYPTION_KEY` con una clave hexadecimal de 64 caracteres generada en tu computadora:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Conserva una copia segura de la clave de cifrado. No la cambies ni la subas a GitHub: sin ella no se puede recuperar la sesión guardada.
4. Guarda las variables y espera el despliegue. La tabla de sesión se crea automáticamente. Al usar una base nueva tendrás que escanear el QR inicial una vez; después las credenciales y claves se guardan cifradas en PostgreSQL y se reutilizan en los reinicios.

`QR_ACCESS_TOKEN` sigue siendo necesaria para abrir la página privada `/qr` al vincular WhatsApp. Si `DATABASE_URL` no está configurada, el bot conserva el comportamiento anterior y guarda la sesión en archivos locales, que pueden perderse cuando Render reinicie el servicio gratuito.

Si vuelve a aparecer un QR después de una vinculación exitosa, comprueba en los logs que cargó la sesión persistente y que `DATABASE_URL` y `YUKI_AUTH_ENCRYPTION_KEY` siguen siendo las mismas. Mantén una sola instancia del bot conectada a esa sesión. Si WhatsApp cierra la sesión, detén el servicio y, solo entonces, ejecuta `DELETE FROM yuki_whatsapp_auth;` en Neon para iniciar una vinculación nueva; esto elimina únicamente la sesión del bot, no la base completa.

Neon conserva la sesión, pero no evita que Render Gratis suspenda el servicio por inactividad. El código no puede garantizar disponibilidad 24/7 en ese plan; para mantener el bot siempre activo se necesita un plan/servicio que permita procesos permanentes.

Esta base guarda solo la sesión de WhatsApp. Los datos del bot que están en SQLite no se trasladan con ella.
