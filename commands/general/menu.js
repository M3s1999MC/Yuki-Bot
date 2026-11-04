module.exports = {
    name: 'menu',
    aliases: ['help', 'ayuda', 'commands'],
    category: 'general',
    description: 'Muestra el menú principal y la lista completa de comandos disponibles de Yuki.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const menuHeader = `꧁༺ 𝐇𝐨λ𝐚! 𝐒𝐨𝐲 𝓨𝓾𝓴𝓲 ༻꧂\nᴀǫᴜɪ ᴛɪᴇɴᴇs ʟᴀ ʟɪsᴛᴀ ᴅᴇ ᴄₒᴍᴀɴᴅₒs\n╭┈ ↷\n│ ✐ 𝓓𝓮𝔀𝓮𝓵𝓸𝓹𝓮𝓭 𝓫𝔂 Inkra Studios 🌸\n│ ✐ ꒷ꕤ💎 𝐂𝐚𝐧𝐚λ 𝐎𝐟𝐢𝐜𝐢𝐚λ ෴\n│ https://whatsapp.com/channel/0029Vb9AOpk9WtC12RHEEj0Y\n╰─────────────────\n\n`;

        const menuBody = `» ˚୨•(🌸)• ⊹ Perfil ⊹
✧ !profile | !perfil
> Muestra tu perfil o el de un usuario
✧ !level | !lvl
> Muestra tu nivel y experiencia actual
✧ !lboard | !lb | !xptop
> Top de usuarios con más experiencia
✧ !marry | !casarse
> Cásate con alguien mencionándolo o respondiendo a su mensaje
✧ !divorce | !divorciarse
> Divorciarte de tu pareja
✧ !setbirth
> Establece tu fecha de cumpleaños
✧ !delbirth
> Borra tu fecha de cumpleaños
✧ !setdesc | !setdescription
> Establece tu descripción de perfil
✧ !deldesc | !deldescription
> Elimina tu descripción de perfil
✧ !sethobby | !setpasatiempo
> Establece tu pasatiempo
✧ !delhobby | !delpasatiempo | !removehobby
> Elimina tu pasatiempo del perfil
✧ !setgenre
> Establece tu género
✧ !delgenre
> Elimina tu género del perfil

» ˚୨•(🌸)• ⊹ Perfil (Nuevos) ⊹
✧ !boda | !bodas
> Muestra los detalles y tiempo de tu matrimonio actual
✧ !intereses | !gustos
> Establece una lista de gustos en tu perfil
✧ !delintereses | !quitargustos
> Elimina los intereses de tu perfil
✧ !titulo | !settitle
> Establece un título personalizado arriba de tu nombre
✧ !deltitulo | !deltitle
> Elimina tu título personalizado de perfil

» ˚୨•(🌸)• ⊹ Random ⊹
✧ !8ball | !pregunta | !duda
> Consulta a la bola mágica una pregunta de Sí/No
✧ !chiste | !joke
> Envía un chiste aleatorio para romper el hielo en el grupo
✧ !frase | !quote | !consejo
> Muestra un pensamiento aleatorio o un consejo
✧ !ruletarusa | !shot
> Prueba tu suerte con un castigo ficticio e inofensivo
✧ !hack | !hackear
> Simula de forma cómica y falsa el hackeo de un usuario mencionado
✧ !dado
> Lanza un dado; puedes indicar entre 2 y 100 caras
✧ !f
> Envía un respetuoso mensaje rindiendo homenaje
✧ !taza | !café | !mate
> Invita una bebida caliente a otro usuario
✧ !confesion | !confesar
> Genera una confesión absurda o vergonzosa al azar
✧ !funar | !funa
> Inventa una razón cómica para funar a un usuario
✧ !maldicion | !hex
> Lanza una maldición inofensiva y chistosa a alguien del grupo
✧ !sueldo | !salario
> Revela tu sueldo imaginario basado en tu comportamiento en el chat
✧ !iq | !cerebro
> Mide tu IQ del día con un comentario sarcástico
✧ !futuro | !destino
> Predice tu vida en 10 años de forma absurda
✧ !compatibilidad | !shipbot
> Mide qué tan compatible eres hoy con Yuki
✧ !cantar | !letra
> Lanza una frase o verso aleatorio de una canción

» ˚୨•(🌸)• ⊹ Grupo ⊹
✧ !promote | !promover | !admin
> Asciende a un usuario como administrador del grupo (mencionalo o responde su mensaje)
✧ !demote | !degradar
> Desciende a un usuario de administrador del grupo (mencionalo o responde su mensaje)
✧ !bot | !botgc | !onbot
> Activa o desactiva al bot en este grupo.
✧ !clear
> Limpia las claims (waifus) de usuarios inactivos en el grupo.
✧ !close | !cerrar
> Cierra el grupo para que solo los administradores puedan enviar mensajes.
✧ !open | !abrir
> Abre el grupo para que todos puedan enviar mensajes.
✧ !link | !enlace | !invite
> Obtiene el enlace de invitación del grupo.
✧ !count | !mensajes | !messages | !msgcount
> Obtiene el conteo de mensajes de un usuario en este grupo.
✧ !topcount | !topmensajes | !topmsgcount | !topmessages
> Ver el top de usuarios con más mensajes en el grupo.
✧ !groupinfo | !gp | !infogrupo | !infogc
> Muestra información del grupo.
✧ !kick | !ban | !bang | !expulsar
> Expulsa a un usuario del grupo. Admite modos especiales: num, listnum, all, inactive, listinactive.
✧ !hidetag | !tag | !etiquetar
> Envía un mensaje o multimedia mencionando en silencio a todos los usuarios del grupo.
✧ !tagall | !todos | !invocar
> Envía un mensaje mencionando a todos los usuarios del grupo.
✧ !warn | !advertir
> Advierte a un usuario del grupo (mencionalo o responde su mensaje). Expulsa automáticamente al llegar al límite.
✧ !delwarn | !eliminaradvertencia
> Elimina una advertencia de un miembro del grupo (o todas con "all").
✧ !listwarn | !warnings | !advertencias
> Muestra las advertencias registradas de un usuario del grupo.
✧ !setwarnlimit | !warnlimit | !limiteadvertencias
> Configura cuántas advertencias tolera el grupo antes de expulsar automáticamente.
✧ !welcome | !bienvenida
> Activa o desactiva el mensaje de bienvenida para nuevos miembros.
✧ !setwelcome | .setbienvenida
> Establece un mensaje de bienvenida personalizado para el grupo.
✧ !setwelcomeimg | !setbienvenidaimg | !welcomeimg | !setwelcomegif
> Establece una imagen o gif personalizado para la bienvenida del grupo.
✧ !testwelcome | !probarbienvenida | !previewwelcome
> Muestra un ejemplo de cómo se ve la bienvenida actual del grupo.
✧ !goodbye | !despedida | !bye
> Activa o desactiva el mensaje de despedida cuando alguien sale del grupo.
✧ !setgoodbye | !setdespedida
> Establece un mensaje de despedida personalizado para el grupo.
✧ !setgpdesc | !descripciongrupo | !setdescripciongrupo
> Cambia la descripción del grupo.
✧ !setgpname | !nombregrupo | !setnombregrupo
> Cambia el nombre del grupo.
✧ !setgpbanner | !setgpimage | !fotogrupo | !setfotogrupo
> Cambia la foto de perfil del grupo.
✧ !antilink | !antienlace | !antilinks
> Activa o desactiva la eliminación automática de enlaces de otros grupos o canales.
✧ !adminonly | !soloadmin | !onlyadmin | !modoadmin
> Activa o desactiva el modo Solo Admins: solo los administradores del grupo podrán usar el bot.
✧ !inactivos | !listainactivos
> Muestra la lista de miembros inactivos según los días elegidos
✧ !topactivos | !topmensajessemana
> Muestra el top de miembros más activos de la semana
✧ !mute | !silenciar
> Silencia a un usuario para que no pueda usar comandos de Yuki
✧ !unmute | !desilenciar
> Le devuelve los permisos de uso de comandos a un usuario

» ˚୨•(🌸)• ⊹ Economía ⊹
✧ !balance | !bal | !saldo
> Muestra tu saldo (billetera y banco)
✧ !daily
> Reclama tu recompensa diaria
✧ !apostar <cantidad> | !ruleta <cantidad> | !bet <cantidad>
> Juega contra el bot: 50 % de ganar el doble o perder lo apostado
✧ !apostar @usuario <cantidad>
> Reta a otro jugador; debe aceptar el duelo
✧ !duelo @usuario <cantidad>
> Desafía a un usuario; debe responder al reto con !aceptar o !rechazar
✧ !weekly
> Reclama tu recompensa semanal
✧ !monthly
> Reclama tu recompensa mensual
✧ !work | !trabajar
> Trabaja para ganar dinero
✧ !crime | !crimen
> Comete un crimen para ganar dinero (con riesgo)
✧ !rob | !robar
> Intenta robarle a otro usuario (mencionalo o responde su mensaje)
✧ !deposit | !depositar | !dep
> Deposita dinero de tu billetera al banco
✧ !withdraw | !retirar | !wd
> Retira dinero del banco a tu billetera
✧ !transfer | !transferir | !pay | !dar
> Transfiere dinero a otro usuario (mencionalo o responde su mensaje)
✧ !leaderboard | !top | !ranking
> Muestra a los usuarios más ricos
✧ !tienda | !shop
> Compra objetos como tickets de captura
✧ !banco | !bank
> Revisa el estado detallado e intereses de tu cuenta bancaria
✧ !invertir | !inversion
> Arriesga parte de tu saldo en un fondo de inversión simulado
✧ !negocio | !miempresa
> Revisa y cobra las ganancias de tu negocio simulado
✧ !prestamo | !prestar
> Solicita un préstamo al banco de Yuki
✧ !pagardeuda | !pagarprestamo
> Paga las cuotas o salda la deuda de tu préstamo

» ˚୨•(🌸)• ⊹ Gacha ⊹
✧ !roll | !rw | !rollwaifu | !waifu
> Tira un personaje de la lista seleccionada con la imagen que configuró el dueño
✧ !rollcatalog | !catalogoroll
> Muestra los personajes seleccionados que todavía necesitan imagen
✧ !genchar | !generar | !genrandom
> Genera un personaje original con IA o añade uno al catálogo
✧ !claim | !c | !reclamar
> Reclama el personaje de un roll citado
✧ !harem | !waifus | !claims
> Muestra los personajes reclamados de un usuario
✧ !principal | !setmain | !waifuprincipal | !setfav | !setfavourite
> Marca uno de tus personajes reclamados como tu principal
✧ !waifusboard | !waifustop | !topwaifus | !wtop
> Muestra el top de personajes con mayor valor
✧ !vote | !votar
> Vota por un personaje para subir su valor
✧ !trade | !intercambiar
> Intercambia un personaje reclamado con otro usuario del chat
✧ !setclaimmsg | !setclaim
> Modifica el mensaje que se envía al reclamar un personaje
✧ !serielist | !slist | !animelist
> Lista las series disponibles en el gacha
✧ !serieinfo | !ainfo | !animeinfo
> Muestra información y personajes de una serie
✧ !charimage | !waifuimage | !cimage | !wimage
> Muestra una imagen aleatoria de un personaje del catálogo
✧ !sell | !vender
> Pone en venta un personaje reclamado para que otros lo compren
✧ !buychar | !buyc | !buycharacter | !comprar
> Compra un personaje puesto en venta en el chat
✧ !wshop | !haremshop | !tiendawaifus
> Muestra los personajes puestos en venta en el chat
✧ !removesale | !removerventa
> Elimina un personaje que pusiste en venta
✧ !gachainfo | !ginfo | !infogacha
> Muestra tu información y cooldowns de gacha
✧ !givechar | !givewaifu | !regalar
> Regala un personaje reclamado a otro usuario
✧ !giveallharem
> Regala todos tus personajes reclamados a otro usuario
✧ !deletewaifu | !delchar | !delwaifu
> Elimina un personaje reclamado de tu harem
✧ !deletefav | !delfav
> Quita tu personaje favorito/principal
✧ !charinfo | !winfo | !waifuinfo
> Muestra información detallada de un personaje
✧ !favboard | !favtop | !favoritetop
> Muestra el top de personajes favoritos del chat
✧ !delclaimmsg | !resetclaimmsg
> Restablece el mensaje al reclamar un personaje
✧ !atrapar | !catch | !usarticket
> Usa un ticket para intentar atrapar un personaje libre por su ID
✧ !serie | !series | !catalogo | !idlist | !personajes
> Lista las series o los personajes (con ID) de una serie

 ˚୨•(🌸)• ⊹ Descargas ⊹
✧ !pinterest | !pin | !pinsearch
> Busca y envía una imagen de Pinterest con la búsqueda pública
✧ !tiktoksearch | !ttsearch | !ttbuscar
> Busca un video de TikTok por texto (requiere TIKTOK_SEARCH_API_URL)
✧ !ytsearch | !ytbuscar | !yts
> Busca videos en YouTube por texto
✧ !facebook | !fb | !facebookdl | !fbdl
> Descarga un video de Facebook
✧ !instagram | !ig | !igdl | !instadl
> Descarga fotos o videos de Instagram
✧ !play | !yta | !ytmp3 | !playdoc | !play2 | !ytv | !ytmp4 | !play2doc | !playaudio | !mp4
> Busca y descarga audio o video de YouTube
✧ !tiktok | !tt | !tiktokdl | !ttdl
> Descarga un video de TikTok desde un enlace
✧ !tiktokmp3 | !ttmp3 | !tiktokaudio
> Descarga el audio de un video de TikTok en formato mp3
✧ !twitter | !x | !xdl | !dlx | !twdl | !tw | !twt
> Descarga un video o imagen de Twitter/X»

» ˚୨•(🌸)• ⊹ Stickers ⊹
✧ !setmeta | !setstickermeta
> Establece el pack y autor por defecto para tus stickers
✧ !delmeta | !delstickermeta
> Restablece el pack y autor por defecto para tus stickers
✧ !brat
> Crea un sticker estilo brat con texto
✧ !bratv
> Crea un video-sticker estilo brat
✧ !wm | !take
> Cambia el nombre del pack y autor de un sticker citado
✧ !emojimix | !mix
> Fusiona dos emojis en un nuevo sticker
✧ !qc | !quote
> Transforma un texto citado en una tarjeta de sticker tipo frase
✧ !circle | !redondo
> Convierte una imagen en un sticker circular

» ˚୨•(🌸)• ⊹ Utilidades ⊹
✧ !chatgpt | !ia
> Realiza peticiones a ChatGPT
✧ !getpic | !pfp
> Ver la foto de perfil de un usuario
✧ !hd | !enhance | !remini
> Mejora la calidad de una imagen
✧ !toimg | !toimage
> Convierte un sticker en imagen o video
✧ !say | !decir
> Repite un mensaje o multimedia como el bot
✧ !rizz | !comorespondo | !respuesta | !sugerencia
> Sugiere 3 respuestas para un mensaje, captura o texto que citás/pegás, en el tono que elijas
✧ !opener | !abridor | !apertura
> Genera 3 mensajes de apertura para iniciar una conversación, según la bio o descripción que le des
✧ !practicar | !practice | !entrenar
> Inicia una conversación de práctica con una IA que actúa como un match, para entrenar tu forma de ligar
✧ !guardar | !guardarfrase
> Guarda una de las últimas sugerencias de !rizz u !opener en tu biblioteca
✧ !biblioteca | !misfrases | !library
> Muestra tus frases guardadas, o borra una con !biblioteca borrar <número>
✧ !clima | !weather
> Consulta el estado del tiempo en cualquier ciudad
✧ !traducir | !tr
> Traduce un texto o mensaje citado a otro idioma
✧ !calc | !calcular
> Realiza cálculos y operaciones matemáticas rápidas
✧ !encuesta | !poll
> Genera una encuesta rápida para que el grupo vote

» ˚୨•(🌸)• ⊹ Sub-Bot ⊹
✧ !serbot | !jadibot | !subbot | !code
> Vincula tu propio sub-bot (gratis, sin token)
✧ !misubbot | !mivinculo | !mibot
> Muestra el estado de tu sub-bot
✧ !desvincular | !unlink | !delsub
> Desvincula tu sub-bot y borra su sesión
✧ !subbots | !listarbots | !listbots
> Lista todos los sub-bots vinculados
✧ !bots | !sockets
> Ver el número de bots activos
✧ !numdebug | !jiddebug | !debugnum
> Muestra los campos crudos del JID del remitente (para depurar detección de números)
✧ !join | !unir
> Une al bot a un grupo mediante un enlace de invitación
✧ !leave | !salir
> Hace que el bot salga de un grupo
✧ !logout
> Cierra la sesión del Sub-Bot actual y borra sus datos
✧ !reload
> Reinicia la conexión de tu Sub-Bot
✧ !self
> Hace privado o público al bot (modo Self)
✧ !setbanner | !setbotbanner
> Cambia el banner del menú
✧ !setcurrency | !setbotcurrency
> Cambia el nombre de la moneda del bot
✧ !seticon | !setboticon
> Cambia el ícono (foto de perfil) del bot
✧ !setname | !setbotname
> Cambia el nombre del bot
✧ !setprefix | !setbotprefix
> Cambia el prefijo del bot
✧ !setusername
> Cambia el nombre de usuario de WhatsApp del bot
✧ !setstatus
> Cambia el estado (about) de WhatsApp del bot

» ˚୨•(🌸)• ⊹ General ⊹
✧ !afk | !ausente
> Activa el modo ausente (AFK)
✧ !ping | !p
> Muestra la latencia del bot
✧ !menu | !help | !ayuda
> Muestra el listado de comandos disponibles
✧ !baileys
> Muestra la librería Baileys que usa Yuki
✧ !info | !about
> Información sobre el bot
✧ !infobot | !botinfo
> Obtener información del bot
✧ !status | !estado
> Ver el estado del bot
✧ !suggest | !sug | !report | !reporte
> Envía una sugerencia o reporte a los owners del bot

» ˚୨•(🌸)• ⊹ Otros ⊹
✧ !autolearn | !autoaprendizaje
> Ver el estado del proceso automático de generación de conocimiento
✧ !cmdtoggle | !togglecmd
> Activa o desactiva un comando del bot
✧ !gitpull | !gitsync | !updatetoken
> Actualiza el token de GitHub en el remoto y descarga los últimos cambios del repositorio
✧ !botones | !btn | !buttons
> Muestra un ejemplo de menú con botones interactivos
✧ !setprimary | !botprincipal | !setbot
> Designa qué instancia de bot responde en este grupo
✧ !delprimary | !unsetprimary | !quitarprimary | !delbotprincipal
> Quita el bot primario asignado en este grupo
✧ !resetsession | !fixsession | !resyncsession
> Borra la sesión de Signal con un contacto para forzar un handshake nuevo
✧ !revoke | !restablecer
> Restablece el enlace de invitación del grupo.
✧ !apistatus | !apis | !checkapis | !tiktokapis | !ytapis
> Verifica el estado de las APIs de TikTok y YouTube (descarga/búsqueda)
✧ !dlp | !dlpa | !dlpv | !ytdlp | !apidl
> Prueba la descarga de la API con yt-dlp por link o buscando por nombre (audio o video)
✧ !minar | !mine | !mina
> Baja a la mina y consigue minerales (¡con suerte, raros!)
✧ !minerales | !mochila | !inventario | !ores
> Muestra los minerales que tienes o el catálogo con probabilidades
✧ !venderminerales | !vendermin | !vendertodo | !sellores
> Vende todos tus minerales (o solo uno si lo indicas)
✧ !suerte | !luck | !gachaluck
> Revisa el historial de tiradas de un usuario y decide si el bot interviene dándole un personaje (owner/mods)
✧ !sticker | !s
> Convierte una imagen, video, gif, sticker o URL en sticker, con formas y efectos opcionales
✧ !mistralstatus | !mistral | !iamistral | !testmistral
> Verifica si la API de Mistral AI responde (señal, latencia y errores)
✧ !iastatus | !apisia | !checkia | !iaapis | !estadoia
> Prueba todas las APIs de IA (Gemini, Mistral, Groq, OpenRouter y respaldo) y muestra cuáles responden
✧ !setpic | !setavatar | !setperfilpic
> Establece la imagen o gif de tu perfil
✧ !delpic | !delavatar
> Borra la imagen o gif de tu perfil

» ˚୨•(🌸)• ⊹ Acciones ⊹
✧ !hug | !abrazar
> Abraza a otro usuario
✧ !kiss | !besar
> Besa a otro usuario
✧ !pat | !darpalmada
> Da una palmada a otro usuario

━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        const fullMenuText = menuHeader + menuBody;

        try {
            const imageUrl = 'https://i.pinimg.com/736x/c7/52/42/c752425496a914f6e1e0a58da246fe20.jpg';
            
            const res = await fetch(imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const imageBuffer = Buffer.from(await res.arrayBuffer());

            await sock.sendMessage(jid, {
                image: imageBuffer,
                caption: fullMenuText
            }, { quoted: m });

        } catch (err) {
            console.error('⚠️ Error al cargar la imagen de Pinterest, enviando menú en texto plano:', err.message);
            await sock.sendMessage(jid, { text: fullMenuText }, { quoted: m });
        }
    }
};
