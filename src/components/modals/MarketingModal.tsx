// @ts-nocheck
import React from "react";

export const MarketingModal = ({
  showMarketingModal, setShowMarketingModal,
  marketingTier, setMarketingTier,
  marketingMsg, setMarketingMsg,
  sendMarketingEmails, loading
}) => {
  if (!showMarketingModal) return null;

  return (
    <div 
      className="no-print" 
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}
      onClick={() => setShowMarketingModal(false)} // Cải tiến UX: Đóng nhanh khi bấm ra nền tối
    >
      <div 
        className="glass" 
        style={{ padding: "25px", width: "450px", maxWidth: "90vw", background: "#ffffff", borderRadius: "12px", display: "flex", flexDirection: "column" }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, color: "#8b5cf6", fontSize: "18px", fontWeight: "bold" }}>📢 GỬI EMAIL MARKETING CHIẾN DỊCH</h2>
          <button onClick={() => setShowMarketingModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b", lineHeight: 1 }}>&times;</button>
        </div>
        
        <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "8px", fontSize: "12px", color: "#b91c1c", marginBottom: "15px", border: "1px dashed #ef4444", lineHeight: "1.4" }}>
          <b>⚠️ Cảnh báo hệ thống:</b> Giới hạn tài khoản miễn phí là 200 mail/tháng. Chỉ nên tập trung dùng cho tệp khách hàng hạng <b>Kim Cương / Vàng</b> để tối ưu hóa hiệu quả.
        </div>
        
        <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", display: "block", marginBottom: "4px" }}>Chọn nhóm phân hạng KH:</label>
        <select value={marketingTier || "Tất cả"} onChange={e => setMarketingTier(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", marginBottom: "15px", background: "#fff" }}>
          <option value="Tất cả">Tất cả khách hàng VIP</option>
          <option value="KIM CƯƠNG">Hạng Kim Cương</option>
          <option value="VÀNG">Hạng Vàng</option>
          <option value="BẠC">Hạng Bạc</option>
        </select>
        
        <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", display: "block", marginBottom: "4px" }}>Nội dung chiến dịch nhắn gửi:</label>
        <textarea value={marketingMsg || ""} onChange={e => setMarketingMsg(e.target.value)} rows={5} placeholder="Ví dụ: Tri ân khách hàng VIP Hải Lê Mart, gửi tặng bạn mã giảm giá độc quyền VIP200K cho hóa đơn mua sắm tiếp theo..." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", marginBottom: "20px", boxSizing: "border-box", fontFamily: "inherit", fontSize: "14px", resize: "none" }}></textarea>
        
        <button onClick={sendMarketingEmails} disabled={loading || !marketingMsg?.trim()} style={{ width: "100%", padding: "14px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: (loading || !marketingMsg?.trim()) ? "not-allowed" : "pointer", fontSize: "16px", boxShadow: "0 4px 6px rgba(139,92,246,0.2)", opacity: (!marketingMsg?.trim()) ? 0.6 : 1 }}>
          {loading ? "ĐANG GỬI THƯ..." : "🚀 PHÁT ĐỘNG CHIẾN DỊCH"}
        </button>
      </div>
    </div>
  );
};
