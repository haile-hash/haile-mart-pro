/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useRef } from "react";
import { Customer } from "../../types";

interface CheckoutModalProps {
  checkoutStep: number; setCheckoutStep: (val: number) => void; voucherInput: string; setVoucherInput: (val: string) => void; customerInput: string; setCustomerInput: (val: string) => void; custPhone: string; setCustPhone: (val: string) => void; custName: string; setCustName: (val: string) => void; custAddress: string; setCustAddress: (val: string) => void; useWallet: boolean; setUseWallet: (val: boolean) => void; customerGiven: string; setCustomerGiven: (val: string) => void; finalToPay: number; customersData: Record<string, Customer>; bankBin: string; bankAcc: string; bankNameStr: string; loading: boolean; handleVoucherSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void; handleCustomerInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void; setScannerMode: (mode: 'product' | 'voucher' | 'customer' | null) => void; handleNextToQR: () => void; confirmCheckout: (method: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ' | 'KẾT HỢP' | 'QUẸT THẺ' | 'ZALO PAY') => void; setPrintMode: (mode: 'receipt_thermal' | 'receipt_a4' | 'barcode' | 'customer_card' | null) => void; sendReceiptEmail: () => void; closeCheckout: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  checkoutStep, setCheckoutStep, voucherInput, setVoucherInput, customerInput, setCustomerInput, custPhone, setCustPhone, custName, setCustName, useWallet, setUseWallet, customerGiven, setCustomerGiven, finalToPay, customersData, bankBin, bankAcc, bankNameStr, loading, handleVoucherSubmit, handleCustomerInputChange, setScannerMode, handleNextToQR, confirmCheckout, setPrintMode, sendReceiptEmail, closeCheckout, custAddress, setCustAddress
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (checkoutStep === 1) { setTimeout(() => { document.getElementById('co-customer-input')?.focus(); }, 100); } }, [checkoutStep]);

  const handleClose = () => { setPrintMode(null); closeCheckout(); };

  const getCashSuggestions = (total: number) => {
    if (total <= 0) return [];
    const suggestions = new Set<number>([total]); 
    const roundUp = (num: number, multiple: number) => Math.ceil(num / multiple) * multiple;
    if (total < 100000) { suggestions.add(roundUp(total, 10000)); suggestions.add(roundUp(total, 50000)); suggestions.add(100000); } else if (total < 500000) { suggestions.add(roundUp(total, 50000)); suggestions.add(roundUp(total, 100000)); suggestions.add(500000); } else { suggestions.add(roundUp(total, 10000)); suggestions.add(roundUp(total, 100000)); suggestions.add(roundUp(total, 500000)); suggestions.add(roundUp(total, 1000000)); }
    return Array.from(suggestions).filter(val => val >= total).sort((a, b) => a - b).slice(0, 4); 
  };

  const storeInfo = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem("mart_current_store") || "{}") : {};
  const safeStoreName = storeInfo.store_name ? encodeURIComponent(storeInfo.store_name) : "POS%20PRO";
  const vietQrUrl = `https://img.vietqr.io/image/${bankBin || 'ICB'}-${bankAcc || '0000'}-qr_only.png?amount=${finalToPay || 0}&addInfo=${safeStoreName}%20Thanh%20Toan`;
  const givenNum = Number(customerGiven); const isValidGivenNum = !isNaN(givenNum) && givenNum > 0;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, backdropFilter: 'blur(4px)' }} onClick={handleClose}>
      <style>{`
        .co-input-wrapper { display: flex; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #f8fafc; }
        .co-icon-box { padding: 10px 14px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; }
        .co-input { flex: 1; border: none; padding: 10px 14px; outline: none; background: transparent; font-size: 14px; }
        .co-btn-scan { background: #3b82f6; color: white; border: none; padding: 0 16px; font-weight: bold; cursor: pointer; }
        .co-label { font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 6px; display: block; }
        .btn-method { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; font-weight: bold; color: #334155; cursor: pointer; transition: 0.2s; padding: 16px; font-size: 15px; }
        .btn-method:hover { filter: brightness(0.9); }
      `}</style>
      
      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', maxWidth: '720px', width: '95%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()} ref={modalRef}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {checkoutStep === 2 && (<button onClick={() => setCheckoutStep(1)} style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>←</button>)}
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
              {checkoutStep === 1 && "1. THÔNG TIN KHÁCH HÀNG"} {checkoutStep === 2 && "2. CHỌN PHƯƠNG THỨC CHỐT ĐƠN"} {checkoutStep === 3 && "3. HOÀN TẤT ĐƠN HÀNG"}
            </h2>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#64748b' }}>&times;</button>
        </div>

        {/* BODY */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {checkoutStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label className="co-label">Khách hàng</label><div className="co-input-wrapper"><div className="co-icon-box">📞</div><input id="co-customer-input" className="co-input" placeholder="Nhập SĐT hoặc quét thẻ..." value={customerInput || ''} onChange={handleCustomerInputChange} /><button type="button" className="co-btn-scan" onClick={() => setScannerMode('customer')}>Quét</button></div></div>
              <div><label className="co-label">Tên khách hàng</label><div className="co-input-wrapper"><div className="co-icon-box">👤</div><input className="co-input" placeholder="Tên khách hàng thân thiết..." value={custName || ''} onChange={(e) => setCustName(e.target.value)} /></div></div>
              <div><label className="co-label">Ghi chú giao hàng</label><div className="co-input-wrapper"><div className="co-icon-box">📍</div><input className="co-input" placeholder="Số nhà, tên đường (Nếu giao tận nơi)..." value={custAddress || ''} onChange={(e) => setCustAddress(e.target.value)} /></div></div>
              <div style={{ marginTop: '10px', borderTop: '1px dashed #e2e8f0', paddingTop: '20px' }}><label className="co-label" style={{ color: '#059669' }}>Mã Voucher giảm giá</label><div className="co-input-wrapper"><div className="co-icon-box" style={{ color: '#10b981' }}>🎫</div><input className="co-input" placeholder="Nhập mã + Enter..." value={voucherInput || ''} onChange={(e) => setVoucherInput(e.target.value)} onKeyDown={handleVoucherSubmit} /><button type="button" className="co-btn-scan" onClick={() => setScannerMode('voucher')}>Quét</button></div></div>
              <div style={{ background: '#fef2f2', border: '1px dashed #f87171', borderRadius: '8px', padding: '16px', textAlign: 'center', marginTop: '10px' }}><div style={{ fontSize: '12px', fontWeight: '800', color: '#dc2626', marginBottom: '4px' }}>TỔNG KHÁCH PHẢI TRẢ</div><div style={{ fontSize: '36px', fontWeight: '900', color: '#b91c1c', margin: 0 }}>{(finalToPay || 0).toLocaleString()}đ</div></div>
            </div>
          )}

          {checkoutStep === 2 && (
            <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
              <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#eff6ff', border: '1px dashed #3b82f6', borderRadius: '8px', padding: '20px 15px', textAlign: 'center' }}><div style={{ fontSize: '13px', color: '#1d4ed8', fontWeight: '800' }}>PHẢI THU KHÁCH</div><div style={{ fontSize: '32px', color: '#2563eb', fontWeight: '900' }}>{(finalToPay || 0).toLocaleString()}đ</div></div>
                <div style={{ flex: 1, background: '#f8fafc', padding: '16px', border: '1px dashed #3b82f6', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><img src={vietQrUrl} alt="VietQR" style={{ width: '160px', height: '160px', margin: '0 auto', background: '#fff', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '8px' }} /><div style={{ fontSize: '13px', marginTop: '12px', lineHeight: '1.5' }}><strong style={{ fontSize: '14px', color: '#0f172a' }}>{bankNameStr || 'Mặc định'}</strong><br/>STK: <span style={{ color: '#2563eb', fontWeight: '900', fontSize: '14px' }}>{bankAcc || 'Chưa cài đặt'}</span></div><div style={{ marginTop: '8px', fontSize: '11px', color: '#059669', fontWeight: 'bold', display: 'inline-block', background: '#dcfce7', padding: '4px 8px', borderRadius: '4px' }}>⚡ QR tự động khớp số tiền</div></div>
              </div>

              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Đã vá lỗi Object is possibly undefined bằng toán tử bọc chống crash || 0 */}
                {(customersData?.[custPhone]?.wallet || 0) > 0 && (
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "8px", cursor: "pointer", border: "1px solid #cbd5e1", background: '#fff', margin: 0 }}>
                    <input type="checkbox" checked={useWallet} onChange={e => setUseWallet(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#ea580c' }} />
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                      Sử dụng Ví VIP: <span style={{ color: "#ea580c", fontWeight: 'bold' }}>{(customersData[custPhone]?.wallet || 0).toLocaleString()}đ</span>
                    </span>
                  </label>
                )}
                
                <div>
                  <label className="co-label">Tiền mặt khách đưa (Để tính tiền thừa/kết hợp):</label>
                  <div className="co-input-wrapper" style={{ height: '48px' }}><div className="co-icon-box" style={{ fontSize: '18px' }}>💵</div><input type="number" className="co-input" placeholder="Nhập số tiền mặt..." value={customerGiven || ''} onChange={(e) => setCustomerGiven(e.target.value)} style={{ fontSize: '16px', fontWeight: 'bold' }} /></div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {getCashSuggestions(finalToPay).map((amt, idx) => (<button key={idx} type="button" onClick={() => setCustomerGiven(amt.toString())} style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>{amt.toLocaleString()}</button>))}
                    <button onClick={() => setCustomerGiven("")} style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>Xóa</button>
                  </div>
                  <div style={{ height: '22px', marginTop: '6px' }}>
                    {isValidGivenNum && givenNum > finalToPay && (<span style={{ fontSize: '14px', color: '#10b981', fontWeight: '700' }}>↳ Thừa trả khách: {(givenNum - finalToPay).toLocaleString()}đ</span>)}
                    {isValidGivenNum && givenNum < finalToPay && (<span style={{ fontSize: '14px', color: '#ea580c', fontWeight: '700' }}>↳ Còn thiếu (Quét QR nốt): {(finalToPay - givenNum).toLocaleString()}đ</span>)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button onClick={() => confirmCheckout('TIỀN MẶT')} disabled={loading} className="btn-method" style={{ background: '#10b981', color: 'white', borderColor: '#059669' }}>💵 Tiền mặt (F2)</button>
                  <button onClick={() => confirmCheckout('CHUYỂN KHOẢN')} disabled={loading} className="btn-method" style={{ background: '#3b82f6', color: 'white', borderColor: '#2563eb' }}>🏦 C.Khoản (F3)</button>
                </div>
                <button onClick={() => { if(!isValidGivenNum || givenNum >= finalToPay) { alert("Thanh toán KẾT HỢP chỉ dùng khi khách đưa một phần tiền mặt (nhỏ hơn tổng bill), phần còn thiếu sẽ quét QR.\n\nVui lòng nhập lại số tiền mặt khách đưa."); return; } confirmCheckout('KẾT HỢP'); }} disabled={loading} className="btn-method" style={{ background: '#f59e0b', color: 'white', borderColor: '#d97706' }}>🤝 Kết hợp (Tiền mặt + Chuyển Khoản)</button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: 'auto' }}>
                  <button onClick={() => confirmCheckout('QUẸT THẺ')} disabled={loading} className="btn-method" style={{ padding: '12px', fontSize: '13px' }}>💳 Quẹt Thẻ</button>
                  <button onClick={() => confirmCheckout('ZALO PAY')} disabled={loading} className="btn-method" style={{ padding: '12px', fontSize: '13px' }}>📱 Zalo Pay</button>
                  <button onClick={() => confirmCheckout('GHI NỢ')} disabled={loading} className="btn-method" style={{ padding: '12px', fontSize: '13px' }}>📓 Ghi Nợ</button>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 3 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: '70px', height: '70px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10b981', fontSize: '36px' }}>✓</div>
              <h2 style={{ color: "#059669", marginBottom: "8px", fontSize: '24px', fontWeight: '900' }}>CHỐT ĐƠN THÀNH CÔNG!</h2>
              <p style={{ color: "#64748b", fontSize: "15px", marginBottom: "24px" }}>Chọn mẫu in để xuất cho khách hàng.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: '400px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button onClick={() => setPrintMode('receipt_thermal')} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ IN BILL K80</button>
                  <button onClick={() => setPrintMode('receipt_a4')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ IN HÓA ĐƠN A4</button>
                </div>
                <button onClick={sendReceiptEmail} className="btn-method" style={{ padding: '14px' }}>✉️ Gửi Email điện tử</button>
                <button onClick={handleClose} className="btn-method" style={{ background: '#f8fafc', padding: '14px' }}>Hoàn tất & Đóng</button>
              </div>
            </div>
          )}
        </div>

        {checkoutStep === 1 && (
          <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <button onClick={handleNextToQR} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Tiến hành chọn phương thức thanh toán ➔</button>
          </div>
        )}
      </div>
    </div>
  );
};
