# Arte PAU · Historia del Arte (2.º de Bachillerato)

Práctica interactiva para la PAU de Historia del Arte (Comunidad de Madrid, modelo 2027): semblanzas de artistas, glosario de términos y pruebas con imágenes, todo enlazado.

**Web:** https://imolina-1.github.io/arte/

## Qué incluye

| Sección | Pregunta de la PAU | Qué hace |
|---|---|---|
| Glosario | 1 (estudio) | 740 términos de T1-T18, con buscador, índice alfabético, imágenes y semblanzas relacionadas |
| Simulacro de términos | 1 (2 puntos) | Cuatro imágenes, un término y su definición por imagen, con cronómetro de 18 minutos |
| Test con imágenes | 1 (práctica) | Imagen → término, término → imagen y definición → término |
| Simulacro | 3 (3 puntos) | Cinco artistas al azar, eliges tres y escribes con cronómetro de 27 minutos; corrección orientativa con la semblanza modelo |
| Fichas de obras | 3 (práctica) | Identificar al autor desde la imagen, con repaso espaciado |
| Semblanzas | 3 (estudio) | Las 139 semblanzas (T1-T17), con buscador, enlaces directos y términos del glosario relacionados |
| Una semblanza, una nota | 3 (1 punto) | Escribes la semblanza de un artista y obtienes la nota sobre 1 punto con el reparto época 0,30 · características 0,35 · obras 0,35 |

Funciona sin conexión y se puede instalar en el móvil (aplicación web progresiva).

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La página |
| `css/style.css`, `js/*.js` | Diseño y programación (`core.js`: utilidades y rutas; `semblanzas.js`: pregunta 3; `glosario.js`: pregunta 1) |
| `data/semblanzas.js` | Las semblanzas, con los términos del glosario enlazados a cada una |
| `data/glosario.js` | Los términos, con sus obras, semblanzas e imágenes enlazadas |
| `data/obras.js` | 431 obras extraídas de tus presentaciones (T1-T16, más cuatro de T17), con los términos que ilustra cada una |
| `img/` | Imagen completa (hasta 1600 px) de cada artista; `img/t/` guarda las miniaturas. `img/obras/` y `img/obras/t/` hacen lo mismo con las obras de las presentaciones |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Uso sin conexión e instalación en el móvil |

## Cómo actualizar

1. Sustituye los archivos de `data/` (y las imágenes de `img/` si hace falta).
2. En `sw.js`, sube el número de `VERSION` (por ejemplo, `arte-pau-v2`) para que los móviles descarguen la versión nueva.

Los vínculos entre términos, obras e imágenes salen de las «Obras» que cita cada definición del glosario y de los pies de las imágenes. En las obras de las presentaciones (`obras.js`) cada imagen lleva su propia lista de términos aplicables, para que el test no pregunte por detalles que no se ven en la foto.

La nota de los simulacros es orientativa: comprueba la presencia de contenidos, no la calidad de la redacción.

## Estadísticas anónimas

La página envía recuentos anónimos a [GoatCounter](https://www.goatcounter.com) (sin cookies ni datos personales), cuenta `imolina` (panel: https://imolina.goatcounter.com). El código se cambia en `A.GC_CODE`, en `js/core.js`. Rutas que se registran:

| Ruta | Qué cuenta |
|---|---|
| `vista/…` | Uso de cada sección |
| `simulacro/…`, `propuesto/…`, `elegido/…`, `nota/…` | Simulacros de semblanzas, qué artistas se proponen y eligen, y su resultado |
| `ficha/…`, `leida/…` | Fichas acertadas o falladas y semblanzas leídas |
| `p1/…`, `test/…`, `glosario/termino/…` | Simulacros de términos, tests y términos consultados |

Material de uso docente. Las imágenes proceden de las presentaciones de clase; las obras y fotografías conservan los derechos de sus autores.
