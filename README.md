# Apps y juegos para el móvil

Aquí se guarda el código de lo que se pide a Claude por chat y se usa en el móvil.
Cada app es una página publicada como Artifact de Claude: se abre con su enlace, sin
instalar nada. Este repositorio es el archivo de versiones; no hace falta tocarlo a mano.

## Apps

| App | Qué es | Enlace | Versión | Código |
|---|---|---|---|---|
| Farolillo | Minijuego táctil: guía un farolillo, esquiva murciélagos y atrapa luciérnagas | <https://claude.ai/artifact/Qk3f7ZCXto7KDsvrC9fvaq> | 2 | [`apps/farolillo/`](apps/farolillo/) |

Los enlaces son privados: piden iniciar sesión en claude.ai con la cuenta que los creó.
Todas las apps aparecen también en la galería <https://claude.ai/code/artifacts>.

## Cómo se usa

- **Pedir una app nueva o un cambio.** Se escribe en el chat de Claude Code con este
  repositorio. Un cambio se publica en el mismo enlace; una app nueva recibe un enlace
  propio y una fila en la tabla.
- **Ver un cambio.** Se abre el mismo enlace. El número de versión de la pantalla de
  inicio de cada app confirma cuál se está viendo.
- **Volver a una versión anterior.** Se pide en el chat («vuelve a la versión 1 de
  Farolillo»). Cada versión publicada es un commit de este repositorio.

## Para quien toque el código

- `apps/<nombre>/index.html`: la página, en un solo archivo, tal como se publica.
- `apps/<nombre>/prueba.js`: prueba automática en un móvil táctil emulado
  (`node apps/farolillo/prueba.js`).
- `herramientas/esqueleto.js`: sirve la página en local con el mismo envoltorio que
  añade la publicación.
- `CLAUDE.md`: las reglas del flujo que sigue Claude en cada sesión.
