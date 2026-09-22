// Service worker do Portfólio Financeiro.
// Objetivo: guardar em cache o "casco" da aplicação (o próprio ficheiro HTML autónomo) para que,
// depois da primeira visita, a app abra normalmente mesmo sem ligação à internet.
// Os dados financeiros NUNCA passam por aqui — continuam apenas em localStorage, no dispositivo.

const CACHE_NAME = 'portfolio-financeiro-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: "network first, cache fallback" para o HTML (para receberes sempre a versão mais
// recente quando há internet), e "cache first" para os restantes ficheiros estáticos (ícones, manifesto).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).catch(() => cached))
  );
});
