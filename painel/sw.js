/* ============================================================
   ASSESSOR.IA — service worker da experience-v2
   Offline-first quando hospedado em HTTPS (ou em localhost).
   Adaptado de app/sw.js, com duas correções:
     · o app antigo devolvia index.html para QUALQUER falha de
       rede — inclusive o Three.js do CDN, o que quebrava o
       núcleo 3D offline. Aqui o fallback para o casco só vale
       em navegação (request.mode === 'navigate').
     · o CDN (Three.js + fontes) agora é cacheado em runtime,
       senão a experiência 3D não existe sem internet.
   ============================================================ */
const CACHE = 'meu-assessor-v6-0';

/* o casco e os nove módulos — tudo que é nosso, mesma origem */
const CORE = [
  './', './index.html', './mini-app.html', './icon.svg', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-512-maskable.png',
  './seguranca.js', './briefing.js', './conversa.js', './espelho.js', './numeros.js', './colecoes.js', './foco-ponte.js',
  './modo-pessoal.js', './persona.js', './nucleo.js', './nucleo-sereno.js', './insights.js', './publicar.js', './conectar.js', './roadmap.js', './graph.js', './screens.js', './screens-fin.js',
  './screens-metas.js', './screens-notas.js', './screens-saude.js',
  './screens-foco.js', './screens-timeline.js', './screens-cerebro.js',
  './screens-espiritual.js', './screens-wa.js'
];

self.addEventListener('install', e => {
  /* addAll é tudo-ou-nada: um 404 derruba a instalação inteira.
     Cacheamos um a um pra que um arquivo ausente não quebre o resto. */
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  /* Navegação = rede primeiro. Sem isso o casco velho fica preso no
     cache e o usuário nunca recebe uma versão nova do app (só depois
     de o SW trocar, o que pode levar duas visitas). Offline, cai no
     cache normalmente. */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone)).catch(() => { });
        return res;
      }).catch(() => caches.match(req).then(h => h || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        /* guarda o que der: mesma origem (ok) e CDN (respostas opacas
           têm status 0 e type 'opaque' — servem pra replay offline) */
        const vale = res && (res.ok || res.type === 'opaque');
        if (vale) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone)).catch(() => { });
        }
        return res;
      }).catch(() => {
        /* offline e sem cache: só devolve o casco se for navegação.
           Para um .js ou uma fonte, devolver HTML seria pior que falhar. */
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
