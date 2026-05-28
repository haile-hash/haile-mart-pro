import React, { useMemo } from 'react';

interface DebtModalProps {
  showDebtModal: boolean;
  setShowDebtModal: (val: boolean) => void;
  customers: any;
  handlePayDebt: (phone: string) => void;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  showDebtModal, setShowDebtModal, customers, handlePayDebt
}) => {
  
  // BỌC GIÁP + TỐI ƯU: Chỉ lọc danh sách nợ đúng 1 lần bằng useMemo để bảo vệ RAM/CPU
  const debtorKeys = useMemo(() => {
    const safeCustomers = customers || {};
    return Object.keys(safeCustomers).filter(phone => {
      const c = safeCustomers[phone];
      return c && (Number(c.debt) || 0) > 0;
    });
  }, [customers]);

  if (!showDebtModal) return null;

  const safeCustomers = customers || {};

  return (
    <div 
      className="no-print" 
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}
      onClick={() => setShowDebtModal(false)} // Cải tiến UX: Click ra ngoài khoảng tối để đóng sổ nợ
    >
      <div 
        className="glass" 
        style={{ padding: "25px", width: "400px", maxWidth: "95vw", maxHeight: "80vh", display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: "12px" }} 
        onClick={e => e.stopPropagation()} // Ngăn chặn đóng modal khi click bên trong cái bảng
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #fed7aa", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, color: "#ef4444", fontSize: "18px", display: "flex", alignItems: "center", gap: "6px" }}>
            📓 SỔ GHI NỢ KHÁCH HÀNG
          </h2>
          <button onClick={() => setShowDebtModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b", lineHeight: 1 }}>&times;</button>
        </div>
        
        <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
          {/* Kiểm tra danh sách an toàn qua biến lưu vết đã tối ưu */}
          {debtorKeys.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "30px", fontStyle: "italic" }}>
              🎉 Hiện tại không có khách hàng nào nợ tiền.
            </div>
          ) : (
            debtorKeys.map(phone => {
              const c = safeCustomers[phone] || {};
              return (
                <div 
                  key={phone} 
                  style={{ padding: "12px 8px", borderBottom: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "14px" }}>{c.name || "Ẩn danh / Chưa đặt tên"}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace", marginTop: "2px" }}>📞 {phone}</div>
                    <div style={{ color: "#ef4444", fontWeight: "900", fontSize: "13px", marginTop: "4px" }}>
                      Nợ: {(Number(c.debt) || 0).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePayDebt(phone)} 
                    style={{ 
                      padding: "8px 14px", background: "#10b981", color: "#fff", 
                      border: "none", borderRadius: "6px", cursor: "pointer", 
                      fontWeight: "bold", fontSize: "12px", boxShadow: "0 2px 4px rgba(16,185,129,0.2)",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={e => e.currentTarget.style.background = "#059669"}
                    onMouseOut={e => e.currentTarget.style.background = "#10b981"}
                  >
                    THU TIỀN
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
