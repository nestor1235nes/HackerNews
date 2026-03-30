# Hacker News Explorer

Aplicacion web en React que consume la API publica de Hacker News y muestra:

- Top stories con paginacion de 50 articulos por pagina.
- Detalle por historia en la ruta de comentarios.
- Carga incremental de comentarios y respuestas.
- Soporte offline con estrategia Freshness para URLs externas.

## Requisitos

- Node.js 20+
- npm 10+

## Scripts

Desde la raiz del proyecto:

- npm install
- npm run dev
- npm run build
- npm run preview
- npm run lint

## Rutas

- / (redirecciona a /top)
- /top
- /story/:id
- /404 personalizada para rutas no validas

## Arquitectura Offline

Se implementa Service Worker en [public/sw.js](public/sw.js) con:

- Freshness (network first, fallback cache) para Hacker News API.
- Cache maxima de 10 respuestas para URLs externas de la API.
- Cache de app shell para abrir la interfaz sin conexion.

Registro de Service Worker en [src/offline/registerServiceWorker.js](src/offline/registerServiceWorker.js), habilitado solo en build de produccion.

## Como Probar Offline Correctamente

1. Ejecuta npm install.
2. Ejecuta npm run build.
3. Ejecuta npm run preview.
4. Abre la URL de preview y navega por /top y al menos una ruta /story/:id para calentar cache.
5. En DevTools, cambia Network a Offline.
6. Navega dentro de la app para validar datos previamente cacheados.
7. Prueba F5 estando offline.

## Comportamiento Esperado Offline

- En modo dev (npm run dev), el Service Worker no se registra.
- En modo preview/build, la app shell debe abrir offline si el Service Worker se instalo antes.
- Los datos ya visitados pueden mostrarse offline por cache y localStorage.
- Datos no visitados previamente pueden no estar disponibles offline.
- Con estrategia Freshness y limite de 10 respuestas externas, el contenido disponible offline depende de lo cacheado recientemente.

## Checklist Rapido de Requerimientos Tecnicos

- React estable y React Router.
- Componentes Material UI.
- Modelos y servicios para llamadas a API.
- Ruta /top, /story/:id y /404.
- Estrategia Freshness con maximo 10 respuestas externas.
