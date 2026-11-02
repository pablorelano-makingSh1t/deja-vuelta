// Bucle de paso fijo (100 ms) con render limitado. Solo navegador.
export function crearBucle({ paso = 0.1, maxPasos = 50, hzRender = 12, tick, render, sobrante }) {
  let acum = 0, ultimo = 0, ultimoRender = 0, id = 0, activo = false;
  const intervaloRender = 1000 / hzRender;

  function frame(t) {
    if (!activo) return;
    if (!ultimo) ultimo = t;
    acum += (t - ultimo) / 1000;
    ultimo = t;
    let n = 0;
    while (acum >= paso && n < maxPasos) { tick(paso); acum -= paso; n++; }
    if (acum >= paso) { sobrante?.(acum); acum = 0; }
    if (t - ultimoRender >= intervaloRender) { ultimoRender = t; render?.(); }
    id = requestAnimationFrame(frame);
  }

  return {
    iniciar() { if (activo) return; activo = true; ultimo = 0; id = requestAnimationFrame(frame); },
    parar() { activo = false; cancelAnimationFrame(id); },
    get activo() { return activo; },
  };
}
