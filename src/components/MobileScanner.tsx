import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'react-hot-toast';

export const MobileScanner = () => {
  const [lastScan, setLastScan] = useState("");

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
            // ĐÂY LÀ DÒNG ÉP DÙNG CAMERA SAU (MÔI TRƯỜNG) 👇
            videoConstraints: { facingMode: "environment" } 
          }, 
          false
        );
        
        scanner.render(async (text: string) => {
          if (text && text !== lastScan) {
            setLastScan(text);
            // Kêu Bíp trên điện thoại
            const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
            audio.play().catch(()=>{});
            
            toast.success(`Đã quét: ${text}`);
            
            // Bắn mã vạch lên Mây (Supabase)
            await supabase.from('remote_scans').insert([{ code: text }]);
            
            // Mở khóa để quét tiếp sau 1.5 giây
            setTimeout(() => setLastScan(""), 1500); 
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

    return () => { if (scanner) scanner.clear().catch(() => {}); };
  }, [lastScan]);

  return (
    <div style={{ padding: "20px", textAlign: "center", background: "#0f172a", minHeight: "100vh", color: "#fff", fontFamily: "sans-serif" }}>
      <Toaster position="top-center" />
      <h2 style={{ color: "#38bdf8", marginBottom: "5px", fontSize: "24px" }}>📱 MÁY QUÉT CẦM TAY</h2>
      <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "20px", padding: "0 20px" }}>
        Hướng camera sau vào mã vạch sản phẩm. Dữ liệu sẽ tự động bắn lên máy tính trong 0.1s 🚀
      </p>
      <div id="qr-reader-mobile" style={{ width: "100%", maxWidth: "400px", margin: "0 auto", background: "#fff", borderRadius: "16px", overflow: "hidden", border: "4px solid #38bdf8", boxShadow: "0 0 20px rgba(56,189,248,0.3)" }}></div>
    </div>
  );
};
