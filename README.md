# No leas, ¡observa!: el efecto Stroop

Sitio estático (HTML, CSS y JavaScript sin dependencias) para el proyecto académico de la Facultad de Psicología, UNICACH.

## Estructura

Una sola página (`index.html`) con ocho secciones y menú de anclas:

| Ancla | Sección |
| --- | --- |
| `#inicio` | Inicio |
| `#nosotros` | Nosotros |
| `#proyectos` | Proyectos (`#prueba` es la prueba interactiva) |
| `#videos` | Videos |
| `#textos` | Textos |
| `#sitios` | Sitios de interés |
| `#animacion` | Animación |
| `#espacio` | Diseño de espacio |

## Notas

- Las tipografías están en `assets/fonts` (Plus Jakarta Sans y Rubik como fuentes variables), así que el sitio se ve igual sin internet. Solo los videos de YouTube y TikTok necesitan conexión.
- Las etiquetas Open Graph apuntan a `https://sergioricardo96.github.io/efecto-stroop/`; si el sitio se publica en otra dirección hay que cambiar `og:url` y `og:image` en `index.html`.
- El logo (ojo con iris de cuatro tintas) está en `assets/img/icon.svg` y en PNG de 32, 180 y 512 px; la imagen para compartir es `assets/img/og.png`.

## Ver en local

```bash
python -m http.server 8080
```

Luego abre http://localhost:8080.

## Pendientes de contenido

- Reel y fotos del equipo (Inicio y Nosotros).
- Historia de Yuridia Stefani (Nosotros).
- Lista de documentales y películas (Videos).
- Animación y diseño de espacio.
