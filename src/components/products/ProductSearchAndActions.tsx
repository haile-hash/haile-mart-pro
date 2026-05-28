import React from 'react';
import { cleanName, getActualPrice } from '../../utils/helpers';

// ---- FILE: ProductSearchAndActions.tsx ----
interface ProductSearchAndActionsProps {
  role: string; barcodeInput: string; setBarcodeInput: (val: string) => void;
  showSuggestions: boolean; setShowSuggestions: (val: boolean) => void;
  handleBarcodeSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  setScannerMode: (val: 'product' | 'voucher' | 'customer') => void;
  products: any[]; handleSelectSuggest: (product: any) => void;
  showInputForm: boolean; setShowInputForm: (val: boolean) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadSampleCSV: () => void;
}

export const ProductSearchAndActions: React.FC<ProductSearchAndActionsProps> = ({
  role, barcodeInput, setBarcodeInput, showSuggestions, setShowSuggestions,
  handleBarcodeSubmit, setScannerMode, products = [], handleSelectSuggest,
  showInputForm, setShowInputForm, handleFileUpload, downloadSampleCSV
}) => {
  return (
    <div style={{ display: "flex", gap: "15px", marginBottom: "15px", alignItems: "center" }}>
      <div style={{ position: "relative", flex: 1, display: "flex" }}>
        <input 
          id="search-barcode" placeholder="👉 QUẸT MÃ VẠCH (F1)..." value={barcodeInput || ""} 
          onChange={e => { setBarcodeInput(e.target.value); setShowSuggestions(true) }} 
          onKeyDown={handleBarcodeSubmit} onClick={() => setShowSuggestions(true)} 
          style={{ flex: 1, padding: "10px 15px", borderRadius: "6px 0 0 6px", border: "2px solid #ef4444", fontSize: "14px", fontWeight: "bold", outline: "none", boxSizing: "border-box", color: "#ef4444" }} 
        />
        <button onClick={() => setScannerMode('product')} style={{ padding: "0 15px", background: "#ef4444", border: "none", borderRadius: "0 6px 6px 0", cursor: "pointer", color: "white", fontSize: "18px" }}>📷</button>
        
        {showSuggestions && (barcodeInput||"").trim() !== "" && (
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-glass)", border: "1px solid #ef4444", borderRadius: "6px", marginTop: "4px", zIndex: 100, maxHeight: "250px", overflowY: "auto", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}>
            {(products || []).filter(p => String(cleanName(p?.name) || "").toLowerCase().includes(String(barcodeInput || "").toLowerCase()) || String(p?.product_code || "").toLowerCase().includes(String(barcodeInput || "").toLowerCase())).slice(0, 10).map((p, idx) => (
              <div key={idx} onClick={() => handleSelectSuggest(p)} style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-glass)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border-glass)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div><div style={{ fontWeight: "bold", color: "var(--text-main)", fontSize: "13px" }}>{cleanName(p?.name || "")}</div><div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Tồn: <b style={{ color: p?.stock < 10 ? "#ef4444" : "#10b981" }}>{p?.stock || 0}</b></div></div>
                <div style={{ fontWeight: "bold", color: "#ef4444", fontSize: "13px" }}>{getActualPrice(p).toLocaleString()}đ</div>
              </div>
            ))}
            {(products || []).filter(p => String(cleanName(p?.name) || "").toLowerCase().includes(String(barcodeInput || "").toLowerCase()) || String(p?.product_code || "").toLowerCase().includes(String(barcodeInput || "").toLowerCase())).length === 0 && (<div style={{ padding: "10px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>Không tìm thấy sản phẩm</div>)}
          </div>
        )}
      </div>
      
      {role === 'admin' && (
        <div style={{ display: "flex", gap: "8px" }}>
          <div onClick={() => setShowInputForm(!showInputForm)} style={{ padding: "10px 15px", borderRadius: "6px", fontWeight: "bold", color: "#ef4444", cursor: "pointer", border: "1px dashed #ef4444", fontSize: "12px", display: "flex", alignItems: "center" }}>{showInputForm ? "➖ ĐÓNG" : "➕ NHẬP LẺ"}</div>
          <label style={{ cursor: "pointer", padding: "10px 15px", borderRadius: "6px", fontWeight: "bold", color: "#10b981", border: "1px dashed #10b981", fontSize: "12px", display: "flex", alignItems: "center" }}>📁 TỪ FILE<input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} style={{ display: "none" }} /></label>
          <button onClick={downloadSampleCSV} style={{ padding: "10px 15px", borderRadius: "6px", fontWeight: "bold", color: "#3b82f6", cursor: "pointer", border: "1px dashed #3b82f6", fontSize: "12px", display: "flex", alignItems: "center", background: "transparent" }}>📥 FILE MẪU</button>
        </div>
      )}
    </div>
  );
};

// ---- FILE: ProductInputForm.tsx ----
interface ProductInputFormProps {
  handleAddProduct: (e: React.FormEvent) => void;
  newCode: string; handleCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  newName: string; setNewName: (val: string) => void;
  newCategory: string; setNewCategory: (val: string) => void;
  categories: string[];
  newImportPrice: string; setNewImportPrice: (val: string) => void;
  newPrice: string; setNewPrice: (val: string) => void;
  newPromoPrice: string; setNewPromoPrice: (val: string) => void;
  newExpiry: string; setNewExpiry: (val: string) => void;
  newGiftCondition: string; setNewGiftCondition: (val: string) => void;
  newGiftInfo: string; setNewGiftInfo: (val: string) => void;
  newStock: string; setNewStock: (val: string) => void;
  loading: boolean;
}

export const ProductInputForm: React.FC<ProductInputFormProps> = (props) => {
  return (
    <form onSubmit={props.handleAddProduct} style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "8px", border: "1px solid var(--border-glass)", marginBottom: "15px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">MÃ SẢN PHẨM</span><input placeholder="VD: SP001" value={props.newCode || ""} onChange={props.handleCodeChange} style={{ padding: "8px", borderRadius: "4px" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">TÊN HÀNG HÓA</span><input placeholder="VD: Bia Tiger" value={props.newName || ""} onChange={e => props.setNewName(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">PHÂN LOẠI</span><input list="category-list" placeholder="Chọn / Nhập..." value={props.newCategory || ""} onChange={e => props.setNewCategory(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /><datalist id="category-list">{(props.categories || []).filter(c => c !== 'Tất cả').map(c => <option key={c} value={c} />)}</datalist></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">GIÁ VỐN (Đ)</span><input type="number" placeholder="0" value={props.newImportPrice || ""} onChange={e => props.setNewImportPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">GIÁ BÁN (Đ)</span><input type="number" placeholder="0" value={props.newPrice || ""} onChange={e => props.setNewPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 0.8fr 80px", gap: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label-red">GIÁ KHUYẾN MÃI</span><input type="number" placeholder="0 (Bỏ trống)" value={props.newPromoPrice || ""} onChange={e => props.setNewPromoPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ef4444" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">HẠN SỬ DỤNG</span><input type="date" value={props.newExpiry || ""} onChange={e => props.setNewExpiry(e.target.value)} style={{ padding: "8px", borderRadius: "4px", fontFamily: "sans-serif" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label-green">ĐIỀU KIỆN & QUÀ TẶNG</span><div style={{ display: "flex", gap: "4px" }}><input type="number" placeholder="Từ..." value={props.newGiftCondition || ""} onChange={e => props.setNewGiftCondition(e.target.value)} style={{ width: "45px", padding: "8px", borderRadius: "4px", border: "1px solid #10b981" }} title="Số lượng cần mua" /><input type="text" placeholder="Tên quà..." value={props.newGiftInfo || ""} onChange={e => props.setNewGiftInfo(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #10b981" }} /></div></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">SỐ LƯỢNG NHẬP</span><input type="number" placeholder="0" value={props.newStock || ""} onChange={e => props.setNewStock(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}><button type="submit" disabled={props.loading} style={{ padding: "8px", height: "35px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>LƯU</button></div>
      </div>
    </form>
  );
};
