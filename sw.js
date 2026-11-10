/* My Ledger service worker: app shell works offline; updates arrive on the next open (revalidated, never served from the HTTP cache). Bump CACHE with every release. */
const CACHE = "my-ledger-v1.19";
const SHELL = ["./", "index.html", "style.css?v=1.19", "app.js?v=1.19", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => fetch(new Request(u, { cache: "reload" })).then((r) => { if (r.ok) return c.put(u, r); })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; /* exchange-rate APIs etc. go straight to the network */
  /* Network-first with a 4s timeout: files always come from the same fresh release; the cache is only the offline fallback. */
  e.respondWith((async () => {
    const c = await caches.open(CACHE), key = req.mode === "navigate" ? "index.html" : req;
    const net = fetch(req.mode === "navigate" ? new Request(req.url, { cache: "no-cache" }) : new Request(req, { cache: "no-cache" })).then((r) => { if (r && r.ok && r.type !== "opaque") { c.put(key, r.clone()); return r; } return null; }).catch(() => null);
    const t = new Promise((res) => setTimeout(() => res(null), 4000));
    const r = await Promise.race([net, t]); if (r) return r;
    const hit = await c.match(key, { ignoreSearch: true }); if (hit) return hit;
    return (await net) || Response.error();
  })());
});
