import React from 'react';

interface ScannerLinkModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
}

export const ScannerLinkModal: React.FC<ScannerLinkModalProps> = ({ showModal, setShowModal }) => {
  if (!showModal) return null;

  const scannerUrl = "https://haile-mart-pro.vercel.app/?scanner=true";
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(scannerUrl)}`;

  return (
    <div 
      className="no-print" 
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10005 }} 
      onClick={() => setShowModal(false)}
    >
      <div 
        className="glass" 
        style={{ padding: "30px", width: "350px", maxWidth: "90vw", textAlign: "center", borderRadius: "24px", background: "#fff", position: "relative" }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: "50px", marginBottom: "10px" }}>📱</div>
        <h2 style={{ color: "#0ea5e9", margin: "0 0 10px 0", fontSize: "22px", fontWeight: "900" }}>KẾT NỐI MÁY QUÊT</h2>
        
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px", lineHeight: "1.5" }}>
          Mở ứng dụng <b>Camera</b> trên điện thoại của bạn và hướng vào mã QR này để tự động kết nối.
        </p>
        
        <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "16px", border: "2px dashed #cbd5e1", display: "inline-block", marginBottom: "20px", maxWidth: "100%", boxSizing: "border-box" }}>
          <img src={qrCodeApiUrl} alt="QR Code Scanner" style={{ width: "100%", maxWidth: "220px", height: "auto", display: "block", margin: "0 auto" }} />
        </div>
        
        <button onClick={() => setShowModal(false)} style={{ width: "100%", padding: "14px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "15px", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#e2e8f0"} onMouseOut={e => e.currentTarget.style.background = "#f1f5f9"}>
          ĐÓNG
        </button>
      </div>
    </div>
  );
};
