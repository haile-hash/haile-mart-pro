import React from 'react';

interface ScannerModalProps {
  scannerMode: string | null;
  setScannerMode: (val: string | null) => void;
  scanMessage: { text: string; type: 'success' | 'error' } | null;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ scannerMode, setScannerMode, scanMessage }) => {
  if (!scannerMode) return null;

  let title = "Quét mã vạch sản phẩm";
  if (scannerMode === 'customer') title = "Quét thẻ VIP khách hàng";
  if (scannerMode === 'voucher') title = "Quét mã Voucher giảm giá";

  return (
    <div 
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 23, 42, 0.9)", 
        backdropFilter: "blur(4px)",
        display: "flex", justifyContent: "center", alignItems: "center",
        zIndex: 999999 
      }}
      onClick={() => setScannerMode(null)}
    >
      <div 
        style={{
          background: "#fff", width: "500px", maxWidth: "95%",
          borderRadius: "16px", overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{ background: "#ef4444", padding: "16px", textAlign: "center", color: "#fff" }}>
          <h3 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span>📷</span> {title}
          </h3>
        </div>

        {/* KHU VỰC CAMERA */}
        <div style={{ padding: "20px", background: "#f8fafc" }}>
          <div id="qr-reader" style={{ width: "100%", border: "none", borderRadius: "8px", overflow: "hidden" }}></div>
        </div>

        {/* NÚT ĐÓNG */}
        <div style={{ padding: "16px", borderTop: "1px solid #e2e8f0", background: "#fff", textAlign: "center" }}>
          <button
            onClick={() => setScannerMode(null)}
            style={{
              background: "#ef4444", color: "#fff", border: "none",
              padding: "12px 24px", borderRadius: "8px", fontSize: "16px",
              fontWeight: "bold", cursor: "pointer", width: "100%"
            }}
          >
            ĐÓNG CAMERA
          </button>
        </div>

        {/* POPUP BÁO KẾT QUẢ QUÉT */}
        {scanMessage && (
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: scanMessage.type === 'success' ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
            color: "#fff", padding: "20px", borderRadius: "12px",
            fontSize: "18px", fontWeight: "bold", textAlign: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)", zIndex: 10, width: "80%"
          }}>
            {scanMessage.text}
          </div>
        )}
      </div>
    </div>
  );
};
