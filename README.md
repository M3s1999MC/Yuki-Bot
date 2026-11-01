# Yuki-Bot

## Datos persistentes en Neon y Render

Para conservar los perfiles, economía, gachas, grupos y la sesión de WhatsApp tras reinicios, configura en Render:

- `DATABASE_URL`: URL PostgreSQL completa de Neon (sin comillas ni el prefijo `DATABASE_URL=`).
- `YUKI_AUTH_ENCRYPTION_KEY`: clave hexadecimal de 64 caracteres; genera una con:
  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `QR_ACCESS_TOKEN`: token privado de al menos 32 caracteres para abrir `/qr`.

Si `DATABASE_URL` no está configurada, el bot usará SQLite local, cuyos datos pueden perderse al reiniciar Render.

Guarda la clave de cifrado en un lugar seguro y no la cambies: sin ella no se puede recuperar la sesión. Las tablas de datos del bot y la tabla de sesión se crean automáticamente en Neon. Una base nueva requiere escanear el QR inicial una vez; luego las credenciales y claves se guardan cifradas en PostgreSQL y se reutilizan en los reinicios.

El bot no solicita la descarga completa del historial de chats al vincularse, para reducir la espera. Baileys mantiene la sincronización básica que necesita para la sesión; los mensajes nuevos siguen llegando, pero el historial completo anterior no se carga.

Si aparece otro QR tras vincular, comprueba los logs para confirmar que cargó la sesión persistente y que ambas variables de Neon siguen iguales. Mantén una sola instancia del bot conectada a esa sesión. Si quitas Yuki de Dispositivos vinculados, WhatsApp revoca la sesión y el bot elimina automáticamente solo sus datos de autenticación para solicitar un QR nuevo; no borra el resto de la base.

Neon conserva la sesión, pero no evita que Render Gratis suspenda el servicio por inactividad. El código no puede garantizar disponibilidad 24/7 en ese plan; para mantener el bot siempre activo se necesita un plan o servicio que permita procesos permanentes.

## Migrar los datos locales de SQLite a Neon

Antes de desplegar esta versión, conserva `DATABASE_URL` en el `.env` local y ejecuta una sola vez:

```powershell
npm run migrate:neon
```

Detén el servicio de Render mientras migras. El comando copia las tablas y filas de `database/yuki.db` a Neon dentro de una transacción; si ya existe un perfil con el mismo JID, los datos de SQLite se copian sobre ese perfil. No borra ni modifica el archivo SQLite local y registra la migración para evitar repetirla. Después inicia Render otra vez. No conectes dos instancias del bot a la vez durante la migración.

El almacenamiento de los datos del bot usa `DATABASE_URL`; `YUKI_AUTH_ENCRYPTION_KEY` solo cifra la sesión de WhatsApp.
