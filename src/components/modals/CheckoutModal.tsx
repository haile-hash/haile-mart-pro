import React from 'react';
import { getCustomerTier } from '../../utils/helpers';

interface CheckoutModalProps {
  isCheckoutOpen: boolean; setIsCheckoutOpen: (val: boolean) => void;
  checkoutStep: number; setCheckoutStep: (val: number) => void;
  voucherInput: string; setVoucherInput: (val: string) => void;
  customerInput: string; setCustomerInput: (val: string) => void;
  custPhone: string; setCustPhone: (val: string) => void;
  custName: string; setCustName: (val: string) => void;
  useWallet: boolean; setUseWallet: (val: boolean) => void;
  appliedVoucherAmount: number; setAppliedVoucherAmount: (val: number) => void;
  customerGiven: number | ""; setCustomerGiven: (val: number | "") => void;
  finalToPay: number;
  customers: any;
  isOnline: boolean;
  bankBin: string; bankAcc: string; bankNameStr: string;
  loading: boolean;
  handleVoucherSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleCustomerInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setScannerMode: (mode: 'product' | 'voucher' | 'customer' | null) => void;
  handleNextToQR: () => void;
  confirmCheckout: (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ' | 'KẾT HỢP' | 'QUẸT THẺ') => void;
  setPrintMode: (mode: 'receipt' | 'barcode' | 'customer_card' | 'invoice_a4' | null) => void;
  sendReceiptEmail: () => void;
  closeCheckout: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = (props) => {
  if (!props.isCheckoutOpen) return null;

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      
      {/* BƯỚC 1: NHẬP VOUCHER & VIP */}
      {props.checkoutStep === 1 && (
        <div className="glass" style={{ padding: "25px", width: "350px" }} onClick={e => e.stopPropagation()}>
          <h3 style={{ color: "#ef4444", margin: "0", textAlign: "center" }}>🧧 THANH TOÁN</h3>
          <div style={{ display: "flex", position: "relative", marginTop: "15px" }}>
            <input type="text" placeholder="👉 Nhập mã Voucher..." value={props.voucherInput} onChange={(e) => props.setVoucherInput(e.target.value)} onKeyDown={props.handleVoucherSubmit} style={{ flex: 1, padding: "12px", borderRadius: "10px 0 0 10px", border: "2px dashed #f59e0b", outline: "none", boxSizing: "border-box" }} />
            <button onClick={() => props.handleVoucherSubmit({ key: 'Enter', preventDefault: () => {} } as any)} style={{ padding: "0 15px", background: "#f59e0b", border: "none", cursor: "pointer", color: "white", fontWeight: "bold", borderLeft: "1px solid #d97706" }}>ÁP DỤNG</button>
            <button onClick={() => props.setScannerMode('voucher')} style={{ padding: "0 15px", background: "#f59e0b", border: "none", borderRadius: "0 10px 10px 0", cursor: "pointer", color: "white", fontSize: "18px", borderLeft: "1px solid #d97706" }}>📷</button>
          </div>
          {props.appliedVoucherAmount > 0 && <div style={{ color: "#059669", fontSize: "12px", fontWeight: "bold", marginTop: "4px", textAlign: "center" }}>✅ Đã áp dụng giảm: {props.appliedVoucherAmount.toLocaleString()}đ</div>}
          
          <div style={{ display: "flex", position: "relative", marginTop: "10px" }}>
            <input type="text" placeholder="👉 Quẹt Thẻ VIP/SĐT..." value={props.customerInput} onChange={props.handleCustomerInputChange} style={{ flex: 1, padding: "12px", borderRadius: "10px 0 0 10px", border: "2px solid #ef4444", outline: "none", boxSizing: "border-box", fontWeight: "bold", color: "#b91c1c" }} />
            <button onClick={() => props.setScannerMode('customer')} style={{ padding: "0 15px", background: "#ef4444", border: "none", borderRadius: "0 10px 10px 0", cursor: "pointer", color: "white", fontSize: "18px" }}>📷</button>
          </div>
          
          {props.custPhone && (
            <div style={{ marginTop: "10px", padding: "12px", background: "var(--bg-input)", borderRadius: "8px", border: "1px dashed #f97316" }}>
              {props.customers[props.custPhone] ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ color: "#b91c1c", fontWeight: "bold" }}>⭐ {props.customers[props.custPhone].name}</div>
                    <span style={{ fontSize: "9px", fontWeight: "900", color: getCustomerTier(props.customers[props.custPhone].totalSpent).color, border: `1px solid ${getCustomerTier(props.customers[props.custPhone].totalSpent).color}`, padding: "2px 4px", borderRadius: "8px", background: "#fff" }}>{getCustomerTier(props.customers[props.custPhone].totalSpent).name}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px", fontWeight: "bold" }}>⚡ Giảm trực tiếp: {getCustomerTier(props.customers[props.custPhone].totalSpent).discountRate * 100}%</div>
                  <div style={{ marginTop: "4px" }}>Ví: <b>{Math.round(props.customers[props.custPhone].wallet || 0).toLocaleString()}đ</b> | Nợ: <b style={{ color: "#ef4444" }}>{(props.customers[props.custPhone].debt || 0).toLocaleString()}đ</b></div>
                  {(props.customers[props.custPhone].wallet || 0) > 0 && (
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", cursor: "pointer", color: "#ea580c", fontWeight: "bold" }}><input type="checkbox" checked={props.useWallet} onChange={(e) => props.setUseWallet(e.target.checked)} /> Dùng điểm lì xì!</label>
                  )}
                </div>
              ) : (
                <input type="text" placeholder="Tên khách mới..." value={props.custName} onChange={e => props.setCustName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", outline: "none", border: "1px solid #fdba74", boxSizing: "border-box" }} />
              )}
            </div>
          )}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button onClick={() => props.setIsCheckoutOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "var(--border-glass)", fontWeight: "bold", cursor: "pointer", color: "var(--text-main)" }}>Hủy</button>
            <button onClick={props.handleNextToQR} style={{ flex: 2, padding: "10px", background: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>TIẾP TỤC 👉</button>
          </div>
        </div>
      )}

      {/* BƯỚC 2: QUÉT QR HOẶC TIỀN MẶT */}
      {props.checkoutStep === 2 && (
        <div className="glass" style={{ padding: "25px", width: "350px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <h3 style={{ color: "#ef4444", margin: "0" }}>📱 THANH TOÁN</h3>
          <div style={{ color: "#ef4444", fontSize: "28px", fontWeight: "900", margin: "10px 0" }}>{props.finalToPay.toLocaleString()}đ</div>
          
          {props.finalToPay > 0 && (
            <div style={{ position: "relative" }}>
              {props.isOnline ? (
                <img src={`https://img.vietqr.io/image/${props.bankBin}-${props.bankAcc}-compact2.png?amount=${props.finalToPay - (Number(props.customerGiven) || 0) > 0 ? props.finalToPay - (Number(props.customerGiven) || 0) : props.finalToPay}&addInfo=Thanh toan&accountName=${encodeURIComponent(props.bankNameStr)}`} style={{ width: "160px", margin: "0 auto 10px auto", border: "2px solid #ef4444", borderRadius: "10px", display: "block", background: "#fff" }} alt="QR" />
              ) : (
                <div style={{ width: "160px", height: "160px", margin: "0 auto 10px auto", border: "2px dashed #ef4444", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2", color: "#ef4444", fontSize: "12px", fontWeight: "bold", textAlign: "center", padding: "10px", boxSizing: "border-box" }}>🚫 Mất mạng<br />Không thể tải QR</div>
              )}
              <div style={{ animation: "pulse-fast 1.5s infinite", color: "#b45309", fontSize: "11px", fontWeight: "bold", marginBottom: "5px" }}>⏳ Đang chờ tiền...</div>
            </div>
          )}

          {props.finalToPay > 0 ? (
            <div style={{ marginBottom: "15px", textAlign: "left", borderTop: "1px dashed var(--border-glass)", paddingTop: "10px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "bold", marginBottom: "5px" }}>Khách thanh toán Tiền mặt:</div>
              <input type="number" placeholder="Nhập số tiền TM..." value={props.customerGiven} onChange={e => props.setCustomerGiven(Number(e.target.value) || "")} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-glass)", outline: "none", boxSizing: "border-box", fontSize: "14px", fontWeight: "bold" }} />
              {props.customerGiven !== "" && Number(props.customerGiven) < props.finalToPay && (
                <div style={{ marginTop: "10px", padding: "10px", background: "#fffbeb", border: "1px dashed #f59e0b", borderRadius: "8px", color: "#d97706", fontSize: "11px", textAlign: "center", fontWeight: "bold" }}>Còn thiếu: {(props.finalToPay - Number(props.customerGiven)).toLocaleString()}đ <br/> (Quét mã QR ở trên để trả phần còn thiếu)</div>
              )}
              {props.customerGiven !== "" && Number(props.customerGiven) >= props.finalToPay && (
                <div style={{ marginTop: "10px", padding: "10px", background: "#ecfdf5", border: "1px dashed #10b981", borderRadius: "8px", color: "#059669", fontWeight: "bold", fontSize: "16px", textAlign: "center" }}>THỐI LẠI: {(Number(props.customerGiven) - props.finalToPay).toLocaleString()}đ</div>
              )}
              <div style={{ display: "flex", gap: "5px", marginTop: "8px", flexWrap: "wrap" }}>
                <button onClick={() => props.setCustomerGiven(props.finalToPay)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>Vừa đủ</button>
                <button onClick={() => props.setCustomerGiven(50000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>50k</button>
                <button onClick={() => props.setCustomerGiven(100000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>100k</button>
                <button onClick={() => props.setCustomerGiven(200000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>200k</button>
                <button onClick={() => props.setCustomerGiven(500000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>500k</button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: "15px", padding: "15px", background: "#ecfdf5", border: "1px dashed #10b981", borderRadius: "8px", color: "#059669", fontWeight: "bold" }}>✅ Đã thanh toán đủ bằng Ví/Voucher</div>
          )}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", borderTop: "1px dashed var(--border-glass)", paddingTop: "10px" }}>
            <button onClick={() => props.setCheckoutStep(1)} style={{ flex: "1 1 100%", padding: "8px", borderRadius: "8px", border: "none", background: "#fca5a5", cursor: "pointer", fontWeight: "bold", color: "#b91c1c", marginBottom: "4px" }}>Quay lại</button>
            {props.finalToPay > 0 ? (
              <>
                {props.customerGiven !== "" && Number(props.customerGiven) > 0 && Number(props.customerGiven) < props.finalToPay ? (
                  <button onClick={() => props.confirmCheckout('KẾT HỢP')} disabled={props.loading} style={{ flex: "1 1 100%", padding: "12px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}>💳 THANH TOÁN KẾT HỢP (TM + CK)</button>
                ) : (
                  <>
                    <button onClick={() => props.confirmCheckout('GHI NỢ')} disabled={props.loading} style={{ flex: 1, padding: "10px", background: "#f59e0b", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>📝 GHI NỢ</button>
                    <button onClick={() => props.confirmCheckout('QUẸT THẺ')} disabled={props.loading} style={{ flex: 1, padding: "10px", background: "#8b5cf6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>💳 QUẸT THẺ</button>
                    <button onClick={() => props.confirmCheckout('CHUYỂN KHOẢN')} disabled={props.loading} style={{ flex: 1, padding: "10px", background: "#3b82f6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>🏦 C.KHOẢN (F3)</button>
                    <button onClick={() => { if (props.finalToPay > 0 && (props.customerGiven === "" || Number(props.customerGiven) < props.finalToPay)) { return alert(`Khách đưa chưa đủ tiền!`); } props.confirmCheckout('TIỀN MẶT'); }} disabled={props.loading} style={{ flex: 1, padding: "10px", background: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>💵 T.MẶT (F2)</button>
                  </>
                )}
              </>
            ) : (
              <button onClick={() => props.confirmCheckout('TIỀN MẶT')} disabled={props.loading} style={{ flex: "1 1 100%", padding: "12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>HOÀN TẤT ĐƠN HÀNG</button>
            )}
          </div>
        </div>
      )}

      {/* BƯỚC 3: SỬ LIÊN QUAN ĐẾN IN ẤN VÀ EMAIL */}
      {props.checkoutStep === 3 && (
        <div className="glass" style={{ padding: "30px", width: "350px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: "40px" }}>🌸</div>
          <h3 style={{ color: "#10b981", margin: "10px 0" }}>Thành công!</h3>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
            <button onClick={() => { props.setPrintMode('receipt'); setTimeout(() => window.print(), 300); }} style={{ flex: 1, padding: "12px", background: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>🖨️ In Bill</button>
            <button onClick={() => { props.setPrintMode('invoice_a4'); setTimeout(() => window.print(), 300); }} style={{ flex: 1, padding: "12px", background: "#3b82f6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>🖨️ In A4</button>
            <button onClick={props.sendReceiptEmail} disabled={props.loading} style={{ flex: "1 1 100%", padding: "12px", background: "#8b5cf6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>{props.loading ? "Đang gửi..." : "📧 Email Khách"}</button>
            <button onClick={props.closeCheckout} style={{ flex: "1 1 100%", padding: "12px", background: "var(--border-glass)", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--text-main)" }}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};
