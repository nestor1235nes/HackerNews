export function registerServiceWorker() {
  if (!import.meta.env.PROD) {
    return
  }

  if (!('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('No se pudo registrar el Service Worker:', error)
    })
  })
}
