/* eslint-disable */
// @ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';
import { cleanName } from '../../utils/helpers';

interface InventoryModalProps {
  showInventoryModal: boolean; 
  setShowInventoryModal: (val: boolean) => void;
  inventorySearchTerm: string; 
  setInventorySearchTerm: (val: string) => void;
  handleInventorySearchEnter: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  invFilter: string; 
  setInvFilter: (val: string) => void;
  exportInventoryCSV: () => void; 
  handleImportInventoryCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  products: any[]; 
  actualStockInput: Record<string, number>;
  setActualStockInput: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleInvInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  syncInventoryCheck: () => void; 
  loading: boolean;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  showInventoryModal, setShowInventoryModal, inventorySearchTerm, setInventorySearchTerm,
  handleInventorySearchEnter, invFilter, setInvFilter, exportInventoryCSV,
  handleImportInventoryCSV, products = [], actualStockInput = {}, setActualStockInput,
  handleInvInputKeyDown, syncInventoryCheck, loading
}) => {
  
  // THÊM MỚI: State quản lý số lượng hiển thị (Phân trang bảo vệ RAM)
  const [visibleCount, setVisibleCount] = useState(50);

  // THÊM MỚI: Reset lại số lượng khi người dùng gõ tìm kiếm hoặc đổi bộ lọc
  useEffect(() => {
    setVisibleCount(50);
  }, [inventorySearchTerm, invFilter]);

  if (!showInventoryModal) return null;

  const filteredProductsList = useMemo(() => {
    const term = String(inventorySearchTerm || "").toLowerCase().trim();
    const safeProducts = products || [];

    return safeProducts.filter((p: any) => {
      if (!p) return false;
      const safeName = String(cleanName(p.name) || "").toLowerCase();
      const safeCode = String(p.product_code || "").toLowerCase();
      const matchSearch = safeName.includes(term) || safeCode.includes(term);
      
      const actual = actualStockInput[p.id] !== undefined ? actualStockInput[p.id] : (Number(p.stock) || 0);
      const diff = actual - (Number(p.stock) || 0);

      if (invFilter === 'DIFF') return matchSearch && diff !== 0;
      if (invFilter === 'MATCH') return matchSearch && diff === 0;
      return matchSearch;
    });
  }, [products, inventorySearchTerm, invFilter, actualStockInput]);

  return (
    <div className="no-print" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={() => setShowInventoryModal(false)}>
      <div className="glass" style={{ padding: "25px", width: "900px", maxWidth: "95vw", maxHeight: "85vh", display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: "12px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, color: "#10b981", fontSize: "20px", fontWeight: "800" }}>📦 KIỂM KHO THỰC TẾ (INVENTORY)</h2>
          <button onClick={() => setShowInventoryModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b", lineHeight: 1 }}>&times;</button>
        </div>
        
        <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "8px", fontSize: "12px", color: "#b91c1c", marginBottom: "15px", border: "1px dashed #fca5a5" }}>
          <b>Hướng dẫn:</b> Quẹt mã vạch sản phẩm ➡️ Gõ số lượng đếm thực tế ➡️ Bấm Enter. Hoặc dùng tính năng xử lý nhanh bằng <b>Xuất/Nhập Excel</b>.
        </div>
        
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 300px", display: "flex" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
            <input id="inv-search-box" placeholder="Tìm tên hoặc Quẹt mã vạch sản phẩm..." value={inventorySearchTerm || ""} onChange={e => setInventorySearchTerm(e.target.value)} onKeyDown={handleInventorySearchEnter} autoFocus style={{ flex: 1, padding: "10px 15px 10px 35px", borderRadius: "8px", border: "2px solid #10b981", outline: "none", fontWeight: "bold", fontSize: "14px" }} />
          </div>
          <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", padding: "4px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
            <button type="button" onClick={() => setInvFilter("ALL")} style={{ padding: "8px 12px", background: invFilter === "ALL" ? "#3b82f6" : "transparent", color: invFilter === "ALL" ? "#fff" : "#475569", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>📋 Tất cả SP</button>
            <button type="button" onClick={() => setInvFilter("DIFF")} style={{ padding: "8px 12px", background: invFilter === "DIFF" ? "#ef4444" : "transparent", color: invFilter === "DIFF" ? "#fff" : "#475569", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>⚠️ Đang lệch</button>
            <button type="button" onClick={() => setInvFilter("MATCH")} style={{ padding: "8px 12px", background: invFilter === "MATCH" ? "#10b981" : "transparent", color: invFilter === "MATCH" ? "#fff" : "#475569", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>✅ Đã khớp</button>
          </div>
          <button type="button" onClick={exportInventoryCSV} style={{ padding: "10px 15px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>📥 Xuất File</button>
          <label style={{ padding: "10px 15px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>📥 Nhập File<input type="file" accept=".csv, .xlsx, .xls" onChange={handleImportInventoryCSV} style={{ display: "none" }} /></label>
        </div>
        
        <div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #cbd5e1", color: "#475569", textAlign: "left", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                <th style={{ padding: "10px 8px" }}>Sản phẩm</th>
                <th style={{ padding: "10px 8px", textAlign: "center" }}>Kho PM</th>
                <th style={{ padding: "10px 8px", textAlign: "center" }}>Thực tế</th>
                <th style={{ padding: "10px 8px", textAlign: "center" }}>Chênh lệch</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductsList.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontStyle: "italic" }}>Không có dữ liệu kho phù hợp bộ lọc</td></tr>
              ) : (
                // SỬA ĐỔI: Thêm .slice(0, visibleCount) để chỉ render số lượng giới hạn
                filteredProductsList.slice(0, visibleCount).map((p: any) => { 
                  const sysStock = Number(p.stock) || 0;
                  const actual = actualStockInput[p.id] !== undefined ? actualStockInput[p.id] : sysStock; 
                  const diff = actual - sysStock; 
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0", background: diff !== 0 ? "rgba(250, 204, 21, 0.08)" : "transparent" }}>
                      <td style={{ padding: "10px 8px", fontWeight: "bold" }}>
                        {cleanName(p.name)} 
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "normal", fontFamily: "monospace", marginTop: "2px" }}>{p.product_code}</div>
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "center", color: "#3b82f6", fontWeight: "bold", fontSize: "15px" }}>{sysStock}</td>
                      <td style={{ padding: "10px 8px", textAlign: "center" }}>
                        <input id={`inv-input-${p.id}`} type="number" min="0" value={actual} onChange={(e) => setActualStockInput(prev => ({...prev, [p.id]: Math.max(0, parseInt(e.target.value) || 0)}))} onKeyDown={handleInvInputKeyDown} style={{ width: "70px", padding: "6px", borderRadius: "6px", textAlign: "center", border: "2px solid #fdba74", fontWeight: "bold", outline: "none", fontSize: "14px" }} onFocus={e => { e.target.select(); e.target.style.borderColor = "#10b981"; }} onBlur={e => e.target.style.borderColor = "#fdba74"} />
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: "900", fontSize: "15px", color: diff > 0 ? "#10b981" : (diff < 0 ? "#ef4444" : "#64748b") }}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                    </tr>
                  ) 
                })
              )}
            </tbody>
          </table>
          
          {/* THÊM MỚI: Nút tải thêm nếu mảng dữ liệu dài hơn số lượng đang hiển thị */}
          {filteredProductsList.length > visibleCount && (
            <button 
              type="button" 
              onClick={() => setVisibleCount(prev => prev + 50)} 
              style={{ width: "100%", padding: "12px", marginTop: "15px", background: "#f8fafc", color: "#3b82f6", border: "1px dashed #cbd5e1", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}
              onMouseOver={e => e.currentTarget.style.background = "#f1f5f9"}
              onMouseOut={e => e.currentTarget.style.background = "#f8fafc"}
            >
              ⏬ Tải thêm sản phẩm (Còn {filteredProductsList.length - visibleCount} mã)
            </button>
          )}
        </div>
        
        <div style={{ display: "flex", gap: "10px", marginTop: "15px", borderTop: "1px dashed #cbd5e1", paddingTop: "15px" }}>
          <button type="button" onClick={() => { setActualStockInput({}); setInventorySearchTerm(""); setInvFilter("ALL"); }} style={{ flex: 1, padding: "12px", background: "#e2e8f0", color: "#475569", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>↺ Hủy thao tác</button>
          <button type="button" onClick={syncInventoryCheck} disabled={loading || Object.keys(actualStockInput).length === 0} style={{ flex: 2, padding: "12px", background: Object.keys(actualStockInput).length === 0 ? "#cbd5e1" : "#10b981", color: Object.keys(actualStockInput).length === 0 ? "#64748b" : "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: Object.keys(actualStockInput).length === 0 ? "not-allowed" : "pointer" }}>
            {loading ? "Đang đồng bộ..." : "💾 CẬP NHẬT CHÊNH LỆCH VÀO SỔ"}
          </button>
        </div>
      </div>
    </div>
  );
};
