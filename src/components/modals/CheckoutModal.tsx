import React, { useEffect, useRef, useState } from "react";

interface CheckoutModalProps {
  isCheckoutOpen: boolean; setIsCheckoutOpen: (val: boolean) => void;
  checkoutStep: number; setCheckoutStep: (val: number) => void;
  voucherInput: string; setVoucherInput: (val: string) => void;
  customerInput: string; setCustomerInput: (val: string) => void;
  custPhone: string; setCustPhone: (val: string) => void;
  custName: string; setCustName: (val: string) => void;
  useWallet: boolean; setUseWallet: (val: boolean) => void;
  appliedVoucherAmount: number; setAppliedVoucherAmount: (val: number) => void;
  customerGiven: string; setCustomerGiven: (val: string) => void;
  finalToPay: number; customers: any; isOnline: boolean;
  bankBin: string; bankAcc: string; bankNameStr: string; loading: boolean;
  handleVoucherSubmit: (e: any) => void; handleCustomerInputChange: (e: any) => void;
  setScannerMode: (mode: any) => void; handleNextToQR: () => void;
  confirmCheckout: (method: any) => void; setPrintMode: (mode: any) => void;
  sendReceiptEmail: () => void; closeCheckout: () => void;
  custAddress: string; setCustAddress: (val: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isCheckoutOpen, setIsCheckoutOpen, checkoutStep, setCheckoutStep,
  voucherInput, setVoucherInput, customerInput, setCustomerInput,
  custPhone, setCustPhone, custName, setCustName,
  useWallet, setUseWallet, appliedVoucherAmount, setAppliedVoucherAmount,
  customerGiven, setCustomerGiven, finalToPay, customers,
  bankBin, bankAcc, bankNameStr,
  loading, handleVoucherSubmit, handleCustomerInputChange, setScannerMode,
  handleNextToQR, confirmCheckout, setPrintMode, sendReceiptEmail, closeCheckout,
  custAddress, setCustAddress
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCheckoutOpen && checkoutStep === 1) {
      setTimeout(() => { document.getElementById('co-customer-input')?.focus(); }, 100);
    }
  }, [isCheckoutOpen, checkoutStep]);

  const handleClose = () => {
    setPrintMode(null); 
    closeCheckout();    
  };

  if (!isCheckoutOpen) return null;

  const vietQrUrl = `https://img.vietqr.io/image/${bankBin || 'ICB'}-${bankAcc || '0000'}-qr_only.png?amount=${finalToPay}&addInfo=Hải%20Lê%20Mart%20Thanh%20Toán`;

  return (
    <div className="checkout-modal-overlay" onClick={handleClose}>
      <div className="checkout-modal-content" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        
        <div className="checkout-header">
          <h2 className="checkout-title">
            {checkoutStep === 1 && "1. THÔNG TIN KHÁCH HÀNG"}
            {checkoutStep === 2 && "2. CHỌN PHƯƠNG THỨC CHỐT ĐƠN"}
            {checkoutStep === 3 && "3. HOÀN TẤT ĐƠN HÀNG"}
          </h2>
          <button className="checkout-close-btn" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="checkout-body" style={{ padding: checkoutStep === 2 ? '20px' : '20px' }}>
          {/* ============================================================== */}
          {/* BƯỚC 1: THÔNG TIN KHÁCH HÀNG */}
          {/* ============================================================== */}
          {checkoutStep === 1 && (
            <>
              <div className="co-group">
                <label className="co-label">Khách hàng</label>
                <div className="co-input-wrapper">
                  <div className="co-icon-box">📞</div>
                  <input id="co-customer-input" className="co-input" placeholder="Nhập SĐT hoặc quét thẻ..." value={customerInput} onChange={handleCustomerInputChange} />
                  <button type="button" className="co-btn-scan" onClick={() => setScannerMode('customer')}>Quét</button>
                </div>
              </div>
              <div className="co-group">
                <label className="co-label">Tên khách hàng</label>
                <div className="co-input-wrapper">
                  <div className="co-icon-box">👤</div>
                  <input className="co-input" placeholder="Tên khách hàng thân thiết..." value={custName} onChange={(e) => setCustName(e.target.value)} />
                </div>
              </div>
              <div className="co-group">
                <label className="co-label">Ghi chú giao hàng</label>
                <div className="co-input-wrapper">
                  <div className="co-icon-box">📍</div>
                  <input className="co-input" placeholder="Số nhà, tên đường (Nếu giao tận nơi)..." value={custAddress} onChange={(e) => setCustAddress(e.target.value)} />
                </div>
              </div>
              <div className="co-group" style={{ marginTop: '20px' }}>
                <label className="co-label" style={{ color: '#059669' }}>Mã Voucher giảm giá</label>
                <div className="co-input-wrapper">
                  <div className="co-icon-box" style={{ color: '#10b981' }}>🎫</div>
                  <input className="co-input" placeholder="Nhập mã + Enter..." value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)} onKeyDown={handleVoucherSubmit} />
                  <button type="button" className="co-btn-scan" onClick={() => setScannerMode('voucher')}>Quét</button>
                </div>
              </div>
              <div className="co-summary-box">
                <div className="co-summary-title">TỔNG KHÁCH PHẢI TRẢ</div>
                <div className="co-summary-price">{finalToPay.toLocaleString()}đ</div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* BƯỚC 2: CHỐT ĐƠN (GIAO DIỆN CHIA 2 CỘT, KHÔNG CUỘN) */}
          {/* ============================================================== */}
          {checkoutStep === 2 && (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
              
              {/* CỘT TRÁI: TIỀN & MÃ QR */}
              <div style={{ flex: '0 0 180px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="co-summary-box" style={{ margin: 0, padding: '12px 10px' }}>
                  <div className="co-summary-title" style={{ fontSize: '11px', color: '#1d4ed8' }}>PHẢI THU</div>
                  <div className="co-summary-price" style={{ fontSize: '24px', color: '#2563eb' }}>{finalToPay.toLocaleString()}đ</div>
                </div>

                <div style={{ flex: 1, background: '#f8fafc', padding: '10px', border: '1px dashed #3b82f6', borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <img src={vietQrUrl} alt="VietQR" style={{ width: '130px', height: '130px', margin: '0 auto', background: '#fff', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  <div style={{ fontSize: '11px', marginTop: '10px', lineHeight: '1.4' }}>
                    <strong>{bankNameStr || 'Mặc định'}</strong><br/>
                    STK: <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{bankAcc || 'Chưa cài đặt'}</span>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '10px', color: '#059669', fontWeight: 'bold' }}>
                    ⚡ Tự động khớp giá
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: INPUT TIỀN & CÁC NÚT BẤM */}
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {customers[custPhone]?.wallet > 0 && (
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", border: "1px solid #cbd5e1", background: '#fff', margin: 0 }}>
                    <input type="checkbox" checked={useWallet} onChange={e => setUseWallet(e.target.checked)} />
                    <span style={{ fontSize: "13px", fontWeight: "600" }}>Trừ Ví VIP: <span style={{ color: "#ea580c" }}>{customers[custPhone].wallet.toLocaleString()}đ</span></span>
                  </label>
                )}

                <div>
                  <div className="co-input-wrapper" style={{ height: '42px' }}>
                    <div className="co-icon-box" style={{ padding: '0 12px' }}>💵</div>
                    <input 
                      type="number" className="co-input" 
                      placeholder="Nhập tiền mặt khách đưa..." 
                      value={customerGiven} onChange={(e) => setCustomerGiven(e.target.value)} 
                      style={{ padding: '10px', fontSize: '15px' }}
                    />
                  </div>
                  {/* Khoảng trống cố định để giữ layout không giật khi hiện chữ */}
                  <div style={{ height: '18px', marginTop: '4px' }}>
                    {Number(customerGiven) > finalToPay && (
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>↳ Thừa trả khách: {(Number(customerGiven) - finalToPay).toLocaleString()}đ</span>
                    )}
                    {Number(customerGiven) > 0 && Number(customerGiven) < finalToPay && (
                      <span style={{ fontSize: '12px', color: '#ea580c', fontWeight: '700' }}>↳ Thiếu (Quét QR nốt): {(finalToPay - Number(customerGiven)).toLocaleString()}đ</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button onClick={() => confirmCheckout('TIỀN MẶT')} disabled={loading} className="btn-method green" style={{ padding: '12px' }}>
                    💵 Tiền mặt (F2)
                  </button>
                  <button onClick={() => confirmCheckout('CHUYỂN KHOẢN')} disabled={loading} className="btn-method blue" style={{ padding: '12px' }}>
                    🏦 C.Khoản (F3)
                  </button>
                </div>
                
                <button 
                  onClick={() => {
                    if(!customerGiven || Number(customerGiven) <= 0 || Number(customerGiven) >= finalToPay) {
                      alert("Vui lòng nhập tiền mặt khách đưa (phải nhỏ hơn tổng bill) ở ô phía trên để sử dụng tính năng Kết hợp!"); return;
                    }
                    confirmCheckout('KẾT HỢP');
                  }} 
                  disabled={loading} className="btn-method orange" style={{ padding: '12px' }}
                >
                  🤝 Kết hợp (Tiền mặt + Chuyển Khoản)
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: 'auto' }}>
                  <button onClick={() => confirmCheckout('QUẸT THẺ')} disabled={loading} className="btn-method" style={{ padding: '8px', fontSize: '12px' }}>💳 Quẹt Thẻ</button>
                  <button onClick={() => confirmCheckout('ZALO PAY')} disabled={loading} className="btn-method" style={{ padding: '8px', fontSize: '12px' }}>📱 Zalo Pay</button>
                  <button onClick={() => confirmCheckout('GHI NỢ')} disabled={loading} className="btn-method" style={{ padding: '8px', fontSize: '12px' }}>📓 Ghi Nợ</button>
                </div>

              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* BƯỚC 3: HOÀN TẤT */}
          {/* ============================================================== */}
          {checkoutStep === 3 && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ width: '50px', height: '50px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#10b981' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2 style={{ color: "#059669", marginBottom: "6px", fontSize: '20px', fontWeight: '800' }}>CHỐT ĐƠN THÀNH CÔNG!</h2>
              <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>Chọn mẫu in để gửi khách hàng.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button onClick={() => setPrintMode('receipt_thermal')} className="co-btn-primary" style={{ background: '#0f172a', padding: '12px' }}>
                    🖨️ IN BILL K80
                  </button>
                  <button onClick={() => setPrintMode('receipt_a4')} className="co-btn-primary" style={{ padding: '12px' }}>
                    🖨️ IN HÓA ĐƠN A4
                  </button>
                </div>
                
                <button onClick={sendReceiptEmail} className="btn-method">✉️ Gửi Email điện tử</button>
                <button onClick={handleClose} className="btn-method" style={{ background: '#f8fafc' }}>Đóng cửa sổ</button>
              </div>
            </div>
          )}
        </div>

        {checkoutStep === 1 && (
          <div className="checkout-footer">
            <button className="co-btn-primary" onClick={handleNextToQR}>
              Tiến hành chọn phương thức thanh toán ➔
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
