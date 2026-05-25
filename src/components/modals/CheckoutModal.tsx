import React, { useEffect, useRef } from "react";
import { formatCategoryStr, cleanName } from "../../utils/helpers";

interface CheckoutModalProps {
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (val: boolean) => void;
  checkoutStep: number;
  setCheckoutStep: (val: number) => void;
  voucherInput: string;
  setVoucherInput: (val: string) => void;
  customerInput: string;
  setCustomerInput: (val: string) => void;
  custPhone: string;
  setCustPhone: (val: string) => void;
  custName: string;
  setCustName: (val: string) => void;
  useWallet: boolean;
  setUseWallet: (val: boolean) => void;
  appliedVoucherAmount: number;
  setAppliedVoucherAmount: (val: number) => void;
  customerGiven: string;
  setCustomerGiven: (val: string) => void;
  finalToPay: number;
  customers: any;
  isOnline: boolean;
  bankBin: string;
  bankAcc: string;
  bankNameStr: string;
  loading: boolean;
  handleVoucherSubmit: (e: any) => void;
  handleCustomerInputChange: (e: any) => void;
  setScannerMode: (mode: any) => void;
  handleNextToQR: () => void;
  confirmCheckout: (method: any) => void;
  setPrintMode: (mode: any) => void;
  sendReceiptEmail: () => void;
  closeCheckout: () => void;
  custAddress: string;
  setCustAddress: (val: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isCheckoutOpen, setIsCheckoutOpen, checkoutStep, setCheckoutStep,
  voucherInput, setVoucherInput, customerInput, setCustomerInput,
  custPhone, setCustPhone, custName, setCustName,
  useWallet, setUseWallet, appliedVoucherAmount, setAppliedVoucherAmount,
  customerGiven, setCustomerGiven, finalToPay, customers,
  isOnline, bankBin, bankAcc, bankNameStr, loading,
  handleVoucherSubmit, handleCustomerInputChange, setScannerMode,
  handleNextToQR, confirmCheckout, setPrintMode, sendReceiptEmail, closeCheckout,
  custAddress, setCustAddress
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCheckoutOpen && checkoutStep === 1) {
      setTimeout(() => { document.getElementById('co-customer-input')?.focus(); }, 100);
    }
  }, [isCheckoutOpen, checkoutStep]);

  // ==========================================
  // FIX LỖI: HÀM ĐÓNG MODAL VÀ HỦY IN
  // ==========================================
  const handleClose = () => {
    setPrintMode(null); // 1. Hủy ngay mọi lệnh in đang chờ
    closeCheckout();    // 2. Đóng Modal và reset giỏ hàng
  };

  if (!isCheckoutOpen) return null;

  return (
    <div className="checkout-modal-overlay" onClick={handleClose}>
      <div className="checkout-modal-content" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        
        {/* HEADER */}
        <div className="checkout-header">
          <h2 className="checkout-title">
            {checkoutStep === 1 && "1. THÔNG TIN KHÁCH HÀNG"}
            {checkoutStep === 2 && "2. PHƯƠNG THỨC THANH TOÁN"}
            {checkoutStep === 3 && "3. HOÀN TẤT ĐƠN HÀNG"}
          </h2>
          <button className="checkout-close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* BODY (CÓ THỂ CUỘN NẾU DÀI) */}
        <div className="checkout-body">
          {checkoutStep === 1 && (
            <>
              {/* SĐT Khách hàng */}
              <div className="co-group">
                <label className="co-label">SĐT / Mã Khách Hàng</label>
                <div className="co-input-wrapper">
                  <div className="co-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </div>
                  <input id="co-customer-input" className="co-input" placeholder="Nhập SĐT hoặc quét mã thẻ..." value={customerInput} onChange={handleCustomerInputChange} />
                  <button type="button" className="co-btn-scan" onClick={() => setScannerMode('customer')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line><line x1="12" y1="8" x2="12" y2="16"></line></svg>
                    Quét
                  </button>
                </div>
              </div>

              {/* Tên Khách Hàng */}
              <div className="co-group">
                <label className="co-label">Tên Khách Hàng</label>
                <div className="co-input-wrapper">
                  <div className="co-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <input className="co-input" placeholder="Tên khách hàng..." value={custName} onChange={(e) => setCustName(e.target.value)} />
                </div>
              </div>

              {/* Địa Chỉ */}
              <div className="co-group">
                <label className="co-label">Địa Chỉ Giao Hàng (Tùy chọn)</label>
                <div className="co-input-wrapper">
                  <div className="co-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <input className="co-input" placeholder="Số nhà, đường, phường, quận..." value={custAddress} onChange={(e) => setCustAddress(e.target.value)} />
                </div>
              </div>

              {/* Mã Giảm Giá */}
              <div className="co-group" style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '20px' }}>
                <label className="co-label" style={{ color: '#059669' }}>Mã Giảm Giá / Voucher</label>
                <div className="co-input-wrapper">
                  <div className="co-icon-box" style={{ color: '#10b981' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                  </div>
                  <input className="co-input" placeholder="Nhập mã và ấn Enter..." value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)} onKeyDown={handleVoucherSubmit} />
                  <button type="button" className="co-btn-scan" onClick={() => setScannerMode('voucher')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line><line x1="12" y1="8" x2="12" y2="16"></line></svg>
                    Quét
                  </button>
                </div>
              </div>

              {/* Tổng Tiền Summary */}
              <div className="co-summary-box">
                <div className="co-summary-title">CẦN THANH TOÁN</div>
                <div className="co-summary-price">{finalToPay.toLocaleString()}đ</div>
              </div>
            </>
          )}

          {checkoutStep === 2 && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div className="co-summary-box" style={{ marginTop: 0, marginBottom: '25px' }}>
                <div className="co-summary-title">TỔNG TIỀN:</div>
                <div className="co-summary-price" style={{ fontSize: '40px' }}>{finalToPay.toLocaleString()}đ</div>
              </div>

              {customers[custPhone]?.wallet > 0 && (
                <label style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", padding: "15px", borderRadius: "10px", marginBottom: "20px", cursor: "pointer", border: "1px solid #cbd5e1" }}>
                  <input type="checkbox" checked={useWallet} onChange={e => setUseWallet(e.target.value === 'true' ? true : (!useWallet))} style={{ width: '20px', height: '20px', accentColor: '#ea580c' }} />
                  <span style={{ fontSize: "15px", fontWeight: "bold", color: "#0f172a" }}>Trừ Ví VIP: <span style={{ color: "#ea580c" }}>{customers[custPhone].wallet.toLocaleString()}đ</span></span>
                </label>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button 
                  onClick={() => confirmCheckout('TIỀN MẶT')} 
                  disabled={loading}
                  style={{ width: "100%", padding: "16px", background: "#10b981", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  💵 THANH TOÁN TIỀN MẶT (F2)
                </button>
                <button 
                  onClick={() => confirmCheckout('CHUYỂN KHOẢN')} 
                  disabled={loading}
                  style={{ width: "100%", padding: "16px", background: "#3b82f6", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  🏦 MÃ QR CHUYỂN KHOẢN (F3)
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button 
                    onClick={() => confirmCheckout('QUẸT THẺ')} 
                    disabled={loading}
                    style={{ padding: "14px", background: "#64748b", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    💳 QUẸT THẺ
                  </button>
                  <button 
                    onClick={() => confirmCheckout('GHI NỢ')} 
                    disabled={loading}
                    style={{ padding: "14px", background: "#ef4444", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    📓 KHÁCH GHI NỢ
                  </button>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 3 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#10b981' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2 style={{ color: "#059669", marginBottom: "10px", fontSize: '24px', fontWeight: '900' }}>THANH TOÁN THÀNH CÔNG!</h2>
              <p style={{ color: "#64748b", fontSize: "15px", marginBottom: "30px" }}>Đơn hàng đã được lưu vào hệ thống.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button 
                  onClick={() => setPrintMode('receipt')}
                  style={{ width: "100%", padding: "16px", background: "#3b82f6", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}
                >
                  🖨️ IN HÓA ĐƠN
                </button>
                <button 
                  onClick={sendReceiptEmail}
                  style={{ width: "100%", padding: "16px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}
                >
                  ✉️ GỬI EMAIL HÓA ĐƠN
                </button>
                <button 
                  onClick={handleClose}
                  style={{ width: "100%", padding: "16px", background: "#e2e8f0", color: "#0f172a", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: '10px' }}
                >
                  XONG & ĐÓNG
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER CỐ ĐỊNH CHỨA NÚT ACTION (Chỉ hiện ở Step 1) */}
        {checkoutStep === 1 && (
          <div className="checkout-footer">
            <button className="co-btn-primary" onClick={handleNextToQR}>
              TIẾP TỤC THANH TOÁN
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
