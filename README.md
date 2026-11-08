# No leas, ¡observa!: el efecto Stroop

Sitio estático (HTML, CSS y JavaScript sin dependencias) para el proyecto académico de la Facultad de Psicología, UNICACH.

## Estructura

Una sola página (`index.html`) con siete secciones y menú de anclas:

| Ancla | Sección |
| --- | --- |
| `#inicio` | Inicio |
| `#nosotros` | Nosotros |
| `#proyectos` | Proyectos (`#prueba` es la prueba interactiva) |
| `#videos` | Videos |
| `#textos` | Textos |
| `#sitios` | Sitios de interés |
| `#animacion` | Animación |

## Notas

- Las tipografías están en `assets/fonts` (Plus Jakarta Sans y Rubik como fuentes variables), así que el sitio se ve igual sin internet. Solo los videos de YouTube y TikTok necesitan conexión.
- El sitio está publicado en https://efectostroop.online (GitHub Pages con el archivo `CNAME`); las etiquetas Open Graph apuntan a ese dominio.
- La animación se recomprimió con ffmpeg (H.264, CRF 25, 1280 px) para pesar 10 MB; el original de 96 MB no está en el repositorio.
- Las estadísticas de visitas van con GoatCounter (sitio `efectostroop`): el script `gc.zgo.at/count.js` registra cada vista y el pie muestra hoy, semana y total leyendo `efectostroop.goatcounter.com/counter/TOTAL.json`. Para que esas cifras aparezcan hay que activar en GoatCounter la opción "Allow adding visitor counts on your website"; el panel completo (países, dispositivos, referidos) está en https://efectostroop.goatcounter.com. GoatCounter no cuenta visitas desde localhost.
- El logo (ojo con iris de cuatro tintas) está en `assets/img/icon.svg` y en PNG de 32, 180 y 512 px; la imagen para compartir es `assets/img/og.png`.

## Ver el sitio

- En línea: https://efectostroop.online
- En local: abre `index.html` en el navegador. Los videos de YouTube y las estadísticas de visitas solo funcionan en la versión publicada.
