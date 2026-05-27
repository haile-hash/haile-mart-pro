const CACHE_NAME = 'haile-mart-offline-v1';

// BƯỚC 1: LƯU TRỮ CÁC FILE GỐC NGAY KHI CÀI ĐẶT
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Bắt buộc lưu trước giao diện nền tảng
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/logo192.png',
        '/logo512.png'
      ]).catch(err => console.log('Lỗi lưu cache gốc:', err));
    })
  );
  self.skipWaiting(); // Ép Service Worker mới hoạt động ngay
});

// BƯỚC 2: XÓA RÁC CŨ KHI CÓ BẢN CẬP NHẬT MỚI
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// BƯỚC 3: CƠ CHẾ ĐÁNH CHẶN (NETWORK FIRST, FALLBACK TO CACHE)
self.addEventListener('fetch', (event) => {
  // Bỏ qua các thao tác gửi dữ liệu (POST, PUT, DELETE...) lên Supabase/API
  if (event.request.method !== 'GET') return;

  // Bỏ qua các URL kết nối tới Supabase hoặc Chrome Extension
  if (event.request.url.includes('supabase.co') || event.request.url.startsWith('chrome-extension')) return;

  event.respondWith(
    // Ưu tiên tải từ mạng (để luôn có giao diện mới nhất nếu bạn sửa code)
    fetch(event.request)
      .then((response) => {
        // Nếu tải thành công, nhân bản file đó và lưu lén vào ổ cứng (Cache)
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // NẾU MẤT MẠNG VÀ TẢI THẤT BẠI -> Lôi file cũ từ ổ cứng (Cache) ra dùng
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // Nếu mất mạng mà file chưa từng được cache, trả về trang chủ index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
