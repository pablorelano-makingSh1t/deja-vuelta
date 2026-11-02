// Textos de Déjà Vuelta (es). Los de la Crónica son arrays [bucle 1, bucle 2, bucle 3+].

export const ERAS = {
  1: { nombre: 'Hoguera', riqueza: 'bayas' },
  2: { nombre: 'Barro', riqueza: 'grano' },
  3: { nombre: 'Encrucijada', riqueza: 'grano' },
  4: { nombre: { hierro: 'Imperio', rio: 'Mercados', estrellas: 'Observatorios' }, riqueza: 'monedas' },
  5: { nombre: { hierro: 'Pólvora', rio: 'Gremios', estrellas: 'Lentes' }, riqueza: 'monedas' },
  6: { nombre: 'Chispa', riqueza: 'pesetas' },
  7: { nombre: 'Átomo', riqueza: 'créditos' },
  8: { nombre: 'Cronos', riqueza: 'créditos' },
};
export const nombreEra = (n, camino) => { const e = ERAS[n].nombre; return typeof e === 'string' ? e : e[camino] ?? 'Encrucijada'; };

export const RECURSOS = {
  riqueza: { simbolo: '◈', nombre: 'riqueza' },
  ideas: { simbolo: '✎', nombre: 'ideas' },
  energia: { simbolo: 'ϟ', nombre: 'energía' },
  cronos: { simbolo: '⧗', nombre: 'tiempo' },
  ecos: { simbolo: '◌', nombre: 'Ecos' },
};

export const GEN_TXT = {
  recolectora: ['Recolectoras', 'Bayas, raíces y lo que no pique.'],
  cazadores: ['Partida de caza', 'Vuelven tarde y con historias exageradas.'],
  campo: ['Campo de trigo', 'Alguien enterró una semilla y esperó. Genio.'],
  alfar: ['Alfar', 'Vasijas. Y en las vasijas, dibujos. Y en los dibujos, ideas.'],
  aldea: ['Aldea', 'Casas juntas. Vecinos. Rencillas. Civilización.'],
  escriba: ['Escriba', 'Apunta quién debe qué a quién. Sin él no hay historia.'],
  forja: ['Forja', 'Hierro al rojo y martillos que no paran.'],
  academia: ['Academia militar', 'Se estudia la guerra para no tener que improvisarla.'],
  fundicion: ['Fundición', 'Cañones, campanas y lo que haga falta.'],
  estadomayor: ['Estado mayor', 'Mapas grandes, mesas grandes, egos grandes.'],
  mercado: ['Mercado', 'Todo tiene precio, sobre todo lo que no lo tiene.'],
  templo: ['Templo del río', 'Se reza a la crecida y a la sequía, por si acaso.'],
  gremio: ['Gremio', 'Nadie trabaja sin carné. Ni sin cuota.'],
  puente: ['Puente', 'Cruzar el río ya no da miedo. Al río tampoco le hace gracia.'],
  observatorio: ['Observatorio', 'Mirar arriba también es trabajar.'],
  biblioteca: ['Biblioteca', 'Silencio. Los libros, a veces, se caen solos.'],
  lentes: ['Taller de lentes', 'Vidrio pulido hasta ver lo que no se veía.'],
  universidad: ['Universidad', 'Gente muy lista discutiendo con gente muy lista.'],
  dinamo: ['Dinamo', 'Gira, y la oscuridad se aparta.'],
  ciudad: ['Ciudad iluminada', 'Nadie vuelve a ver las estrellas. Pero hay farolas.'],
  reactor: ['Reactor', 'Una piedra caliente muy, muy cara.'],
  laboratorio: ['Laboratorio', 'Batas blancas y una pizarra con algo que acaba en «=t».'],
  acelerador: ['Acelerador de partículas', 'Hace girar el tiempo a 142 km/h. Literalmente.'],
  relojeros: ['Relojeros suizos', 'Precisión. Paciencia. Ni una sola prisa.'],
};

export const MEJ_TXT = {
  // hitos
  sembrar: ['Sembrar', 'Abre la era del Barro.'],
  escritura: ['Escritura', 'Abre la Encrucijada.'],
  monumento: ['Monumento', 'Corona tu camino. Trae una pieza de la máquina.'],
  electricidad: ['Electricidad', 'Abre la era de la Chispa.'],
  fision: ['Fisión', 'Abre la era del Átomo.'],
  cronologia: ['Cronología', 'Abre la era de Cronos: ya se puede construir la máquina.'],
  // máquina
  bastidor: ['Bastidor', 'Un armazón de acero con forma de puerta que no da a ningún sitio.'],
  bobina: ['Condensador de fluzo', 'No preguntes. Funciona.'],
  nucleo: ['Núcleo de cronos', 'Tiempo embotellado. Agítese antes de usar.'],
  // saberes
  pedernal: ['Pedernal', 'Recolectoras ×3.'], lanzas: ['Lanzas', 'Partidas de caza ×3.'],
  arado: ['Arado', 'Campos ×3.'], torno: ['Torno de alfarero', 'Alfares ×3.'],
  calendario: ['Calendario', 'Toda la producción ×2.'], tinta: ['Tinta', 'Escribas ×3.'],
  ley: ['Ley escrita', 'Aldeas ×3.'], acero: ['Acero', 'Forjas ×3.'], estrategia: ['Estrategia', 'Fundiciones ×3.'],
  moneda: ['Moneda', 'Mercados ×3.'], rito: ['Rito del agua', 'Gremios ×3.'],
  astrolabio: ['Astrolabio', 'Observatorios ×4.'], optica: ['Óptica', 'Talleres de lentes ×4.'],
  imprenta: ['Imprenta', 'Ideas ×3.'], banca: ['Banca', 'Toda la producción ×3.'],
  bombilla: ['Bombilla', 'Ciudades ×3.'], turbina: ['Turbina', 'Dinamos ×4.'],
  moderador: ['Moderador', 'Reactores ×3.'], superconductor: ['Superconductor', 'Toda la producción ×4.'],
  relatividad: ['Relatividad', 'Tiempo ⧗ ×3.'], cuerdas: ['Teoría de cuerdas', 'Relojeros ×3.'],
  // taller
  maleta: ['Maleta más grande', '+1 hueco para recuerdos.'],
  estabilizador: ['Estabilizador', 'Reduce la probabilidad de avería (30 %, luego 55 %).'],
  callos: ['Callos en las manos', 'Avivar ×3.'],
  arranque: ['Arranque en caliente', 'Cada bucle empieza con 25 recolectoras.'],
  bolsillo: ['Reloj de bolsillo', 'El tiempo fuera cuenta 4 h más.'],
  intuicion: ['Intuición', 'Ecos ×1,35 por nivel.'],
};

export const CAMINOS_TXT = {
  hierro: { nombre: 'Hierro', lema: 'Conquista. Riqueza ×1,5, ideas ×0,7.', pieza: 'Engranaje' },
  rio: { nombre: 'Río', lema: 'Comercio y fe. La producción sube y baja con las estaciones (×0,75–×1,45).', pieza: 'Péndulo' },
  estrellas: { nombre: 'Estrellas', lema: 'Saber. Empieza lento; la riqueza crece con las ideas acumuladas.', pieza: 'Lente' },
};

// ---------- Crónica ----------
export const INICIO = [
  'Año Uno. Una tribu pequeña alrededor de una hoguera pequeña. Empiezo a escribir esto por si algún día importa.',
  'Año Uno. Una tribu, una hoguera. Tengo la sensación de haber escrito ya esta frase.',
  'Año Uno. Otra vez. La hoguera chisporrotea en el mismo sitio. Esta vez voy a fijarme más.',
];
export const PRIMERA_COMPRA = {
  recolectora: ['Las primeras recolectoras vuelven con las manos moradas de bayas.', 'Las recolectoras van directas al zarzal bueno. Nadie se lo ha dicho.', 'Les digo a las recolectoras dónde está el zarzal. Me miran raro.'],
  cazadores: ['Sale la primera partida de caza. Vuelve con un ciervo y con tres versiones distintas de cómo lo cazaron.', 'La partida de caza vuelve con un ciervo. Juraría que era el mismo ciervo.'],
  campo: ['Alguien entierra una semilla y se sienta a esperar. Los demás se ríen. Luego dejan de reírse.'],
  alfar: ['La primera vasija tiene un dibujo: una rueda con dientes. Nadie sabe qué es una rueda con dientes.', 'Otra vez la vasija con la rueda dentada. Es un engranaje. ¿Cómo sé yo lo que es un engranaje?'],
  aldea: ['Ya hay calles. Bueno, barro con intención de calle.'],
  escriba: ['El primer escriba apunta una deuda. La historia empieza con alguien debiendo algo.'],
  forja: ['El hierro se dobla y suena como una campana. Los herreros dicen que el martillo «sabe» dónde caer.'],
  mercado: ['En el mercado se vende de todo. Un mercader ofrece «arena de reloj». Nadie compra.'],
  observatorio: ['Desde el observatorio se ve una estrella que no estaba ayer. Mañana tampoco estará.'],
  biblioteca: ['La biblioteca abre. A la mañana siguiente, un libro está en el suelo.'],
  dinamo: ['La primera bombilla parpadea. Un niño le pregunta si está viva.'],
  reactor: ['El reactor arranca. Durante un segundo, todos los relojes de la ciudad marcan la misma hora: la del Año Uno.'],
  acelerador: ['El acelerador gira tan rápido que la sombra de los técnicos llega antes que ellos.', 'El acelerador. La sombra que llega antes. Ya lo sabía. Ya lo sabía.'],
};
export const ERA_TXT = {
  2: ['Se inventa la agricultura. Empieza la era del Barro.', 'La agricultura, otra vez. Esta vez nadie se ríe del que entierra semillas.', 'El Barro. Me sé los nombres de los primeros campos. Les pongo los mismos.'],
  3: ['Se inventa la escritura. Ahora puedo escribir esto de verdad. Llegamos a una encrucijada.', 'La escritura. Las primeras palabras escritas son las mismas que la última vez. No sé qué última vez.', 'La escritura. En la Encrucijada, alguien me pregunta qué camino tomar. Le digo que todos llevan al mismo sitio.'],
  4: ['El pueblo ha elegido. A partir de aquí, la historia se bifurca.'],
  5: ['El monumento está terminado. Dentro hay algo que nadie ha puesto ahí.'],
  6: ['Electricidad. La noche ya no es tan noche.', 'Electricidad. Todo el mundo tiene prisa, como si supieran que se acaba el tiempo.'],
  7: ['El átomo se divide y algo más se divide con él. No sé el qué.', 'El átomo. Dicen que el tiempo, de cerca, también está hecho de piezas.'],
  8: ['Cronos. Los sabios dicen que el tiempo se puede doblar como el hierro. Hay planos para una máquina.', 'Cronos. Los planos de la máquina son idénticos a un dibujo de una vasija del Año Uno.', 'Cronos. La máquina. Sé exactamente dónde va cada tornillo. Sé exactamente cuál falta.'],
};
export const CAMINO_TXT = {
  hierro: ['El pueblo elige el Hierro. Se forjan espadas y se fundan fronteras.', 'El Hierro otra vez. Las espadas pesan lo mismo.', 'Elijo el Hierro. Que lo cuenten los vencedores; esta vez seré yo.'],
  rio: ['El pueblo elige el Río. Se comercia, se reza y se espera a la crecida.', 'El Río. El agua tiene algo de memoria.', 'Elijo el Río. Nadie se baña dos veces en el mismo, dijo alguien. Yo sí.'],
  estrellas: ['El pueblo elige las Estrellas. Se mira hacia arriba y se apunta todo.', 'Las Estrellas. Alguien ya había dibujado este mapa del cielo.', 'Elijo las Estrellas. Esta vez sé dónde mirar.'],
};
export const PIEZA_TXT = {
  engranaje: 'Dentro del monumento aparece un engranaje de latón. Encaja con algo que todavía no existe. (Pieza: Engranaje.)',
  pendulo: 'En el fondo del templo, un péndulo de latón oscila solo. Nadie lo empujó. (Pieza: Péndulo.)',
  lente: 'En el taller aparece una lente que enfoca cosas que todavía no han pasado. (Pieza: Lente.)',
  repetida: 'En el monumento hay una pieza de latón que ya tienes. La dejáis donde estaba, por si alguien la necesita.',
};
export const PARADOJA_TXT = [
  [20, 'La gente cuenta historias de objetos que caen del cielo. Los adoran.'],
  [40, 'Hay alguien junto a la hoguera que nadie conoce. Nadie le ha visto llegar.'],
  [70, 'La máquina, que todavía no existe, ya se está calentando. El próximo salto romperá dos recuerdos.'],
  [95, 'Un niño dibuja en la arena la máquina del tiempo, con todos los detalles. Su madre le pregunta quién se la ha enseñado. Señala hacia ti.'],
];
export const MITO_TXT = {
  normal: 'La tribu encuentra un objeto imposible: «{r}». Lo entierran con honores y le rezan.',
  mutado: 'Algo ha llegado mal. La tribu encuentra «{r}» y no sabe si adorarlo o tenerle miedo.',
};

export const FINALES = {
  intro: 'Engranaje, Péndulo y Lente. La máquina está entera por primera vez. Ya no tienes por qué volver al Año Uno.',
  cerrar: {
    boton: 'Cerrar el bucle',
    desc: 'Te quedas. La máquina deja de averiarse para siempre. Créditos.',
    texto: 'Tiras de la palanca al revés. La máquina se apaga con un suspiro. Fuera, la ciudad sigue con su día normal, sin saber que es el primero de verdad. Por primera vez no sabes qué pasa mañana. Está bien.',
  },
  romper: {
    boton: 'Romperla otra vez',
    desc: 'Sacas los tornillos y te los llevas a la cueva. Ecos ×2 para siempre.',
    texto: 'Desmontas doce tornillos de latón. Los llevas en el bolsillo. Ya sabes dónde dejarlos. Ya sabes quién los encontrará. Año Uno. Otra vez.',
  },
};
