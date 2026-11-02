// Analítica solo local (sin red): retención, sesiones, hitos y vídeos.
export function crearAnalitica({ almacen, juegoId, ahora = () => Date.now() }) {
  const clave = `inc.${juegoId}.analitica`;
  let a;
  try { a = JSON.parse(almacen.get(clave)) ?? null; } catch { a = null; }
  a ??= { primera: ahora(), dias: [], sesiones: 0, segundos: 0, hitos: {}, videos: {}, eventos: [] };
  const dia = () => Math.floor((ahora() - a.primera) / 86400000);
  const guardar = () => { try { almacen.set(clave, JSON.stringify(a)); } catch { /* lleno */ } };

  return {
    sesion() {
      a.sesiones++;
      if (!a.dias.includes(dia())) a.dias.push(dia());
      this.evento('sesion');
    },
    sumarTiempo(seg) { a.segundos += seg; },
    hito(id) { if (a.hitos[id] === undefined) { a.hitos[id] = Math.round(a.segundos); this.evento('hito', { id }); } },
    video(oferta, resultado) { // resultado: ofrecido | visto | fallido
      const v = (a.videos[oferta] ??= { ofrecido: 0, visto: 0, fallido: 0 });
      v[resultado]++;
    },
    evento(tipo, datos) {
      a.eventos.push({ t: ahora(), tipo, ...datos });
      if (a.eventos.length > 300) a.eventos.splice(0, a.eventos.length - 300);
    },
    guardar,
    get datos() { return a; },
    retencion() { return { d1: a.dias.includes(1), d7: a.dias.some((d) => d >= 7), dias: a.dias.length }; },
  };
}
