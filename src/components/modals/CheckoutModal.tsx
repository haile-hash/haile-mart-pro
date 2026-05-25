import React, { useEffect, useRef } from "react";

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

  // Link sinh mã QR động tự động theo tiêu chuẩn NAPAS VietQR
  const vietQrUrl = `https://img.vietqr.io/image/${bankBin || 'ICB'}-${bankAcc || '0000'}-qr_only.png?amount=${finalToPay}&addInfo=Hải%20Lê%20Mart%20Thanh%20Toán`;

  return (
    <div className="checkout-modal-overlay" onClick={handleClose}>
      <div className="checkout-modal-content" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        
        {/* HEADER */}
        <div className="checkout-header">
          <h2 className="checkout-title">
            {checkoutStep === 1 && "Thông tin thanh toán"}
            {checkoutStep === 2 && "Chọn phương thức chốt đơn"}
            {checkoutStep === 3 && "Hoàn tất đơn hàng"}
          </h2>
          <button className="checkout-close-btn" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* BODY */}
        <div className="checkout-body">
          {/* STEP 1: THÔNG TIN KHÁCH HÀNG */}
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

          {/* STEP 2: PHƯƠNG THỨC THANH TOÁN */}
          {checkoutStep === 2 && (
            <div>
              <div className="co-summary-box" style={{ padding: '12px', marginBottom: '12px' }}>
                <div className="co-summary-title">TỔNG TIỀN PHẢI THU:</div>
                <div className="co-summary-price" style={{ color: '#2563eb', fontSize: '30px' }}>{finalToPay.toLocaleString()}đ</div>
              </div>

              {/* LUÔN LUÔN HIỂN THỊ MÃ QR - KHÔNG CẦN HỎI */}
              <div style={{ display: 'flex', background: '#f8fafc', padding: '12px', border: '1px dashed #3b82f6', borderRadius: '8px', gap: '15px', alignItems: 'center', marginBottom: '12px' }}>
                <img src={vietQrUrl} alt="VietQR" style={{ width: '110px', height: '110px', background: '#fff', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                <div style={{ textAlign: 'left', fontSize: '12px', flex: 1 }}>
                  <p style={{ margin: '1px 0' }}><strong>Ngân hàng:</strong> {bankNameStr || 'Vietcombank'}</p>
                  <p style={{ margin: '1px 0' }}><strong>Số TK:</strong> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{bankAcc || 'Chưa cài đặt'}</span></p>
                  <p style={{ margin: '1px 0', color: '#64748b' }}>Nội dung: Hải Lê Mart</p>
                  <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>⚡ QR sinh tự động theo số tiền đơn hàng</p>
                </div>
              </div>

              {customers[custPhone]?.wallet > 0 && (
                <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "8px", marginBottom: '10px', cursor: "pointer", border: "1px solid #cbd5e1", background: '#fff' }}>
                  <input type="checkbox" checked={useWallet} onChange={e => setUseWallet(e.target.checked)} />
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>Khấu trừ từ Ví VIP: <span style={{ color: "#ea580c" }}>{customers[custPhone].wallet.toLocaleString()}đ</span></span>
                </label>
              )}

              <div className="co-group" style={{ marginBottom: '12px' }}>
                <label className="co-label">Tiền mặt khách đưa:</label>
                <div className="co-input-wrapper">
                  <div className="co-icon-box">💵</div>
                  <input type="number" className="co-input" placeholder="Nhập số tiền mặt..." value={customerGiven} onChange={(e) => setCustomerGiven(e.target.value)} />
                </div>
                {Number(customerGiven) > finalToPay && (
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                    ↳ Tiền thừa trả khách: {(Number(customerGiven) - finalToPay).toLocaleString()}đ
                  </div>
                )}
                {Number(customerGiven) > 0 && Number(customerGiven) < finalToPay && (
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#ea580c', fontWeight: '600' }}>
                    ↳ Số tiền thiếu (Quét QR phần này): {(finalToPay - Number(customerGiven)).toLocaleString()}đ
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: '8px' }}>
                <button onClick={() => confirmCheckout('TIỀN MẶT')} disabled={loading} className="btn-method green">
                  💵 Tiền mặt (F2)
                </button>
                <button onClick={() => confirmCheckout('CHUYỂN KHOẢN')} disabled={loading} className="btn-method blue">
                  🏦 Chuyển khoản qua QR (F3)
                </button>
                <button 
                  onClick={() => {
                    if(!customerGiven || Number(customerGiven) <= 0 || Number(customerGiven) >= finalToPay) {
                      alert("Vui lòng điền số tiền mặt khách đưa nhỏ hơn tổng tiền để dùng Kết hợp!"); return;
                    }
                    confirmCheckout('KẾT HỢP');
                  }} 
                  disabled={loading} className="btn-method orange"
                >
                  🤝 Kết hợp (Tiền mặt + Quét QR)
                </button>

                <div className="btn-method-grid">
                  <button onClick={() => confirmCheckout('QUẸT THẺ')} disabled={loading} className="btn-method">Quẹt Thẻ</button>
                  <button onClick={() => confirmCheckout('ZALO PAY')} disabled={loading} className="btn-method">Zalo Pay</button>
                  <button onClick={() => confirmCheckout('GHI NỢ')} disabled={loading} className="btn-method">Ghi Nợ</button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: HOÀN TẤT ĐƠN HÀNG */}
          {checkoutStep === 3 && (
            <div style={{ textAlign: "center", padding: "15px 0" }}>
              <div style={{ width: '60px', height: '60px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10b981' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2 style={{ color: "#059669", marginBottom: "6px", fontSize: '20px', fontWeight: '800' }}>THANH TOÁN THÀNH CÔNG!</h2>
              <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>Hóa đơn đã ghi nhận vào hệ thống.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button onClick={() => setPrintMode('receipt')} className="co-btn-primary">🖨️ XUẤT LỆNH IN HOÁ ĐƠN</button>
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
