import React from 'react';
import { cleanName, getActualPrice } from '../../utils/helpers';

interface ProductSearchAndActionsProps {
  role: string;
  barcodeInput: string;
  setBarcodeInput: (val: string) => void;
  showSuggestions: boolean;
  setShowSuggestions: (val: boolean) => void;
  handleBarcodeSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  setScannerMode: (val: 'product' | 'voucher' | 'customer') => void;
  products: any[];
  handleSelectSuggest: (product: any) => void;
  showInputForm: boolean;
  setShowInputForm: (val: boolean) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadSampleCSV: () => void;
}

export const ProductSearchAndActions: React.FC<ProductSearchAndActionsProps> = ({
  role, barcodeInput, setBarcodeInput, showSuggestions, setShowSuggestions,
  handleBarcodeSubmit, setScannerMode, products, handleSelectSuggest,
  showInputForm, setShowInputForm, handleFileUpload, downloadSampleCSV
}) => {
  return (
    <div style={{ display: "flex", gap: "15px", marginBottom: "15px", alignItems: "center" }}>
      <div style={{ position: "relative", flex: 1, display: "flex" }}>
        <input 
          id="search-barcode" 
          placeholder="👉 QUẸT MÃ VẠCH (F1)..." 
          value={barcodeInput} 
          onChange={e => { setBarcodeInput(e.target.value); setShowSuggestions(true) }} 
          onKeyDown={handleBarcodeSubmit} 
          onClick={() => setShowSuggestions(true)} 
          style={{ flex: 1, padding: "10px 15px", borderRadius: "6px 0 0 6px", border: "2px solid #ef4444", fontSize: "14px", fontWeight: "bold", outline: "none", boxSizing: "border-box", color: "#ef4444" }} 
        />
        <button onClick={() => setScannerMode('product')} style={{ padding: "0 15px", background: "#ef4444", border: "none", borderRadius: "0 6px 6px 0", cursor: "pointer", color: "white", fontSize: "18px" }}>📷</button>
        
        {showSuggestions && barcodeInput.trim() !== "" && (
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-glass)", border: "1px solid #ef4444", borderRadius: "6px", marginTop: "4px", zIndex: 100, maxHeight: "250px", overflowY: "auto", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}>
            {products.filter(p => String(cleanName(p.name) || "").toLowerCase().includes(String(barcodeInput || "").toLowerCase()) || String(p.product_code || "").toLowerCase().includes(String(barcodeInput || "").toLowerCase())).slice(0, 10).map((p, idx) => (
              <div key={idx} onClick={() => handleSelectSuggest(p)} style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-glass)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border-glass)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div><div style={{ fontWeight: "bold", color: "var(--text-main)", fontSize: "13px" }}>{cleanName(p.name)}</div><div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Tồn: <b style={{ color: p.stock < 10 ? "#ef4444" : "#10b981" }}>{p.stock}</b></div></div>
                <div style={{ fontWeight: "bold", color: "#ef4444", fontSize: "13px" }}>{getActualPrice(p).toLocaleString()}đ</div>
              </div>
            ))}
            {products.filter(p => String(cleanName(p.name) || "").toLowerCase().includes(String(barcodeInput || "").toLowerCase()) || String(p.product_code || "").toLowerCase().includes(String(barcodeInput || "").toLowerCase())).length === 0 && (<div style={{ padding: "10px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>Không tìm thấy sản phẩm</div>)}
          </div>
        )}
      </div>
      
      {role === 'admin' && (
        <div style={{ display: "flex", gap: "8px" }}>
          <div onClick={() => setShowInputForm(!showInputForm)} style={{ padding: "10px 15px", borderRadius: "6px", fontWeight: "bold", color: "#ef4444", cursor: "pointer", border: "1px dashed #ef4444", fontSize: "12px", display: "flex", alignItems: "center" }}>
            {showInputForm ? "➖ ĐÓNG" : "➕ NHẬP LẺ"}
          </div>
          <label style={{ cursor: "pointer", padding: "10px 15px", borderRadius: "6px", fontWeight: "bold", color: "#10b981", border: "1px dashed #10b981", fontSize: "12px", display: "flex", alignItems: "center" }}>
            📁 TỪ FILE<input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
          <button onClick={downloadSampleCSV} style={{ padding: "10px 15px", borderRadius: "6px", fontWeight: "bold", color: "#3b82f6", cursor: "pointer", border: "1px dashed #3b82f6", fontSize: "12px", display: "flex", alignItems: "center", background: "transparent" }}>
            📥 FILE MẪU
          </button>
        </div>
      )}
    </div>
  );
};
