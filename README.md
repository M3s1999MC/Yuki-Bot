# Yuki-Bot

## Datos persistentes en Neon y Render

Para conservar los perfiles, economía, gachas, grupos y la sesión de WhatsApp tras reinicios, configura estas variables en el servidor de Render:

- `DATABASE_URL`: URL PostgreSQL completa de Neon (sin comillas ni el prefijo `DATABASE_URL=`).
- `YUKI_AUTH_ENCRYPTION_KEY`: clave hexadecimal de 64 caracteres; genera una con:
  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `QR_ACCESS_TOKEN`: token privado de al menos 32 caracteres para abrir `/qr` y vincular el número de WhatsApp de Yuki.

Si `DATABASE_URL` no está configurada, el bot usará SQLite dentro del almacenamiento local del servidor. Ese almacenamiento puede perderse al reinstalar o restablecer el servidor; Neon es la opción recomendada para conservar los datos y la sesión.

Guarda la clave de cifrado en un lugar seguro y no la cambies: sin ella no se puede recuperar la sesión. Mantén `DATABASE_URL` y `YUKI_AUTH_ENCRYPTION_KEY` configuradas en Render; deben apuntar siempre a la misma base y conservar la misma clave. Las tablas de datos y de sesión se crean automáticamente en Neon. Para vincular el número de Yuki, abre `/qr` en la dirección y el puerto asignados al servidor, y escanea el QR desde Dispositivos vinculados de ese mismo número. Usa `yuki` como usuario y el valor de `QR_ACCESS_TOKEN` como contraseña. El QR se convierte a imagen una sola vez por cada código que WhatsApp emite y se reutiliza al abrir la página; la página no se actualiza sola. WhatsApp controla la vigencia del código y puede caducarlo: no existe un QR de emparejamiento permanente. Cuando la sesión se vincula, las credenciales se guardan cifradas en PostgreSQL y se reutilizan tras reiniciar el servidor, sin escanear otro QR. Si cambias la base o la clave de cifrado, no se podrá recuperar esa sesión.

Las fechas de recompensas, AFK y actividad de grupos se guardan en milisegundos como `BIGINT` en Neon. En el siguiente inicio, el bot convierte automáticamente las columnas antiguas de `INTEGER`, evitando errores de desbordamiento al contar mensajes.

El bot no solicita la descarga completa del historial de chats al vincularse, para reducir la espera. Baileys mantiene la sincronización básica que necesita para la sesión; los mensajes nuevos siguen llegando, pero el historial completo anterior no se carga.

Si aparece otro QR tras vincular, comprueba los logs para confirmar que cargó la sesión persistente y que ambas variables de Neon siguen iguales. Mantén una sola instancia del bot conectada a esa sesión. Si quitas Yuki de Dispositivos vinculados, WhatsApp revoca la sesión y el bot elimina automáticamente solo sus datos de autenticación para solicitar un QR nuevo; no borra el resto de la base.

Neon conserva la sesión y los datos, pero el servidor también debe permanecer activo para que Yuki responda. Revisa los límites y la política de suspensión del plan de Wispbyte que elijas.

## Desplegar Yuki en Render

1. En **Crear servidor**, selecciona **Node.js** como entorno de ejecución, como en la captura, y crea el servidor.
2. Sube o clona el repositorio en el servidor. Usa Node.js `20.18.1` o superior (Node.js 22 recomendado).
3. En la consola del servidor, instala las dependencias:
   ```sh
   git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"
   npm ci --omit=dev
   ```
   La primera línea permite descargar por HTTPS la dependencia Git de Baileys que aparece en el archivo de bloqueo.
4. Configura el comando de inicio como `npm start`.
5. Configura `PORT` con el puerto asignado por Wispbyte y comprueba que coincide con el puerto expuesto al servidor. La aplicación usa `8000` solo si `PORT` no está definido.
6. Agrega las variables `DATABASE_URL`, `YUKI_AUTH_ENCRYPTION_KEY` y `QR_ACCESS_TOKEN` en el panel de variables de entorno de Wispbyte. No subas el archivo `.env` ni compartas esos valores. Agrega también las claves opcionales de OpenAI o Pinterest si necesitas esas funciones.
7. Comprueba en la consola que `ffmpeg -version` funciona. El runtime Node.js no instala `ffmpeg` automáticamente; los comandos multimedia que lo necesitan requieren que Wispbyte lo proporcione en el entorno.
8. Inicia el servidor y revisa `http://DIRECCION:PUERTO/health` (o la URL que Wispbyte proporcione). Para vincular WhatsApp, abre `http://DIRECCION:PUERTO/qr` y autentícate con el usuario `yuki` y tu `QR_ACCESS_TOKEN`.

Si ya tienes una sesión guardada en Neon, conserva exactamente `DATABASE_URL` y `YUKI_AUTH_ENCRYPTION_KEY` y detén la instancia anterior antes de arrancar la de Wispbyte. No conectes dos instancias a la misma sesión de WhatsApp al mismo tiempo.

## Desplegar Yuki con Docker en Render

Este repositorio también incluye un `Dockerfile` para desplegar **Yuki** en Render con el runtime Docker. Conecta el repositorio de Yuki, selecciona Docker como runtime y configura `DATABASE_URL`, `YUKI_AUTH_ENCRYPTION_KEY` y `QR_ACCESS_TOKEN` como variables privadas. Render define `PORT` automáticamente; no lo fijes a un número en el panel. El contenedor instala las dependencias de Node, incluyendo la dependencia Git de Baileys mediante HTTPS, y `ffmpeg` para las funciones multimedia.

No uses el Dockerfile del proyecto Levanter para este despliegue: ese Dockerfile inicia el bot Levanter. Yuki utiliza la sesión persistente cifrada en Neon y no requiere la variable `SESSION_ID` de Levanter. Conserva los mismos valores de `DATABASE_URL` y `YUKI_AUTH_ENCRYPTION_KEY` si quieres recuperar la sesión existente de Yuki.

## Migrar los datos locales de SQLite a Neon

Antes de desplegar esta versión, conserva `DATABASE_URL` en el `.env` local y ejecuta una sola vez:

```powershell
npm run migrate:neon
```

Detén el servidor mientras migras. El comando copia las tablas y filas de `database/yuki.db` a Neon dentro de una transacción; si ya existe un perfil con el mismo JID, los datos de SQLite se copian sobre ese perfil. No borra ni modifica el archivo SQLite local y registra la migración para evitar repetirla. Después inicia el servidor otra vez. No conectes dos instancias del bot a la vez durante la migración.

El almacenamiento de los datos del bot usa `DATABASE_URL`; `YUKI_AUTH_ENCRYPTION_KEY` solo cifra la sesión de WhatsApp.

## Ilustraciones originales con OpenAI

El comando `!genchar` genera una ficha original y una ilustración usando OpenAI Images API. Configura `OPENAI_IMAGE_API_KEY` o la variable estándar `OPENAI_API_KEY` en Wispbyte y en el `.env` local. No reutilices `AI_API_KEY`, ya que puede pertenecer a otro proveedor. La cuenta de OpenAI también debe tener acceso y saldo para la API de imágenes. Opcionalmente, `OPENAI_IMAGE_MODEL` permite elegir otro modelo de imágenes; por defecto se usa `gpt-image-1-mini` con calidad baja para limitar el costo. Cada ejecución solicita una imagen y puede tener costo según las tarifas de OpenAI.

Si no se configura la clave, el bot enviará la ficha del personaje y un error que indica la variable necesaria, pero no fingirá que generó una imagen.

## Catálogo de `!roll`

Los comandos `!roll`, `!rw`, `!rollwaifu` y `!waifu` eligen exclusivamente entre los personajes que agregues a `utils/gachaRoster.js` y tengan una imagen configurada. No buscan ni añaden personajes de Internet. Al iniciar, el bot sincroniza esa lista con la base de datos. No borra otras filas del catálogo, pero para estos personajes la URL de la base se actualiza con el valor escrito en el código.

Cada personaje solo puede aparecer una vez en el harem de cada usuario. Al iniciar, el bot elimina copias exactas ya existentes y crea restricciones únicas en la base de datos; otro usuario todavía puede reclamar ese personaje.

`!rollcatalog` muestra los personajes de la lista que todavía no tienen imagen. Para asignarlas, edita el personaje correspondiente en `utils/gachaRoster.js` y agrega `imageUrl` con el enlace del pin o de la imagen:

```text
{ name: 'Special Week', serie: 'Uma Musume: Pretty Derby', imageUrl: 'https://www.pinterest.com/pin/...' }
```

Al iniciar, el bot sincroniza esas URLs al catálogo. Acepta enlaces públicos de pins de Pinterest o enlaces directos HTTPS de `i.pinimg.com`; valida y descarga la imagen al hacer la tirada. Deja `imageUrl` vacío si todavía no tienes imagen para ese personaje: no aparecerá en `!roll` hasta que agregues una URL y despliegues el cambio.

Para que `!pinterest` funcione cuando Pinterest bloquea las búsquedas sin iniciar sesión, registra una aplicación en [Pinterest Developers](https://developers.pinterest.com/docs/getting-started/connect-app/) y configura `PINTEREST_ACCESS_TOKEN` en Wispbyte. El token requiere el permiso `pins:read`; Pinterest puede requerir que la app tenga acceso aprobado a la API. Sin ese token el bot intenta la búsqueda pública, pero no puede acceder a resultados que Pinterest reserva a usuarios autenticados.
