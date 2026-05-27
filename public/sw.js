// public/sw.js
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Đã cài đặt thành công!');
});

self.addEventListener('fetch', (e) => {
  // Bỏ trống để trình duyệt tự xử lý mạng bình thường
});
