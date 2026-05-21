import React from 'react';

interface DebtModalProps {
  showDebtModal: boolean;
  setShowDebtModal: (val: boolean) => void;
  customers: any;
  handlePayDebt: (phone: string) => void;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  showDebtModal, setShowDebtModal, customers, handlePayDebt
}) => {
  if (!showDebtModal) return null;

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      <div className="glass" style={{ padding: "25px", width: "400px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #fed7aa", paddingBottom: "10px", marginBottom: "10px" }}>
          <h2 style={{ margin: 0, color: "#ef4444" }}>📓 SỔ NỢ</h2>
          <button onClick={() => setShowDebtModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {Object.keys(customers).filter(p => (customers[p].debt || 0) > 0).map(phone => (
            <div key={phone} style={{ padding: "10px", borderBottom: "1px dashed var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "bold" }}>{customers[phone].name}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{phone}</div>
                <div style={{ color: "#ef4444", fontWeight: "bold" }}>Nợ: {(customers[phone].debt || 0).toLocaleString()}đ</div>
              </div>
              <button onClick={() => handlePayDebt(phone)} style={{ padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>THU TIỀN</button>
            </div>
          ))}
          {Object.keys(customers).filter(p => (customers[p].debt || 0) > 0).length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Không có nợ.</div>}
        </div>
      </div>
    </div>
  );
};
