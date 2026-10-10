// public/sw.js
/// <reference lib="webworker" />

const CACHE_NAME = 'goal-tracker-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Установка: кэшируем основные файлы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Кэширование файлов...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Активация: удаляем старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
});

// Перехват запросов: отдаём из кэша или загружаем из сети
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});