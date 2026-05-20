// @ts-nocheck
import React from "react";

export const ExpenseModal = ({
  showExpenseModal,
  setShowExpenseModal,
  expName,
  setExpName,
  expAmount,
  setExpAmount,
  expenses,
  addExpense,
  deleteExpense
}) => {
  // Nếu biến showExpenseModal là false, không hiển thị gì cả
  if (!showExpenseModal) return null;

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      <div className="glass" style={{ padding: "25px", width: "450px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, color: "#ea580c" }}>💸 QUẢN LÝ CHI PHÍ</h2>
          <button onClick={() => setShowExpenseModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
        </div>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input placeholder="Tên (Điện, nước...)" value={expName} onChange={e => setExpName(e.target.value)} style={{ flex: 2, padding: "8px", borderRadius: "6px" }} />
          <input placeholder="Số tiền..." type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "6px" }} />
          <button onClick={addExpense} style={{ padding: "8px 15px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>+</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {expenses.map((e: any) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px dashed var(--border-glass)" }}>
              <div><b>{e.name}</b> <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>({e.date})</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><b style={{ color: "#ef4444" }}>-{e.amount.toLocaleString()}đ</b><button onClick={() => deleteExpense(e.id)} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer" }}>🗑️</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
