// @ts-nocheck
import React from "react";

export const HandoverModal = ({ 
  role, 
  shift, 
  startingCash = 5000000, 
  currentShiftStats, 
  onClose, 
  onConfirm 
}) => {
  
  // BỌC GIÁP: Phòng thủ dữ liệu thống kê rỗng
  const safeStartingCash = Number(startingCash || 0);
  const safeRev = Number(currentShiftStats?.rev || 0);
  const safeCash = Number(currentShiftStats?.cash || 0);
  const safeTransfer = Number(currentShiftStats?.transfer || 0);
  const safeProf = Number(currentShiftStats?.prof || 0);

  return (
    <div className="no-print" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      <div className="glass" style={{ padding: "30px", width: "350px", maxWidth: "90vw", textAlign: "center", background: "#ffffff", borderRadius: "16px" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 15px 0", color: "#ef4444", fontSize: "22px", fontWeight: "900" }}>📋 CHỐT CA BÁN HÀNG</h2>
        
        <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px dashed #cbd5e1", textAlign: "left", fontSize: "14px", lineHeight: "1.8" }}>
          <div>👤 Người trực: <b>{role === 'admin' ? "Quản lý" : "Thu ngân"}</b></div>
          <div>⏰ Ca làm việc: <b style={{ color: "#b91c1c" }}>{shift || "Chưa rõ"}</b></div>
          <div>💵 Tiền mặt đầu ca: <b style={{ color: "#059669" }}>{safeStartingCash.toLocaleString('vi-VN')}đ</b></div>
          <div style={{ borderTop: "1px solid #e2e8f0", margin: "10px 0" }}></div>
          
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>💵 Tổng thu ca:</span>
            <b style={{ color: "#059669", fontSize: "16px" }}>{safeRev.toLocaleString('vi-VN')}đ</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
            <span>- Tiền mặt:</span>
            <b>{safeCash.toLocaleString('vi-VN')}đ</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
            <span>- Chuyển khoản:</span>
            <b>{safeTransfer.toLocaleString('vi-VN')}đ</b>
          </div>
          
          {role === 'admin' && (
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #cbd5e1", paddingTop: "8px" }}>
              <span>📈 Lợi nhuận:</span>
              <b style={{ color: "#3b82f6" }}>{safeProf.toLocaleString('vi-VN')}đ</b>
            </div>
          )}
        </div>
        
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#e2e8f0", fontWeight: "bold", cursor: "pointer", color: "#475569" }}>Hủy</button>
          <button onClick={onConfirm} style={{ flex: 2, padding: "12px", background: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>✔️ ĐĂNG XUẤT</button>
        </div>
      </div>
    </div>
  );
};
