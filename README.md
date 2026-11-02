# Yuki-Bot

## Datos persistentes en Neon y Render

Para conservar los perfiles, economía, gachas, grupos y la sesión de WhatsApp tras reinicios, configura en Render:

- `DATABASE_URL`: URL PostgreSQL completa de Neon (sin comillas ni el prefijo `DATABASE_URL=`).
- `YUKI_AUTH_ENCRYPTION_KEY`: clave hexadecimal de 64 caracteres; genera una con:
  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `QR_ACCESS_TOKEN`: token privado de al menos 32 caracteres para abrir `/qr` y vincular el número de WhatsApp de Yuki.

Si `DATABASE_URL` no está configurada, el bot usará SQLite local, cuyos datos pueden perderse al reiniciar Render.

Guarda la clave de cifrado en un lugar seguro y no la cambies: sin ella no se puede recuperar la sesión. Mantén `DATABASE_URL` y `YUKI_AUTH_ENCRYPTION_KEY` configuradas en el servicio de Render; deben apuntar siempre a la misma base y conservar la misma clave. Las tablas de datos y de sesión se crean automáticamente en Neon. Para vincular el número de Yuki, escanea el QR de `/qr` desde Dispositivos vinculados de ese mismo número. El QR se convierte a imagen una sola vez por cada código que WhatsApp emite y se reutiliza al abrir la página; la página no se actualiza sola. WhatsApp controla la vigencia del código y puede caducarlo: no existe un QR de emparejamiento permanente. Cuando la sesión se vincula, las credenciales se guardan cifradas en PostgreSQL y se reutilizan al despertar o reiniciar Render, sin escanear otro QR. Si cambias la base, la clave de cifrado o usas SQLite local, Render no podrá recuperar esa sesión.

Las fechas de recompensas, AFK y actividad de grupos se guardan en milisegundos como `BIGINT` en Neon. En el siguiente inicio, el bot convierte automáticamente las columnas antiguas de `INTEGER`, evitando errores de desbordamiento al contar mensajes.

El bot no solicita la descarga completa del historial de chats al vincularse, para reducir la espera. Baileys mantiene la sincronización básica que necesita para la sesión; los mensajes nuevos siguen llegando, pero el historial completo anterior no se carga.

Si aparece otro QR tras vincular, comprueba los logs para confirmar que cargó la sesión persistente y que ambas variables de Neon siguen iguales. Mantén una sola instancia del bot conectada a esa sesión. Si quitas Yuki de Dispositivos vinculados, WhatsApp revoca la sesión y el bot elimina automáticamente solo sus datos de autenticación para solicitar un QR nuevo; no borra el resto de la base.

Neon conserva la sesión, pero no evita que Render Gratis suspenda el servicio tras 15 minutos sin tráfico entrante. Para mantener despierto un servicio Gratis, configura un monitor externo que consulte `https://TU-SERVICIO.onrender.com/health` cada 5 minutos; Render también limita el uso gratis a 750 horas por espacio de trabajo al mes. Para disponibilidad permanente sin depender de un monitor, usa un plan/servicio que permita procesos siempre activos. Cerrar el panel de Render no debería detener por sí mismo el servicio.

## Migrar los datos locales de SQLite a Neon

Antes de desplegar esta versión, conserva `DATABASE_URL` en el `.env` local y ejecuta una sola vez:

```powershell
npm run migrate:neon
```

Detén el servicio de Render mientras migras. El comando copia las tablas y filas de `database/yuki.db` a Neon dentro de una transacción; si ya existe un perfil con el mismo JID, los datos de SQLite se copian sobre ese perfil. No borra ni modifica el archivo SQLite local y registra la migración para evitar repetirla. Después inicia Render otra vez. No conectes dos instancias del bot a la vez durante la migración.

El almacenamiento de los datos del bot usa `DATABASE_URL`; `YUKI_AUTH_ENCRYPTION_KEY` solo cifra la sesión de WhatsApp.

## Ilustraciones originales con OpenAI

El comando `!genchar` genera una ficha original y una ilustración usando OpenAI Images API. Configura `OPENAI_IMAGE_API_KEY` o la variable estándar `OPENAI_API_KEY` como variable privada tanto en Render como en el `.env` local. No reutilices `AI_API_KEY`, ya que puede pertenecer a otro proveedor. La cuenta de OpenAI también debe tener acceso y saldo para la API de imágenes. Opcionalmente, `OPENAI_IMAGE_MODEL` permite elegir otro modelo de imágenes; por defecto se usa `gpt-image-1-mini` con calidad baja para limitar el costo. Cada ejecución solicita una imagen y puede tener costo según las tarifas de OpenAI.

Si no se configura la clave, el bot enviará la ficha del personaje y un error que indica la variable necesaria, pero no fingirá que generó una imagen.

## Catálogo de `!roll`

Los comandos `!roll`, `!rw`, `!rollwaifu` y `!waifu` eligen exclusivamente entre los 116 personajes iniciales y los que agregues a `utils/gachaRoster.js`. No buscan ni añaden personajes de Internet. Al iniciar, el bot sincroniza esa lista con la base de datos. No borra otras filas del catálogo, pero para estos personajes la URL de la base se actualiza con el valor escrito en el código.

`!rollcatalog` muestra los personajes de la lista que todavía no tienen imagen. Para asignarlas, edita el personaje correspondiente en `utils/gachaRoster.js` y agrega `imageUrl` con el enlace del pin o de la imagen:

```text
{ name: 'Special Week', serie: 'Uma Musume: Pretty Derby', imageUrl: 'https://www.pinterest.com/pin/...' }
```

Al iniciar, el bot sincroniza esas URLs al catálogo. Acepta enlaces públicos de pins de Pinterest o enlaces directos HTTPS de `i.pinimg.com`; valida y descarga la imagen al hacer la tirada. Deja `imageUrl` vacío si todavía no tienes imagen para ese personaje: no aparecerá en `!roll` hasta que agregues una URL y despliegues el cambio.

Para que `!pinterest` funcione cuando Pinterest bloquea las búsquedas sin iniciar sesión, registra una aplicación en [Pinterest Developers](https://developers.pinterest.com/docs/getting-started/connect-app/) y configura `PINTEREST_ACCESS_TOKEN` como variable privada en Render. El token requiere el permiso `pins:read`; Pinterest puede requerir que la app tenga acceso aprobado a la API. Sin ese token el bot intenta la búsqueda pública, pero no puede acceder a resultados que Pinterest reserva a usuarios autenticados.
