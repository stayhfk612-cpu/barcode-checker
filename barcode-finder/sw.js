// ─── Barcode-Finder Service Worker ───
// キャッシュ名のバージョンを上げると、古いキャッシュは自動的に破棄されます。
// HTML はネットワーク優先（オンライン時は常に最新を取得）＝古い版が残りにくい設計。
const CACHE = 'finder-v4';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js'
];

// インストール：アプリ本体を事前キャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // 1件でも失敗して全体が失敗しないよう個別に追加
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
});

// アクティベート：古いキャッシュを削除し、すぐ制御を握る
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ページから skipWaiting を受け取ったら即時反映
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isNavigation =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    // HTML：ネットワーク優先 → 失敗時のみキャッシュ（オフライン対応）
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // その他の資産：キャッシュ優先 → なければ取得してキャッシュ
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && (res.status === 200 || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
