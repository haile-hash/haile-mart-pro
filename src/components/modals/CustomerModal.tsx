import React, { useState, useMemo, useEffect } from 'react';
import { getCustomerTier } from '../../utils/helpers';

interface CustomerModalProps {
  showCustomerModal: boolean;
  setShowCustomerModal: (val: boolean) => void;
  customers: any;
  setCustomers: React.Dispatch<React.SetStateAction<any>>;
  logAudit: (action: string, detail: string, extraData?: any) => void;
  handleEditPhone: (oldPhone: string) => void;
  printCustomerCard: (phone: string) => void;
  sendCardEmail: (phone: string) => void;
  shareToZalo: (phone: string) => void;
  tierConfig: any; // Bổ sung
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  showCustomerModal, setShowCustomerModal, customers, setCustomers,
  logAudit, handleEditPhone, printCustomerCard, sendCardEmail, shareToZalo,
  tierConfig // Nhận từ Props
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    setVisibleCount(30);
  }, [searchTerm]);

  const { visibleCustomers, totalFiltered } = useMemo(() => {
    const safeCustomers = customers || {};
    let filteredKeys = Object.keys(safeCustomers);
    
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filteredKeys = filteredKeys.filter(phone => {
        const c = safeCustomers[phone];
        if (!c) return false;
        const safeName = String(c.name || "").toLowerCase();
        return phone.includes(term) || safeName.includes(term);
      });
    }

    filteredKeys.sort((a, b) => {
      const spentA = Number(safeCustomers[a]?.totalSpent) || 0;
      const spentB = Number(safeCustomers[b]?.totalSpent) || 0;
      return spentB - spentA;
    });

    const total = filteredKeys.length;
    const slicedKeys = filteredKeys.slice(0, visibleCount);

    return { visibleCustomers: slicedKeys, totalFiltered: total };
  }, [customers, searchTerm, visibleCount]);

  if (!showCustomerModal) return null;

  const safeCustomers = customers || {};

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={() => setShowCustomerModal(false)}>
      <div className="glass" style={{ padding: "25px", width: "600px", maxWidth: "95vw", maxHeight: "80vh", display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: "12px" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, color: "#4f46e5", fontSize: "18px" }}>🤝 QUẢN LÝ KHÁCH HÀNG</h2>
          <button onClick={() => setShowCustomerModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b", lineHeight: 1 }}>&times;</button>
        </div>

        <div style={{ marginBottom: "15px", position: "relative" }}>
          <input type="text" placeholder="🔍 Tìm theo Tên hoặc Số điện thoại..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 35px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", boxSizing: "border-box" }} />
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
        </div>

        <div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
          {totalFiltered === 0 && <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "20px", fontStyle: "italic" }}>Không tìm thấy khách hàng nào.</div>}
          
          {visibleCustomers.map(phone => {
            const c = safeCustomers[phone] || {};
            // SỬA: Đưa tierConfig vào hàm để lấy Hạng động
            const tier = getCustomerTier(Number(c.totalSpent) || 0, tierConfig);
            
            return (
              <div key={phone} style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", background: tier.bg, borderRadius: "8px", marginBottom: "8px", border: `1px solid ${tier.border}` }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ fontWeight: "bold", color: "#1e293b", cursor: "pointer", fontSize: "15px" }} onClick={() => { const newName = window.prompt("Sửa tên:", c.name || ""); if (newName) { const newC = { ...c, name: newName.trim() }; setCustomers((prev: any) => ({ ...prev, [phone]: newC })); logAudit("SỬA KH", `Đổi tên KH`) } }} title="Sửa tên">
                      {c.name || "Khách chưa có tên"} ✏️
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: "900", color: tier.color, border: `1px solid ${tier.color}`, padding: "2px 6px", borderRadius: "12px", background: "#fff" }}>{tier.name}</span>
                  </div>
                  
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    <span onClick={() => handleEditPhone(phone)} style={{ cursor: "pointer", fontWeight: "bold" }}>📞 {phone} ✏️</span>
                    <span style={{ cursor: "pointer", color: "#3b82f6", fontWeight: "bold" }} onClick={() => { const newEmail = window.prompt("Sửa Email:", c.email || ""); if (newEmail !== null) { const newC = { ...c, email: newEmail.trim() }; setCustomers((prev: any) => ({ ...prev, [phone]: newC })); logAudit("SỬA EMAIL", `Cập nhật Email KH`) } }}>{c.email ? `📧 ${c.email}` : `📧 +Thêm Mail`}</span>
                  </div>
                  
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "8px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                    <span onClick={() => { const newCard = window.prompt("Mã Thẻ:", c.cardCode || ""); if (newCard !== null) { const newC = { ...c, cardCode: newCard.trim() }; setCustomers((prev: any) => ({ ...prev, [phone]: newC })); logAudit("SỬA MÃ THẺ", `Cập nhật mã thẻ`) } }} style={{ cursor: "pointer", color: "#ea580c", fontWeight: "bold", marginRight: "6px" }}>{c.cardCode ? `💳 Mã: ${c.cardCode}` : `💳 +Gán Mã Thẻ`}</span>
                    <button onClick={() => printCustomerCard(phone)} style={{ padding: "4px 8px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontWeight: "bold" }}>🖨️ In Thẻ</button>
                    <button onClick={() => sendCardEmail(phone)} style={{ padding: "4px 8px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontWeight: "bold" }}>📧 Mail</button>
                    <button onClick={() => shareToZalo(phone)} style={{ padding: "4px 8px", background: "#059669", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontWeight: "bold" }}>💬 Zalo</button>
                  </div>
                </div>
                
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#475569", fontSize: "11px", marginBottom: "4px" }}>Đã chi tiêu: <b style={{ color: "#0f172a", fontSize: "13px" }}>{(Number(c.totalSpent) || 0).toLocaleString()}đ</b></div>
                  <div style={{ color: "#10b981", fontWeight: "bold", fontSize: "12px", marginBottom: "2px" }}>Ví: {(Number(c.wallet) || 0).toLocaleString()}đ</div>
                  <div style={{ color: "#ef4444", fontWeight: "bold", fontSize: "12px" }}>Nợ: {(Number(c.debt) || 0).toLocaleString()}đ</div>
                </div>
              </div>
            )
          })}

          {totalFiltered > visibleCount && (
            <button onClick={() => setVisibleCount(prev => prev + 30)} style={{ width: "100%", padding: "12px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px", color: "#4f46e5", fontWeight: "bold", cursor: "pointer", marginTop: "10px", transition: "all 0.2s" }}>
              ⏬ Tải thêm khách hàng (Còn {totalFiltered - visibleCount} người)
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
