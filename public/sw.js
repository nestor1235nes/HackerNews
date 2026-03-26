const APP_SHELL_CACHE = 'app-shell-v1'
const EXTERNAL_API_CACHE = 'external-api-freshness-v1'
const EXTERNAL_API_PREFIX = 'https://hacker-news.firebaseio.com/v0/'
const EXTERNAL_MAX_ENTRIES = 10

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(['/', '/index.html', '/favicon.svg'])
    }),
  )

  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      const validCaches = [APP_SHELL_CACHE, EXTERNAL_API_CACHE]
      return Promise.all(
        keys
          .filter((key) => !validCaches.includes(key))
          .map((key) => caches.delete(key)),
      )
    }),
  )

  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (url.href.startsWith(EXTERNAL_API_PREFIX)) {
    event.respondWith(networkFirstWithFreshness(request))
    return
  }

  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate') {
      event.respondWith(navigationNetworkFirst(request))
      return
    }

    event.respondWith(cacheFirstForAppShell(request))
  }
})

async function networkFirstWithFreshness(request) {
  const cache = await caches.open(EXTERNAL_API_CACHE)

  try {
    const networkResponse = await fetch(request)

    if (networkResponse && networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
      await trimExternalApiCache(cache, EXTERNAL_MAX_ENTRIES)
    }

    return networkResponse
  } catch (_error) {
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    throw _error
  }
}

async function navigationNetworkFirst(request) {
  const cache = await caches.open(APP_SHELL_CACHE)

  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.ok) {
      await cache.put('/index.html', networkResponse.clone())
    }

    return networkResponse
  } catch (_error) {
    const fallbackResponse = await cache.match('/index.html')
    if (fallbackResponse) {
      return fallbackResponse
    }

    throw _error
  }
}

async function cacheFirstForAppShell(request) {
  const cache = await caches.open(APP_SHELL_CACHE)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  const networkResponse = await fetch(request)
  if (networkResponse && networkResponse.ok) {
    await cache.put(request, networkResponse.clone())
  }

  return networkResponse
}

async function trimExternalApiCache(cache, maxEntries) {
  const keys = await cache.keys()
  if (keys.length <= maxEntries) {
    return
  }

  const overflow = keys.length - maxEntries
  await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)))
}
