// Sin anuncios ni SDK (itch.io, Steam, desarrollo).
export default {
  id: 'none',
  anuncios: false,
  async iniciar() {},
  cargaTerminada() {},
  jugando() {},
  pausa() {},
  anunciosDisponibles: () => false,
  async recompensa() { return false; },
};
