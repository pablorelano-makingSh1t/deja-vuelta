# Flujo de este repositorio

Este repositorio guarda el código de las apps y juegos que el usuario pide por chat y usa
en su móvil Android. Cada app se publica como Artifact de Claude; el repositorio es el
archivo de versiones. El usuario trabaja solo desde el móvil (app o web de Claude, también
con datos móviles), sin PC ni terminal, con su plan Pro, y escribe en español.

## Qué espera el usuario

Pide algo → se construye → abre el enlace en el móvil → lo prueba → pide cambios → vuelve
a abrir el mismo enlace ya actualizado. La entrega es siempre un enlace que funciona, nunca
instrucciones para instalar, compilar o configurar nada.

## Reglas

- **Una carpeta por app**: `apps/<nombre>/index.html`, página de un solo archivo según el
  contrato de Artifacts (sin doctype, html, head ni body propios).
- **Publicar con la herramienta Artifact.** App nueva: enlace nuevo y fila nueva en la
  tabla de `README.md`. Cambio en una app que ya existe: el mismo enlace. Para eso, leer
  antes el artifact por su URL (está en `README.md`) y publicar pasando esa `url`. Nunca
  crear un enlace nuevo para una app existente: el usuario lo tiene guardado en su pantalla
  de inicio.
- **Versión visible.** Cada publicación sube en 1 la constante `VERSION`, que la app
  muestra en su pantalla de inicio; así el usuario confirma en el móvil que ve la nueva.
  Publicar con `label` «vN · qué cambia» y actualizar la versión en `README.md`.
- **Un commit por versión publicada**, «<App> vN: …», con el archivo exactamente como se
  publicó. Volver a una versión anterior es recuperar ese archivo del historial, subirle
  el número de versión y publicarlo en el mismo enlace.
- **Móvil primero.** Controles táctiles con eventos pointer y `touch-action: none` en la
  zona de juego; botones de 48 px o más; texto de 16 px o más; nada que dependa de
  teclado, ratón o pasar el cursor; en juegos, una sola pantalla sin desplazamiento y
  pausa automática al perder el foco.
- **Datos del usuario** (récords, partidas, preferencias): capacidades `db` y `user`,
  documento privado en `data/users/<id>/<app>`, con copia en `localStorage`, como hace
  Farolillo. La app dice en pantalla dónde se ha guardado de verdad y avisa si no pudo.
  No cambiar ni borrar claves de guardado existentes sin avisar antes al usuario; si un
  cambio obliga a perder datos, preguntar primero.
- **Probar antes de publicar** con Playwright emulando un móvil táctil: arranque,
  controles, función principal, reinicio y guardado. `apps/farolillo/prueba.js` y
  `herramientas/esqueleto.js` sirven de modelo. Decir al usuario qué se probó así y qué
  queda por probar en su teléfono.
- **No prometer lo que no hay.** Un Artifact es una página alojada en claude.ai, privada,
  que pide su sesión y necesita conexión; no admite service worker. No es una app
  instalable ni funciona sin conexión. Lo que sí existe es un acceso directo en la
  pantalla de inicio.
- **Sin claves API, servicios de pago ni hosting externo.**
- **Conservar lo anterior.** Empezar una app nueva no toca las demás carpetas ni sus
  enlaces.

## Claves de guardado en uso

| App | localStorage | db |
|---|---|---|
| Farolillo | `farolillo:v1` → `{ record, actualizado }` | `data/users/<id>/farolillo` → `{ record, actualizado }` |
