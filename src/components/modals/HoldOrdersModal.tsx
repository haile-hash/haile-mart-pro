import React from 'react';

interface HoldOrdersModalProps {
  showHoldModal: boolean;
  setShowHoldModal: (val: boolean) => void;
  heldOrders: any[];
  restoreOrder: (order: any) => void;
  deleteHeldOrder: (id: any) => void;
}

export const HoldOrdersModal: React.FC<HoldOrdersModalProps> = ({
  showHoldModal, setShowHoldModal, heldOrders, restoreOrder, deleteHeldOrder
}) => {
  if (!showHoldModal) return null;

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={() => setShowHoldModal(false)}>
      <div className="glass" style={{ padding: "25px", width: "400px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #fed7aa", paddingBottom: "10px", marginBottom: "10px" }}>
          <h2 style={{ margin: 0, color: "#f59e0b" }}>📂 ĐƠN LƯU TẠM</h2>
          <button onClick={() => setShowHoldModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {heldOrders.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Trống.</div>}
          {heldOrders.map((order, idx) => (
            <div key={order.id} style={{ padding: "10px", borderBottom: "1px dashed var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-input)", borderRadius: "8px", marginBottom: "8px" }}>
              <div>
                <div style={{ fontWeight: "bold" }}>Đơn #{idx + 1}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>⏰ {order.time}</div>
                <div style={{ fontSize: "11px", color: "#b91c1c", fontWeight: "bold" }}>Gồm {order.cart.reduce((s: any, i: any) => s + (Number(i.qty) || 0), 0)} SP</div>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => restoreOrder(order)} style={{ padding: "6px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>MỞ</button>
                <button onClick={() => deleteHeldOrder(order.id)} style={{ padding: "6px", background: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "6px", cursor: "pointer", fontSize: "11px" }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
