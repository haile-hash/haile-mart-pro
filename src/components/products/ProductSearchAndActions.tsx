import React from 'react';
import { Product } from '../../types';
import { cleanName, getActualPrice } from '../../utils/helpers';

interface ProductSearchAndActionsProps {
  role?: string; // Dùng để ẩn/hiện nút Nhập hàng của Admin
  
  // Quản lý Barcode
  barcodeInput: string; 
  setBarcodeInput: (val: string) => void;
  showSuggestions: boolean; 
  setShowSuggestions: (val: boolean) => void;
  setScannerMode?: (val: 'product' | 'voucher' | 'customer' | null) => void;
  
  // Quản lý Tìm kiếm & Lọc (Đã khôi phục)
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  categories: string[];
  
  // Dữ liệu và Action
  sortedAndFilteredProducts: Product[]; 
  handleSelectSuggest: (product: Product) => void;
  
  // Nút chức năng Admin
  setShowInputForm: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadSampleExcel: () => void;
}

export const ProductSearchAndActions: React.FC<ProductSearchAndActionsProps> = ({
  role = 'admin', // Tạm set admin nếu App.tsx quên truyền
  barcodeInput, setBarcodeInput, 
  showSuggestions, setShowSuggestions,
  setScannerMode,
  searchTerm, setSearchTerm,
  selectedCategory, setSelectedCategory, categories,
  sortedAndFilteredProducts, handleSelectSuggest,
  setShowInputForm, handleFileUpload, downloadSampleExcel
}) => {

  // Xử lý khi quét mã vạch cứng (Máy quét auto ấn Enter)
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim() !== '') {
      e.preventDefault();
      // Tìm sản phẩm khớp mã vạch nhất
      const matched = sortedAndFilteredProducts.find(
        p => p.product_code?.toLowerCase() === barcodeInput.trim().toLowerCase()
      );
      if (matched) {
        handleSelectSuggest(matched);
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
      
      {/* HÀNG 1: QUÉT MÃ, TÌM KIẾM VÀ BỘ LỌC DANH MỤC */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        
        {/* 1. Ô Quét mã vạch */}
        <div style={{ position: "relative", width: "300px", display: "flex" }}>
          <input 
            id="search-barcode" 
            placeholder="👉 QUẸT MÃ VẠCH (F1)..." 
            value={barcodeInput || ""} 
            onChange={e => { setBarcodeInput(e.target.value); setShowSuggestions(true); }} 
            onKeyDown={handleBarcodeKeyDown} 
            onClick={() => setShowSuggestions(true)} 
            style={{ flex: 1, padding: "10px 15px", borderRadius: "6px 0 0 6px", border: "2px solid #ef4444", fontSize: "14px", fontWeight: "bold", outline: "none", boxSizing: "border-box", color: "#ef4444" }} 
          />
          <button 
            onClick={() => setScannerMode?.('product')} 
            title="Dùng Camera điện thoại quét mã"
            style={{ padding: "0 15px", background: "#ef4444", border: "none", borderRadius: "0 6px 6px 0", cursor: "pointer", color: "white", fontSize: "18px" }}
          >
            📷
          </button>
          
          {/* Gợi ý khi gõ mã vạch */}
          {showSuggestions && (barcodeInput || "").trim() !== "" && (
            <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-glass)", border: "1px solid #ef4444", borderRadius: "6px", marginTop: "4px", zIndex: 100, maxHeight: "250px", overflowY: "auto", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}>
              {sortedAndFilteredProducts
                .filter(p => p.product_code?.toLowerCase().includes(barcodeInput.toLowerCase()) || cleanName(p.name).toLowerCase().includes(barcodeInput.toLowerCase()))
                .slice(0, 10)
                .map((p, idx) => (
                <div key={idx} onClick={() => handleSelectSuggest(p)} style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-glass)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "bold", color: "var(--text-main)", fontSize: "13px" }}>{cleanName(p.name)}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Mã: {p.product_code} | Tồn: <b style={{ color: p.stock < 10 ? "#ef4444" : "#10b981" }}>{p.stock}</b></div>
                  </div>
                  <div style={{ fontWeight: "bold", color: "#ef4444", fontSize: "13px" }}>{getActualPrice(p).toLocaleString()}đ</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Ô Tìm kiếm tên sản phẩm */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <input 
            placeholder="🔍 Tìm tên sản phẩm..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={{ width: "100%", padding: "11px 15px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box" }} 
          />
        </div>

        {/* 3. Lọc theo Danh mục */}
        <select 
          value={selectedCategory} 
          onChange={e => setSelectedCategory(e.target.value)} 
          style={{ padding: "11px 15px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", cursor: "pointer", minWidth: "150px" }}
        >
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      {/* HÀNG 2: NÚT CHỨC NĂNG CỦA ADMIN */}
      {role === 'admin' && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button 
            onClick={() => setShowInputForm(prev => !prev)} 
            style={{ padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", color: "#ef4444", cursor: "pointer", border: "1px dashed #ef4444", fontSize: "13px", background: 'transparent' }}
          >
            ➕ NHẬP LẺ / SỬA SP
          </button>
          
          <label style={{ cursor: "pointer", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", color: "#10b981", border: "1px dashed #10b981", fontSize: "13px", background: 'transparent' }}>
            📁 NHẬP TỪ EXCEL
            <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
          
          <button 
            onClick={downloadSampleExcel} 
            style={{ padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", color: "#3b82f6", cursor: "pointer", border: "1px dashed #3b82f6", fontSize: "13px", background: "transparent" }}
          >
            📥 TẢI FILE MẪU
          </button>
        </div>
      )}
    </div>
  );
};
