// @ts-nocheck
import React from "react";

export const HandoverModal = ({ 
  role, 
  shift, 
  startingCash, 
  currentShiftStats, 
  onClose, 
  onConfirm 
}) => {
  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      <div className="glass" style={{ padding: "30px", width: "350px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 15px 0", color: "#ef4444", fontSize: "22px" }}>📋 CHỐT CA</h2>
        <div style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "10px", border: "1px dashed var(--border-glass)", textAlign: "left", fontSize: "14px", lineHeight: "1.8" }}>
          <div>👤 Người trực: <b>{role === 'admin' ? "Quản lý" : "Thu ngân"}</b></div>
          <div>⏰ Ca: <b style={{ color: "#b91c1c" }}>{shift}</b></div>
          <div>💵 Tiền đầu ca: <b style={{ color: "#059669" }}>{startingCash.toLocaleString()}đ</b></div>
          <div style={{ borderTop: "1px solid var(--border-glass)", margin: "10px 0" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>💵 Tổng thu ca:</span><b style={{ color: "#059669", fontSize: "16px" }}>{currentShiftStats.rev.toLocaleString()}đ</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}><span>- Tiền mặt:</span><b>{currentShiftStats.cash.toLocaleString()}đ</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}><span>- Chuyển khoản:</span><b>{currentShiftStats.transfer.toLocaleString()}đ</b></div>
          {role === 'admin' && <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--border-glass)", paddingTop: "8px" }}><span>📈 Lợi nhuận:</span><b style={{ color: "#3b82f6" }}>{currentShiftStats.prof.toLocaleString()}đ</b></div>}
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "var(--border-glass)", fontWeight: "bold", cursor: "pointer", color: "var(--text-main)" }}>Hủy</button>
          <button onClick={onConfirm} style={{ flex: 2, padding: "12px", background: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>✔️ ĐĂNG XUẤT</button>
        </div>
      </div>
    </div>
  );
};
