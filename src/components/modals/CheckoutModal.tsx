import React, { useState } from 'react';

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
  custAddress: string;                            // <-- Đã thêm props địa chỉ
  setCustAddress: (val: string) => void;          // <-- Đã thêm props địa chỉ
  useWallet: boolean;
  setUseWallet: (val: boolean) => void;
  appliedVoucherAmount: number;
  setAppliedVoucherAmount: (val: number) => void;
  customerGiven: number | string;
  setCustomerGiven: (val: number | string) => void;
  finalToPay: number;
  customers: any;
  isOnline: boolean;
  bankBin: string;
  bankAcc: string;
  bankNameStr: string;
  loading: boolean;
  handleVoucherSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleCustomerInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setScannerMode: (mode: 'product' | 'voucher' | 'customer' | null) => void;
  handleNextToQR: () => void;
  confirmCheckout: (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ' | 'KẾT HỢP' | 'QUẸT THẺ' | 'ZALO PAY') => void;
  setPrintMode: (mode: string | null) => void;
  sendReceiptEmail: () => void;
  closeCheckout: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isCheckoutOpen, setIsCheckoutOpen, checkoutStep, setCheckoutStep,
  voucherInput, setVoucherInput, customerInput, setCustomerInput,
  custPhone, setCustPhone, custName, setCustName, 
  custAddress, setCustAddress, // <-- Sử dụng props
  useWallet, setUseWallet, appliedVoucherAmount, setAppliedVoucherAmount,
  customerGiven, setCustomerGiven, finalToPay, customers, isOnline,
  bankBin, bankAcc, bankNameStr, loading,
  handleVoucherSubmit, handleCustomerInputChange, setScannerMode,
  handleNextToQR, confirmCheckout, setPrintMode, sendReceiptEmail, closeCheckout
}) => {
  
  const [selectedMethod, setSelectedMethod] = useState<'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ' | 'KẾT HỢP' | 'QUẸT THẺ' | 'ZALO PAY'>('TIỀN MẶT');

  if (!isCheckoutOpen) return null;

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal-box" style={{ maxWidth: '500px' }}>
        
        {/* HEADER */}
        <div className="custom-modal-header">
          <h2 className="custom-modal-title">
            {checkoutStep === 1 ? "1. Thông tin thanh toán" : checkoutStep === 2 ? "2. Phương thức TT" : "3. Hoàn tất"}
          </h2>
          <button className="custom-modal-close" onClick={closeCheckout} disabled={loading}>&times;</button>
        </div>

        {/* BODY */}
        <div className="custom-modal-body">
          
          {/* ======================= BƯỚC 1: NHẬP THÔNG TIN KHÁCH & VOUCHER ======================= */}
          {checkoutStep === 1 && (
            <div className="checkout-step-1">
              
              <div className="custom-input-group">
                <label className="custom-label">SĐT / Mã Khách Hàng</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    className="custom-input" 
                    placeholder="Nhập SĐT hoặc quét mã thẻ..." 
                    value={customerInput} 
                    onChange={handleCustomerInputChange} 
                  />
                  <button 
                    type="button" 
                    style={{ padding: '0 15px', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => setScannerMode('customer')}
                  >
                    📷 Quét
                  </button>
                </div>
              </div>

              <div className="custom-input-group">
                <label className="custom-label">Tên khách hàng</label>
                <input 
                  className="custom-input" 
                  placeholder="Tên khách hàng..." 
                  value={custName} 
                  onChange={(e) => setCustName(e.target.value)} 
                  disabled={customers[custPhone] && customers[custPhone].name} 
                />
              </div>

              {/* Ô NHẬP ĐỊA CHỈ VỪA THÊM */}
              <div className="custom-input-group">
                <label className="custom-label">Địa chỉ giao hàng (Tùy chọn)</label>
                <input 
                  className="custom-input" 
                  placeholder="Số nhà, đường, phường, quận..." 
                  value={custAddress} 
                  onChange={(e) => setCustAddress(e.target.value)} 
                />
              </div>

              <div className="custom-input-group">
                <label className="custom-label">Mã Giảm Giá / Voucher</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    className="custom-input" 
                    placeholder="Nhập mã và ấn Enter..." 
                    value={voucherInput} 
                    onChange={(e) => setVoucherInput(e.target.value)}
                    onKeyDown={handleVoucherSubmit}
                  />
                  <button 
                    type="button" 
                    style={{ padding: '0 15px', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => setScannerMode('voucher')}
                  >
                    📷 Quét
                  </button>
                </div>
                {appliedVoucherAmount > 0 && (
                  <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '13px', marginTop: '5px' }}>
                    ✅ Đã áp dụng giảm {appliedVoucherAmount.toLocaleString()}đ
                  </p>
                )}
              </div>

              {customers[custPhone] && customers[custPhone].wallet > 0 && (
                <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#d97706' }}>Ví VIP tích lũy:</span><br/>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#b45309' }}>{customers[custPhone].wallet.toLocaleString()}đ</span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#b45309' }}>
                    <input 
                      type="checkbox" 
                      style={{ transform: 'scale(1.5)' }} 
                      checked={useWallet} 
                      onChange={(e) => setUseWallet(e.target.checked)} 
                    />
                    Dùng ví
                  </label>
                </div>
              )}

              <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 5px 0', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Cần Thanh Toán</p>
                <h2 style={{ margin: '0', fontSize: '32px', color: '#dc2626', fontWeight: '900' }}>
                  {finalToPay.toLocaleString()}đ
                </h2>
              </div>

              <button className="gradient-btn" onClick={handleNextToQR}>
                TIẾP TỤC THANH TOÁN
              </button>
            </div>
          )}

          {/* ======================= BƯỚC 2: CHỌN PHƯƠNG THỨC & XÁC NHẬN ======================= */}
          {checkoutStep === 2 && (
            <div className="checkout-step-2">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {['TIỀN MẶT', 'CHUYỂN KHOẢN', 'QUẸT THẺ', 'GHI NỢ'].map(method => (
                  <button 
                    key={method}
                    type="button"
                    style={{
                      padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: '2px solid',
                      background: selectedMethod === method ? '#eff6ff' : '#fff',
                      borderColor: selectedMethod === method ? '#3b82f6' : '#e2e8f0',
                      color: selectedMethod === method ? '#1d4ed8' : '#475569'
                    }}
                    onClick={() => setSelectedMethod(method as any)}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {selectedMethod === 'TIỀN MẶT' && (
                <div className="custom-input-group" style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px' }}>
                  <label className="custom-label">Tiền khách đưa (VND)</label>
                  <input 
                    type="number" 
                    className="custom-input" 
                    placeholder="Nhập số tiền..." 
                    value={customerGiven} 
                    onChange={(e) => setCustomerGiven(e.target.value)} 
                  />
                  {Number(customerGiven) > finalToPay && (
                    <p style={{ margin: '10px 0 0 0', fontWeight: 'bold', color: '#10b981', fontSize: '15px' }}>
                      Tiền thối lại: {(Number(customerGiven) - finalToPay).toLocaleString()}đ
                    </p>
                  )}
                </div>
              )}

              {selectedMethod === 'CHUYỂN KHOẢN' && (
                <div style={{ textAlign: 'center', background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#0f172a' }}>Quét mã QR để thanh toán {finalToPay.toLocaleString()}đ</p>
                  <img 
                    src={`https://img.vietqr.io/image/${bankBin}-${bankAcc}-compact2.png?amount=${finalToPay}&addInfo=ThanhToan&accountName=${encodeURIComponent(bankNameStr)}`} 
                    alt="VietQR" 
                    style={{ width: '200px', height: '200px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() => setCheckoutStep(1)}
                  disabled={loading}
                >
                  QUAY LẠI
                </button>
                <button 
                  className="gradient-btn" 
                  style={{ flex: 2 }}
                  onClick={() => confirmCheckout(selectedMethod)}
                  disabled={loading || (selectedMethod === 'TIỀN MẶT' && Number(customerGiven) < finalToPay && Number(customerGiven) !== 0)}
                >
                  {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN HOÀN TẤT'}
                </button>
              </div>
            </div>
          )}

          {/* ======================= BƯỚC 3: THÀNH CÔNG & IN ẤN ======================= */}
          {checkoutStep === 3 && (
            <div className="checkout-step-3" style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '60px', marginBottom: '10px' }}>✅</div>
              <h2 style={{ color: '#10b981', margin: '0 0 5px 0' }}>THANH TOÁN THÀNH CÔNG!</h2>
              <p style={{ color: '#64748b', marginBottom: '25px' }}>Đơn hàng đã được lưu vào hệ thống.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  type="button" 
                  style={{ padding: '14px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                  onClick={() => setPrintMode('receipt')}
                >
                  🖨️ IN BILL MÁY POS (80MM)
                </button>

                <button 
                  type="button" 
                  style={{ padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                  onClick={() => setPrintMode('invoice_a4')}
                >
                  📄 IN HÓA ĐƠN A4
                </button>

                {isOnline && (
                  <button 
                    type="button" 
                    style={{ padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fef3c7', color: '#d97706', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                    onClick={sendReceiptEmail}
                    disabled={loading}
                  >
                    📧 GỬI HÓA ĐƠN QUA EMAIL
                  </button>
                )}

                <button 
                  className="gradient-btn" 
                  style={{ marginTop: '10px' }}
                  onClick={closeCheckout}
                >
                  ĐÓNG & TẠO ĐƠN MỚI
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
