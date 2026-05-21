import React from 'react';
import { cleanName } from '../../utils/helpers';

interface InventoryModalProps {
  showInventoryModal: boolean; setShowInventoryModal: (val: boolean) => void;
  inventorySearchTerm: string; setInventorySearchTerm: (val: string) => void;
  handleInventorySearchEnter: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  invFilter: string; setInvFilter: (val: string) => void;
  exportInventoryCSV: () => void; handleImportInventoryCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  products: any[]; actualStockInput: Record<string, number>;
  setActualStockInput: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleInvInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  syncInventoryCheck: () => void; loading: boolean;
}

export const InventoryModal: React.FC<InventoryModalProps> = (props) => {
  if (!props.showInventoryModal) return null;
  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      <div className="glass" style={{ padding: "25px", width: "900px", maxWidth: "95vw", maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, color: "#10b981" }}>📦 KIỂM KHO (INVENTORY CHECK)</h2>
          <button onClick={() => props.setShowInventoryModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
        </div>
        <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "8px", fontSize: "12px", color: "#b91c1c", marginBottom: "10px", border: "1px dashed #fca5a5" }}>
          <b>Hướng dẫn:</b> Quẹt mã vạch ➡️ Gõ số lượng ➡️ Bấm Enter. Hoặc dùng tính năng <b>Xuất/Nhập Excel</b>.
        </div>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 300px", display: "flex" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>🔍</span>
            <input id="inv-search-box" placeholder="Tìm tên hoặc Quẹt mã vạch..." value={props.inventorySearchTerm} onChange={e => props.setInventorySearchTerm(e.target.value)} onKeyDown={props.handleInventorySearchEnter} autoFocus style={{ flex: 1, padding: "10px 15px 10px 35px", borderRadius: "8px", border: "2px solid #10b981", outline: "none", fontWeight: "bold", fontSize: "14px" }} />
          </div>
          <div style={{ display: "flex", gap: "5px", background: "var(--bg-input)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
            <button onClick={() => props.setInvFilter("ALL")} style={{ padding: "8px 12px", background: props.invFilter === "ALL" ? "#3b82f6" : "transparent", color: props.invFilter === "ALL" ? "#fff" : "var(--text-main)", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", transition: "0.2s" }}>📋 Tất cả SP</button>
            <button onClick={() => props.setInvFilter("DIFF")} style={{ padding: "8px 12px", background: props.invFilter === "DIFF" ? "#ef4444" : "transparent", color: props.invFilter === "DIFF" ? "#fff" : "var(--text-main)", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", transition: "0.2s" }}>⚠️ Đang lệch</button>
            <button onClick={() => props.setInvFilter("MATCH")} style={{ padding: "8px 12px", background: props.invFilter === "MATCH" ? "#10b981" : "transparent", color: props.invFilter === "MATCH" ? "#fff" : "var(--text-main)", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", transition: "0.2s" }}>✅ Đã khớp</button>
          </div>
          <button onClick={props.exportInventoryCSV} style={{ padding: "10px 15px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>📥 Xuất File</button>
          <label style={{ padding: "10px 15px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>📤 Nhập File<input type="file" accept=".csv, .xlsx, .xls" onChange={props.handleImportInventoryCSV} style={{ display: "none" }} /></label>
        </div>
        
        <div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)", textAlign: "left", position: "sticky", top: 0, background: "var(--bg-glass)", zIndex: 1 }}>
                <th style={{ padding: "8px" }}>Sản phẩm</th><th style={{ padding: "8px", textAlign: "center" }}>Kho PM</th><th style={{ padding: "8px", textAlign: "center" }}>Thực tế</th><th style={{ padding: "8px", textAlign: "center" }}>Chênh lệch</th>
              </tr>
            </thead>
            <tbody>
              {props.products.filter((p: any) => { 
                const safeName = String(cleanName(p.name) || "").toLowerCase(); const safeCode = String(p.product_code || "").toLowerCase(); const term = String(props.inventorySearchTerm || "").toLowerCase(); const matchSearch = safeName.includes(term) || safeCode.includes(term); const actual = props.actualStockInput[p.id] !== undefined ? props.actualStockInput[p.id] : (Number(p.stock) || 0); const diff = actual - (Number(p.stock) || 0); 
                if (props.invFilter === 'DIFF') return matchSearch && diff !== 0; 
                if (props.invFilter === 'MATCH') return matchSearch && diff === 0; 
                return matchSearch; 
              }).map((p: any) => { 
                const actual = props.actualStockInput[p.id] !== undefined ? props.actualStockInput[p.id] : p.stock; const diff = actual - p.stock; 
                return (
                  <tr key={p.id} style={{ borderBottom: "1px dashed var(--border-glass)", background: diff !== 0 ? "rgba(250, 204, 21, 0.1)" : "transparent" }}>
                    <td style={{ padding: "8px", fontWeight: "bold" }}>{cleanName(p.name)} <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "normal" }}>{p.product_code}</div></td>
                    <td style={{ padding: "8px", textAlign: "center", color: "#3b82f6", fontWeight: "bold", fontSize: "15px" }}>{p.stock}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}><input id={`inv-input-${p.id}`} type="number" value={actual} onChange={(e) => props.setActualStockInput(prev => ({...prev, [p.id]: Number(e.target.value)}))} onKeyDown={props.handleInvInputKeyDown} style={{ width: "70px", padding: "8px", borderRadius: "6px", textAlign: "center", border: "2px solid #fdba74", fontWeight: "bold", outline: "none", fontSize: "14px" }} onFocus={e => { e.target.select(); e.target.style.borderColor = "#10b981"; }} onBlur={e => e.target.style.borderColor = "#fdba74"} /></td>
                    <td style={{ padding: "8px", textAlign: "center", fontWeight: "900", fontSize: "15px", color: diff > 0 ? "#10b981" : (diff < 0 ? "#ef4444" : "var(--text-muted)") }}>{diff > 0 ? `+${diff}` : diff}</td>
                  </tr>
                ) 
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "15px", borderTop: "1px dashed var(--border-glass)", paddingTop: "15px" }}>
          <button onClick={() => { props.setActualStockInput({}); props.setInventorySearchTerm(""); props.setInvFilter("ALL"); }} style={{ flex: 1, padding: "12px", background: "var(--border-glass)", color: "var(--text-main)", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>↺ Hủy thao tác</button>
          <button onClick={props.syncInventoryCheck} disabled={props.loading || Object.keys(props.actualStockInput).length === 0} style={{ flex: 2, padding: "12px", background: Object.keys(props.actualStockInput).length === 0 ? "var(--border-glass)" : "#10b981", color: Object.keys(props.actualStockInput).length === 0 ? "var(--text-muted)" : "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: Object.keys(props.actualStockInput).length === 0 ? "not-allowed" : "pointer" }}>{props.loading ? "Đang đồng bộ..." : "💾 CẬP NHẬT CHÊNH LỆCH VÀO SỔ"}</button>
        </div>
      </div>
    </div>
  );
};
