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
4. Guarda las variables y espera el despliegue. La tabla de sesión se crea automáticamente. Al usar una base nueva tendrás que escanear un QR una vez; después las credenciales y claves se guardan cifradas en PostgreSQL.

`QR_ACCESS_TOKEN` sigue siendo necesaria para abrir la página privada `/qr` al vincular WhatsApp. Si `DATABASE_URL` no está configurada, el bot conserva el comportamiento anterior y guarda la sesión en archivos locales, que pueden perderse cuando Render reinicie el servicio gratuito.

Esta base guarda solo la sesión de WhatsApp. Los datos del bot que están en SQLite no se trasladan con ella.
