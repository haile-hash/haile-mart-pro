// @ts-nocheck
import React from "react";

export const SupplierModal = ({
  showSupplierModal, setShowSupplierModal,
  supName, setSupName, supPhone, setSupPhone,
  supAddress, setSupAddress, supItem, setSupItem,
  supTaxCode, setSupTaxCode, supBankAccount, setSupBankAccount,    
  addSupplier, suppliers = [], deleteSupplier
}) => {
  if (!showSupplierModal) return null;

  return (
    <div 
      className="no-print" 
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}
      onClick={() => setShowSupplierModal(false)} // FIX UX
    >
      <div 
        className="glass" 
        style={{ padding: "25px", width: "550px", maxWidth: "95vw", maxHeight: "85vh", display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: "12px" }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, color: "#3b82f6", fontSize: "18px" }}>🏭 NHÀ CUNG CẤP</h2>
          <button onClick={() => setShowSupplierModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b", lineHeight: 1 }}>&times;</button>
        </div>
        
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
          <input placeholder="Tên Cty/Sale..." value={supName || ""} onChange={e => setSupName(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
          <input placeholder="SĐT..." value={supPhone || ""} onChange={e => setSupPhone(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
          <input placeholder="Mã số thuế..." value={supTaxCode || ""} onChange={e => setSupTaxCode(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
          <input placeholder="Số tài khoản..." value={supBankAccount || ""} onChange={e => setSupBankAccount(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
          <input placeholder="Địa chỉ..." value={supAddress || ""} onChange={e => setSupAddress(e.target.value)} style={{ flex: 2, padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
          <input placeholder="Mặt hàng..." value={supItem || ""} onChange={e => setSupItem(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
          <button onClick={addSupplier} style={{ width: "100%", padding: "10px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", marginTop: "5px" }}>LƯU THÔNG TIN</button>
        </div>
        
        <div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
          {(suppliers || []).map((s: any) => (
            <div key={s?.id} style={{ padding: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: "8px", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "15px", color: "#0f172a" }}>
                <span>{s?.name}</span> <span style={{ color: "#3b82f6" }}>📞 {s?.phone}</span>
              </div>
              <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}><span>📍 {s?.address || "---"}</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", marginTop: "6px", fontSize: "13px", color: "#475569" }}>
                <span><strong>MST:</strong> {s?.taxCode || s?.tax_code || "---"}</span>
                <span><strong>STK:</strong> {s?.bankAccount || s?.bank_account || "---"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", borderTop: "1px dashed #cbd5e1", paddingTop: "8px" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>📦 {s?.item || "---"}</span> 
                <button onClick={() => s?.id && deleteSupplier(s.id)} style={{ border: "none", background: "#fee2e2", color: "#ef4444", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>🗑️ Xóa</button>
              </div>
            </div>
          ))}
          {(!suppliers || suppliers.length === 0) && (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0", fontStyle: "italic" }}>Chưa có dữ liệu nhà cung cấp</div>
          )}
        </div>
      </div>
    </div>
  );
};
