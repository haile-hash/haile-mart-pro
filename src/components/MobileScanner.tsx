import React, { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'react-hot-toast';

export const MobileScanner = () => {
  // Dùng useRef thay vì useState để máy ảnh KHÔNG BỊ RENDER LẠI (Không bị chớp tắt)
  const lastScanRef = useRef<string>("");

  useEffect(() => {
    let scanner: any;
    const loadScanner = () => {
      if ((window as any).Html5QrcodeScanner) {
        scanner = new (window as any).Html5QrcodeScanner(
          "qr-reader-mobile", 
          { 
            fps: 15, 
            qrbox: { width: 250, height: 150 }, 
            rememberLastUsedCamera: true,
            videoConstraints: { facingMode: "environment" } 
          }, 
          false
        );
        
        // Chế độ quét LIÊN TỤC
        scanner.render(async (text: string) => {
          // Kiểm tra để không bị quét trùng 1 mã liên tục trong 1 giây (như máy tít siêu thị)
          if (text && text !== lastScanRef.current) {
            lastScanRef.current = text; // Khóa tạm thời mã này
            
            // Kêu Bíp trên điện thoại
            const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
            audio.play().catch(()=>{});
            
            toast.success(`Đã quét: ${text}`);
            
            // Bắn mã vạch lên Mây (Supabase)
            await supabase.from('remote_scans').insert([{ code: text }]);
            
            // Sau 1.5 giây mới cho phép quét LẠI CHÍNH MÃ NÀY (Nếu quét mã KHÁC thì vẫn nhận ngay lập tức)
            setTimeout(() => {
              lastScanRef.current = "";
            }, 1500); 
          }
        }, undefined);
      }
    };

    if (!(window as any).Html5QrcodeScanner) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/html5-qrcode";
      script.onload = loadScanner;
      document.head.appendChild(script);
    } else {
      loadScanner();
    }

    // Chỉ dọn dẹp camera khi tắt hẳn trang web
    return () => { if (scanner) scanner.clear().catch(() => {}); };
  }, []); // <-- Mấu chốt ở đây: Bỏ dependency array để camera không bao giờ bị load lại

  return (
    <div style={{ padding: "20px", textAlign: "center", background: "#0f172a", minHeight: "100vh", color: "#fff", fontFamily: "sans-serif" }}>
      <Toaster position="top-center" />
      <h2 style={{ color: "#38bdf8", marginBottom: "5px", fontSize: "24px" }}>📱 MÁY QUÉT LIÊN TỤC</h2>
      <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "20px", padding: "0 20px" }}>
        Cứ lia camera qua mã vạch liên tục. Máy tính sẽ tự động cộng dồn số lượng! 🚀
      </p>
      <div id="qr-reader-mobile" style={{ width: "100%", maxWidth: "400px", margin: "0 auto", background: "#fff", borderRadius: "16px", overflow: "hidden", border: "4px solid #38bdf8", boxShadow: "0 0 20px rgba(56,189,248,0.3)" }}></div>
      
      <div style={{ marginTop: "30px", fontSize: "12px", color: "#f87171" }}>
        *Lưu ý: Không dùng trình duyệt nội bộ của Zalo. Hãy mở bằng Google Chrome hoặc Safari để quét mượt nhất.
      </div>
    </div>
  );
};
