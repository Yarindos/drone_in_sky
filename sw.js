const CACHE_NAME = 'drone-in-sky-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './icons/shahed_real.svg',
    './icons/ukr_drone.svg',
    './icons/missile_cruise.svg',
    './icons/missile_ballistic.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
