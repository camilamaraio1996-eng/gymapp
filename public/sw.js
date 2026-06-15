// Service Worker for LangGym PWA
// Strategy:
//   /_next/static/ (content-hashed) → cache-first (safe, never stale)
//   HTML / navigation              → network-first (always fresh)
//   /api/ / supabase               → bypass SW entirely

const CACHE_NAME = 'langgym-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Never intercept API or Supabase calls
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) return

  // Next.js hashed static assets → cache-first (content-addressed, safe forever)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached
          return fetch(event.request).then(res => {
            if (res.ok) cache.put(event.request, res.clone())
            return res
          })
        })
      )
    )
    return
  }

  // Everything else (HTML pages, images, manifest) → network-first
  // Users always get fresh content; cache is only a fallback when offline
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return res
      })
      .catch(() => caches.match(event.request))
  )
})
