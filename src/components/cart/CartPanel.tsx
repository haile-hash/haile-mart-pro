import React from 'react';
import { cleanName, parseGift } from '../../utils/helpers';

interface CartPanelProps {
  cart: any[];
  custName: string;
  heldOrders: any[];
  cartTotalAmountDisplay: number;
  setShowHoldModal: (val: boolean) => void;
  handleHoldOrder: () => void;
  clearCart: () => void;
  setCustName: (val: string) => void;
  setCustPhone: (val: string) => void;
  setCustomerInput: (val: string) => void;
  setIsCheckoutOpen: (val: boolean) => void;
  setCheckoutStep: (step: number) => void;
  adjustCartQty: (id: any, delta: number) => void;
  handleDirectQtyChange: (id: any, val: string) => void;
  handleDirectQtyBlur: (id: any, val: string) => void;
  removeFromCart: (id: any) => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  cart, custName, heldOrders, cartTotalAmountDisplay,
  setShowHoldModal, handleHoldOrder, clearCart,
  setCustName, setCustPhone, setCustomerInput,
  setIsCheckoutOpen, setCheckoutStep,
  adjustCartQty, handleDirectQtyChange, handleDirectQtyBlur, removeFromCart
}) => {
  return (
    <div className="glass" style={{ padding: "15px", flex: 1.5, minHeight: "45vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "2px dashed var(--border-glass)", paddingBottom: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h3 style={{ margin: 0, color: "#ef4444", fontSize: "15px", textTransform: "uppercase" }}>
            🛒 GIỎ HÀNG ({cart.reduce((s, i) => s + (Number(i.qty) || 0), 0)} món)
          </h3>
          {custName && (
            <div style={{ fontSize: "11px", color: "#10b981", fontWeight: "bold", marginTop: "2px" }}>
              👤 VIP: {custName} 
              <span style={{ cursor: "pointer", color: "#ef4444", marginLeft: "4px" }} 
                    onClick={() => { setCustName(""); setCustPhone(""); setCustomerInput("") }} 
                    title="Xóa khách khỏi giỏ">✖</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {heldOrders.length > 0 && <button onClick={() => setShowHoldModal(true)} style={{ fontSize: "10px", padding: "6px 8px", background: "var(--bg-input)", color: "#f59e0b", border: "1px solid #fde68a", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📂 TẠM LƯU ({heldOrders.length})</button>}
          {cart.length > 0 && <button onClick={handleHoldOrder} style={{ fontSize: "10px", padding: "6px 8px", background: "var(--bg-input)", color: "#ea580c", border: "1px solid #fdba74", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>⏸️ LƯU TẠM (F4)</button>}
          {cart.length > 0 && <button onClick={clearCart} style={{ fontSize: "10px", padding: "6px 8px", background: "var(--bg-input)", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>🗑️ HỦY HẾT</button>}
        </div>
      </div>
      
      {cartTotalAmountDisplay > 0 && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: "12px 15px", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#ef4444" }}>TỔNG CỘNG:</span>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#ef4444" }}>{cartTotalAmountDisplay.toLocaleString()}đ</div>
          </div>
          <button onClick={() => { setIsCheckoutOpen(true); setCheckoutStep(1) }} style={{ padding: "12px 25px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>
            THANH TOÁN
          </button>
        </div>
      )}
      
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
        {cart.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12px", marginTop: "15px" }}>Giỏ hàng trống</div>}
        {cart.map((item, idx) => {
          const gift = parseGift(item.product.gift_info); 
          const gQty = gift.cond > 0 ? Math.floor(item.qty / gift.cond) : 0; 
          const hasGift = gift.text && gQty > 0;
          
          return (
            <div key={idx} style={{ padding: "8px 0", borderBottom: "1px dashed var(--border-glass)", fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", color: "var(--text-main)", flex: 1, fontSize: "13px" }}>
                  {cleanName(item.product.name)} {item.product.isHappyHour && <span style={{ color: "#ea580c", fontSize: "10px" }}>[Giờ Vàng]</span>}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button className="qty-btn" style={{background:"var(--border-glass)", border:"none", borderRadius:"4px", cursor:"pointer", color: "var(--text-main)"}} onClick={() => adjustCartQty(item.product.id, -1)}>-</button>
                  <input className="qty-input" style={{ fontSize: "13px", padding: "4px 0", width: "32px", background:"var(--bg-input)", color:"var(--text-main)", border:"1px solid var(--border-glass)", textAlign: "center" }} type="number" value={item.qty} onChange={e => handleDirectQtyChange(item.product.id, e.target.value)} onBlur={e => handleDirectQtyBlur(item.product.id, e.target.value)} onFocus={e => e.target.select()} title="Bấm để nhập số lượng" />
                  <button className="qty-btn" style={{background:"var(--border-glass)", border:"none", borderRadius:"4px", cursor:"pointer", color: "var(--text-main)"}} onClick={() => adjustCartQty(item.product.id, 1)}>+</button>
                  <button onClick={() => removeFromCart(item.product.id)} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: "18px", marginLeft: "4px", fontWeight: "bold" }}>×</button>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <span>{hasGift && <span style={{ color: "#10b981", fontSize: "10px", fontStyle: "italic" }}>+ 🎁 Tặng: {gQty} x {gift.text}</span>}</span>
                <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "14px" }}>{Math.round(item.total).toLocaleString()}đ</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};
