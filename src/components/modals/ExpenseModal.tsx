// @ts-nocheck
import React from "react";

export const ExpenseModal = ({
  showExpenseModal,
  setShowExpenseModal,
  expName,
  setExpName,
  expAmount,
  setExpAmount,
  expenses = [], 
  addExpense,
  deleteExpense
}) => {
  if (!showExpenseModal) return null;

  return (
    <div 
      className="no-print" 
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}
      onClick={() => setShowExpenseModal(false)}
    >
      <div 
        className="glass" 
        style={{ padding: "25px", width: "450px", maxWidth: "90vw", maxHeight: "80vh", display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: "12px" }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, color: "#ea580c", fontSize: "18px" }}>💸 QUẢN LÝ CHI PHÍ TẠI QUẦY</h2>
          <button onClick={() => setShowExpenseModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b", lineHeight: 1 }}>&times;</button>
        </div>
        
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input 
            placeholder="Nội dung chi (đá, nước...)" 
            value={expName || ""} 
            onChange={e => setExpName(e.target.value)} 
            style={{ flex: 2, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} 
          />
          <input 
            placeholder="Số tiền..." 
            type="number" 
            value={expAmount || ""} 
            onChange={e => setExpAmount(e.target.value)} 
            style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", fontWeight: "bold" }} 
          />
          <button 
            onClick={addExpense} 
            style={{ padding: "8px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 4px rgba(16,185,129,0.2)" }}
          >
            +
          </button>
        </div>
        
        <div style={{ overflowY: "auto", flex: 1, paddingRight: "2px" }}>
          {(!expenses || expenses.length === 0) ? (
            <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "20px", fontStyle: "italic", fontSize: "13px" }}>
              Chưa ghi nhận chi phí nào trong ca.
            </div>
          ) : (
            // SỬA ĐỔI: Bổ sung idx và không dùng Math.random() làm React key
            (expenses || []).map((e: any, idx: number) => (
              <div key={e?.id || `exp-${idx}`} style={{ display: "flex", justifyContent: "space-between", padding: "10px 4px", borderBottom: "1px dashed #cbd5e1", alignItems: "center" }}>
                <div style={{ fontSize: "13px", color: "#334155" }}>
                  <b style={{ color: "#1e293b" }}>{e?.name || "Chi phí không rõ"}</b>{" "}
                  <span style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace" }}>({e?.date || "---"})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <b style={{ color: "#ef4444", fontSize: "14px" }}>
                    -{ (Number(e?.amount) || 0).toLocaleString('vi-VN') }đ
                  </b>
                  <button 
                    onClick={() => e?.id && deleteExpense(e.id)} 
                    style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px", padding: "4px" }}
                    title="Xóa dòng chi này"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
