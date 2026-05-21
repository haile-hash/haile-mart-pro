import React from 'react';

interface ScannerModalProps {
  scannerMode: 'product' | 'voucher' | 'customer' | null;
  setScannerMode: (val: 'product' | 'voucher' | 'customer' | null) => void;
  scanMessage: { text: string, type: 'success' | 'error' } | null;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  scannerMode, setScannerMode, scanMessage
}) => {
  if (scannerMode === null) return null;

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10000 }}>
      <div style={{ background: "#fff", padding: "10px", borderRadius: "12px", width: "90%", maxWidth: "400px", position: "relative" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px 0", textAlign: "center", color: "#b91c1c" }}>
          {scannerMode === 'voucher' ? '📷 Quét mã Voucher' : (scannerMode === 'customer' ? '📷 Quét Thẻ VIP' : '📷 Đưa mã vạch vào khung')}
        </h3>
        
        {scanMessage && (
          <div style={{ position: "absolute", top: "50px", left: "50%", transform: "translateX(-50%)", padding: "8px 16px", background: scanMessage.type === 'success' ? "#10b981" : "#ef4444", color: "#fff", fontWeight: "bold", borderRadius: "20px", zIndex: 10001, boxShadow: "0 4px 6px rgba(0,0,0,0.3)", animation: "float 0.5s ease-out" }}>
            {scanMessage.text}
          </div>
        )}
        
        <div id="qr-reader" style={{ width: "100%" }}></div>
        <button onClick={() => setScannerMode(null)} style={{ width: "100%", padding: "12px", marginTop: "15px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>ĐÓNG CAMERA</button>
      </div>
    </div>
  );
};
