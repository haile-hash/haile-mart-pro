import React, { useEffect } from 'react';
import { Product } from '../../types';

interface ScannerModalProps {
  product: Product | null;
  barcodeCount: number;
  setBarcodeCount: (val: number) => void;
  onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  product,
  barcodeCount,
  setBarcodeCount,
  onClose
}) => {
  if (!product) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      <div style={{ background: "white", padding: "24px", borderRadius: "12px", width: "400px", textAlign: "center" }}>
        <h3 style={{ marginTop: 0, color: "#3b82f6" }}>🖨️ IN TEM MÃ VẠCH (BARCODE)</h3>
        
        <p style={{ fontWeight: "bold", fontSize: "16px", margin: "10px 0" }}>{product.name}</p>
        <p style={{ color: "#64748b", margin: "0 0 20px 0" }}>Mã SP: {product.product_code}</p>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Số lượng tem muốn in (Mặc định in vừa giấy A4):</label>
          <input 
            type="number" 
            min="1" 
            max="150" 
            value={barcodeCount} 
            onChange={(e) => setBarcodeCount(Number(e.target.value) || 1)} 
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", textAlign: "center", fontSize: "18px", fontWeight: "bold" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", background: "#f1f5f9", fontWeight: "bold" }}>
            Hủy
          </button>
          <button onClick={() => { setTimeout(() => window.print(), 500); }} style={{ flex: 2, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", background: "#3b82f6", color: "white", fontWeight: "bold" }}>
            🖨️ XUẤT LỆNH IN
          </button>
        </div>
      </div>
    </div>
  );
};
