/* Service worker - deixa o app abrir sem nenhum sinal de internet.
   Guarda a pagina inteira e a biblioteca de leitura de QR no aparelho,
   na primeira visita com rede. Depois disso nunca mais precisa de dados. */
var CACHE = "bgf005-campo-v8";
var JSQR = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
var ARQ = ["./", "./manifest.webmanifest", "./icone.svg", JSQR];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ARQ.map(function (u) {
      return c.add(new Request(u, { cache: "reload" })).catch(function () {});
    }));
  }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Cache primeiro, mas renova por tras: o app abre instantaneo e offline,
   e quando houver rede ele busca a versao nova para a proxima abertura. */
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (r) {
      var rede = fetch(e.request).then(function (resp) {
        if (resp && resp.ok) {
          var cl = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, cl); });
        }
        return resp;
      }).catch(function () {
        return r || caches.match("./");
      });
      return r || rede;
    })
  );
});
