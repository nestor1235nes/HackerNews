# Hacker News Explorer

Aplicación web en React que consume la API pública de Hacker News y muestra:

- Top stories con paginacion de 50 artículos por página.
- Detalle por historia en la ruta de comentarios.
- Comentarios anidados.
- Soporte offline con estrategia Freshness para URLs externas.

## Scripts 
Navegar a la ruta de la carpeta del proyecto:

- npm install
- npm run dev
- npm run build
- npm run preview

## Rutas

- /top
- /story/:id
- 404 personalizada para rutas no válidas

## Requisito Offline

Se implementa Service Worker en [public/sw.js](public/sw.js) con:

- Freshness (network first, fallback cache) para Hacker News API.
- Cache máxima de 10 respuestas para URLs externas de la API.
- Cache de shell para soportar apertura de interfaz sin conexión.

Registro de Service Worker en [src/offline/registerServiceWorker.js](src/offline/registerServiceWorker.js), habilitado solo en producción.

## Como Probar Offline

1. Ejecuta npm run dev

(Opcional)
Ejecuta npm run build.
Ejecuta npm run preview.

3. Abre la app y navega por Top y Story para llenar cache.
4. En DevTools, cambiar Network a Offline.
5. Recarga... La interfaz debería mostrar sitios ya visitados.
