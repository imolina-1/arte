# Historia del Arte · PAU (2.º de Bachillerato)

Práctica interactiva para la PAU de Historia del Arte (Comunidad de Madrid, modelo vigente): semblanzas de artistas, glosario de términos y pruebas con imágenes, todo enlazado.

**Web:** https://artepau.pages.dev/ (también en https://imolina-1.github.io/arte/)

## Qué incluye

| Sección | Pregunta de la PAU | Qué hace |
|---|---|---|
| Glosario | 1 (estudio) | 740 términos de T1-T18, con buscador, índice alfabético, imágenes y semblanzas relacionadas |
| Simulacro de términos | 1 (2 puntos) | Cuatro imágenes, un término y su definición por imagen, con cronómetro de 18 minutos |
| Test con imágenes | 1 (práctica) | Imagen → término, término → imagen y definición → término |
| Simulacro | 3 (3 puntos) | Cinco artistas al azar, eliges tres y escribes con cronómetro de 27 minutos; corrección orientativa con la semblanza modelo |
| Fichas de obras | 3 (práctica) | Identificar al autor desde la imagen, con repaso espaciado |
| Semblanzas | 3 (estudio) | Las 139 semblanzas (T1-T17), con buscador, enlaces directos y términos del glosario relacionados |
| Línea del tiempo | 3 (estudio) | Vidas de los artistas sobre un eje cronológico, filtrable por tema; cada barra abre la ficha |
| Repaso | 3 (estudio) | Tarjetas retrato → nombre y época (o nombre → época y obras) con repetición espaciada; progreso solo en tu navegador |
| Mapa | 3 (estudio) | Lugares de trabajo de los artistas (Europa y mundo), filtrables por tema; cada círculo lista sus artistas |
| Comparador | 3 (estudio) | Dos artistas frente a frente, con comparaciones clásicas predefinidas |
| Esquemas | todo el temario | Chuleta imprimible por tema: artistas, características, obras y términos |
| Mi progreso | todo el temario | Resumen por tema de tests, fichas, simulacros y tarjetas, con acceso directo al repaso |
| Ficha de artista (`#a-<id>`) | 3 (estudio) | Retrato, fechas, posición en la línea del tiempo, semblanza, obras, términos, contemporáneos y anterior/siguiente del tema |
| Una semblanza, una nota | 3 (1 punto) | Escribes la semblanza de un artista y obtienes la nota sobre 1 punto con el reparto época 0,30 · características 0,35 · obras 0,35 |
| Para hoy (portada) | todo el temario | Sesión diaria adaptativa de unos 10 minutos: artista del día, cinco fichas, ocho tarjetas y refuerzo del tema más débil; al completarla, +25 XP y un sobre |
| Álbum de artistas (`#album`) | motivación | 138 cromos coleccionables; un sobre de tres cada 30 XP y uno de regalo al día; rarezas ★ ★★ ★★★ |
| Clasificación (`#clasificacion`) | motivación | Ranking anónimo (total, semana, racha, cromos); solo se publican cifras |

Incluye una página de créditos, autoría y derechos (`#acerca`), enlazada desde el pie.

Funciona sin conexión y se puede instalar en el móvil (aplicación web progresiva).

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La página |
| `css/style.css`, `js/*.js` | Diseño y programación (`core.js`: utilidades y rutas; `semblanzas.js`: pregunta 3; `glosario.js`: pregunta 1; `extra.js`: línea del tiempo, repaso y ficha de artista; `mas.js`: progreso, comparador, esquemas, mapa y portada) |
| `data/semblanzas.js` | Las semblanzas, con los términos del glosario enlazados a cada una |
| `data/mapa.js` | Fondo cartográfico (Natural Earth, dominio público) y coordenadas de los lugares; se regenera con `geo/run.sh` |
| `data/glosario.js` | Los términos, con sus obras, semblanzas e imágenes enlazadas |
| `img/ret/` | Retratos de 122 artistas, tomados de tus presentaciones (se ven en «Semblanzas» y en la corrección del simulacro; los tests siguen usando la obra) |
| `data/obras.js` | 439 obras (T1-T16 de tus presentaciones; T17 con cuatro de ellas y ocho fotografías de Wikimedia Commons), con los términos que ilustra cada una |
| `img/` | Imagen completa (hasta 1600 px) de cada artista; `img/t/` guarda las miniaturas. `img/obras/` y `img/obras/t/` hacen lo mismo con las obras de las presentaciones |
| `js/juego.js`, `css/juego.css` | Capa de juego: XP y rangos, racha, Para hoy, álbum de cromos, clasificación y estadísticas de «Mi progreso» (se engancha a los módulos existentes sin modificarlos) |
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

## Juego y clasificación anónima

La experiencia (XP), la racha y los cromos se guardan solo en el navegador (`localStorage`, claves `arte_g*`). La clasificación es opcional y anónima: al unirse se genera un identificador aleatorio y solo se envían cifras (XP, racha, cromos, minutos); no hay nombre, alias ni grupo.

Comparte servidor con la web de Historia de España: la función `/api/lb?b=arte` de https://historiapau.pages.dev (Cloudflare Pages Function + D1, tabla `lbA`). Si esa función cae, la clasificación de Arte deja de cargar, pero el resto de la web funciona. La URL está en `LB_URL`, en `js/juego.js`. El profesor puede retirar filas desde «Moderación (profesor)» en la clasificación con su clave de administración. Las cifras se calculan en el dispositivo; el servidor limita subidas anormales, así que es orientativo, no a prueba de trampas.

## Identidad visual (v20)

Titulares en Bricolage Grotesque (variable, ancho 75-100 %, `fonts/bricolage-latin-wdth-normal.woff2`, licencia OFL), texto de estudio en Spectral e interfaz en Inter. Paleta: ciruela (`--green`, la marca), lima (`--hl`, el resaltador), violeta (`--gold`), tinta y papel; el verde queda solo para «acierto» (`--ok`). Se descartó azul + rojo porque, con luminancias casi iguales (razón 1,9), vibran; ciruela y lima tienen una razón de luminancia de ≈11 y no vibran. Todo lo visual de esta capa está en `css/identidad.css`, que se carga la última y pisa a `style.css` y `juego.css`. La portada usa un índice numerado en lugar de tarjetas; los textos de las vistas están en `index.html` y `js/juego.js`.

## Buscador y línea del tiempo (v20)

`js/buscar.js` es el buscador general (botón de la cabecera, Ctrl K): secciones, artistas, obras y términos. `js/tiempo.js` dibuja la línea del tiempo de las obras del dossier a partir de `data/tiempo.js` (`window.ARTE_TL = {"o-id": [año, etiqueta|0]}`): varias obras por año, panel con ficha, «Vivían ese año» y «Más de este tema». Para añadir una obra, apunta su año en ese fichero.
