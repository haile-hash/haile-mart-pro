import React from 'react';
import { Product } from '../../types';
import { cleanName, getActualPrice } from '../../utils/helpers';

export const ProductSearchAndActions: React.FC<any> = ({
  barcodeInput, setBarcodeInput, showSuggestions, setShowSuggestions, setScannerMode, sortedAndFilteredProducts, handleSelectSuggest, setShowInputForm, handleFileUpload, downloadSampleExcel
}) => {
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim() !== '') {
      e.preventDefault(); const matched = sortedAndFilteredProducts.find((p: any) => p.product_code?.toLowerCase() === barcodeInput.trim().toLowerCase());
      if (matched) handleSelectSuggest(matched);
    }
  };

  return (
    <div style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ position: "relative", width: "350px", display: "flex" }}>
        <input placeholder="👉 QUẸT MÃ VẠCH (F1)..." value={barcodeInput || ""} onChange={e => { setBarcodeInput(e.target.value); setShowSuggestions(true); }} onKeyDown={handleBarcodeKeyDown} onClick={() => setShowSuggestions(true)} style={{ flex: 1, padding: "10px 15px", borderRadius: "8px 0 0 8px", border: "2px solid #ef4444", fontSize: "14px", fontWeight: "bold", outline: "none", color: "#ef4444" }} />
        <button onClick={() => setScannerMode?.('product')} style={{ padding: "0 15px", background: "#ef4444", border: "none", borderRadius: "0 8px 8px 0", cursor: "pointer", color: "white", fontSize: "18px" }}>📷</button>
        {showSuggestions && (barcodeInput || "").trim() !== "" && (
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #ef4444", borderRadius: "6px", marginTop: "4px", zIndex: 100, maxHeight: "250px", overflowY: "auto", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}>
            {sortedAndFilteredProducts.filter((p: any) => p.product_code?.toLowerCase().includes(barcodeInput.toLowerCase()) || cleanName(p.name).toLowerCase().includes(barcodeInput.toLowerCase())).slice(0, 10).map((p: any, idx: number) => (
              <div key={idx} onClick={() => handleSelectSuggest(p)} style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "13px" }}>{cleanName(p.name)}</div><div style={{ fontSize: "10px", color: "#64748b" }}>Mã: {p.product_code}</div></div>
                <div style={{ fontWeight: "bold", color: "#ef4444", fontSize: "13px" }}>{getActualPrice(p).toLocaleString()}đ</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={() => setShowInputForm((prev: any) => !prev)} style={{ padding: "10px 16px", borderRadius: "8px", fontWeight: "bold", color: "#ef4444", cursor: "pointer", border: "1px dashed #ef4444", background: 'transparent' }}>➕ NHẬP LẺ / SỬA SP</button>
        <label style={{ cursor: "pointer", padding: "10px 16px", borderRadius: "8px", fontWeight: "bold", color: "#10b981", border: "1px dashed #10b981", background: 'transparent' }}>📁 TỪ EXCEL <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} style={{ display: "none" }} /></label>
        <button onClick={downloadSampleExcel} style={{ padding: "10px 16px", borderRadius: "8px", fontWeight: "bold", color: "#3b82f6", cursor: "pointer", border: "1px dashed #3b82f6", background: "transparent" }}>📥 FILE MẪU</button>
      </div>
    </div>
  );
};
