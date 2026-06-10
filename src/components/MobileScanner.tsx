/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'react-hot-toast';

export const MobileScanner = () => {
  const lastScanRef = useRef<string>("");

  useEffect(() => {
    let scanner: any;
    const loadScanner = () => {
      if ((window as any).Html5QrcodeScanner) {
        scanner = new (window as any).Html5QrcodeScanner("qr-reader-mobile", { 
          // 1. TĂNG GẤP ĐÔI TỐC ĐỘ LẤY MẪU (FPS)
          fps: 30, 
          
          // 2. TỐI ƯU VÙNG QUÉT CHO MÃ VẠCH 1D (Dài ngang)
          qrbox: { width: 250, height: 120 }, 
          
          rememberLastUsedCamera: true, 
          
          // 3. ÉP PHẦN CỨNG CAMERA CHẠY HẾT CÔNG SUẤT (HD/FULL HD + LẤY NÉT LIÊN TỤC)
          videoConstraints: { 
            facingMode: "environment",
            width: { min: 1280, ideal: 1920 },
            height: { min: 720, ideal: 1080 },
            advanced: [{ focusMode: "continuous" }]
          } 
        }, false);

        scanner.render(async (text: string) => {
          if (text && text !== lastScanRef.current) {
            lastScanRef.current = text; 
            const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
            audio.play().catch(()=>{}); 
            toast.success(`Đã quét: ${text}`);
            await supabase.from('remote_scans').insert([{ code: text }]);
            
            // Giảm độ trễ reset để có thể quét mã tiếp theo nhanh hơn
            setTimeout(() => { lastScanRef.current = ""; }, 300); 
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
  }, []);

  return (
    <div style={{ padding: "20px", textAlign: "center", background: "#0f172a", minHeight: "100vh", color: "#fff", fontFamily: "sans-serif" }}>
      <Toaster position="top-center" />
      <h2 style={{ color: "#38bdf8", marginBottom: "5px", fontSize: "24px", fontWeight: "800" }}>📱 MÁY QUÉT ĐỘNG CƠ TURBO</h2>
      <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "20px", padding: "0 20px" }}>Đã bật chế độ phân giải cao và lấy nét tự động. 🚀</p>
      
      {/* Container của camera */}
      <div 
        id="qr-reader-mobile" 
        style={{ 
          width: "100%", 
          maxWidth: "400px", 
          margin: "0 auto", 
          background: "#fff", 
          borderRadius: "16px", 
          overflow: "hidden", 
          border: "4px solid #38bdf8", 
          boxShadow: "0 0 25px rgba(56,189,248,0.4)" 
        }}
      ></div>
    </div>
  );
};
