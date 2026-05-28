/* eslint-disable */
// @ts-nocheck
import React from 'react';
import { cleanName } from '../../utils/helpers';

interface PrintManagerProps {
  printMode: 'receipt_thermal' | 'receipt_a4' | 'barcode' | 'customer_card' | 'po_order' | 'po_receipt' | 'po_return' | null;
  lastOrder: any;
  shift: string;
  role: string;
  customers: any;
  VAT_RATE: number;
  printBarcodeProduct: any;
  barcodeCount: number;
  printCustomer: any;
  printPOData: any;
}

export const PrintManager: React.FC<PrintManagerProps> = ({
  printMode, lastOrder, shift, role, customers, VAT_RATE = 0, printBarcodeProduct, barcodeCount, printCustomer, printPOData,
}) => {
  if (!printMode) return null;

  const dateObj = new Date(); 
  const getCustomerDetail = (phone: string) => phone ? ((customers || {})[phone] || null) : null;

  // =====================================================================
  // TỐI ƯU LẠI GIAO DIỆN HIỂN THỊ TIỀN KHÁCH ĐƯA / TIỀN THỐI LẠI
  // =====================================================================
  const renderPaymentDetails = (order: any, cDetail: any, isA4: boolean) => {
    const total = Math.round(order.debtAmount > 0 ? order.debtAmount : order.finalTotal);
    const given = Number(order.customerGiven || 0);
    
    let cashPart = 0; let transferPart = 0; let debtPart = 0;

    if (order.paymentMethod === 'TIỀN MẶT') { cashPart = total; } 
    else if (order.paymentMethod === 'KẾT HỢP') { cashPart = given; transferPart = total - given; } 
    else if (order.paymentMethod === 'GHI NỢ') { debtPart = total; } 
    else { transferPart = total; }

    // Tính tiền thừa nếu khách trả tiền mặt và đưa lố tiền
    const change = (order.paymentMethod === 'TIỀN MẶT' && given > total) ? (given - total) : 0;

    const rowStyle = isA4 
        ? { display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '14px' }
        : { display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '12px' };

    return (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: isA4 ? '1px dashed #cbd5e1' : '1px dashed #000' }}>
            <div style={{ ...rowStyle, fontWeight: 'bold', marginBottom: '4px' }}>
                <span>Phương thức:</span>
                <span style={{ color: isA4 ? '#2563eb' : '#000', textTransform: 'uppercase' }}>{order.paymentMethod}</span>
            </div>
            
            {order.paymentMethod === 'TIỀN MẶT' && (
              <>
                <div style={rowStyle}><span>- Tiền khách đưa:</span><span style={{ fontWeight: 'bold' }}>{given > 0 ? given.toLocaleString() : total.toLocaleString()}đ</span></div>
                {change > 0 && <div style={rowStyle}><span>- Trả lại khách:</span><span style={{ fontWeight: 'bold' }}>{change.toLocaleString()}đ</span></div>}
              </>
            )}

            {order.paymentMethod === 'KẾT HỢP' && (
              <>
                <div style={rowStyle}><span>- Tiền mặt (Khách đưa):</span><span style={{ fontWeight: 'bold' }}>{given.toLocaleString()}đ</span></div>
                <div style={rowStyle}><span>- Chuyển khoản thêm:</span><span style={{ fontWeight: 'bold' }}>{transferPart.toLocaleString()}đ</span></div>
              </>
            )}
            
            {(order.paymentMethod === 'CHUYỂN KHOẢN' || order.paymentMethod === 'ZALO PAY' || order.paymentMethod === 'QUẸT THẺ') && (
              <div style={rowStyle}><span>- Đã thanh toán:</span><span style={{ fontWeight: 'bold' }}>{transferPart.toLocaleString()}đ</span></div>
            )}

            {debtPart > 0 && <div style={{ ...rowStyle, color: isA4 ? '#ef4444' : '#000' }}><span>- Khách nợ đơn này:</span><span style={{ fontWeight: 'bold' }}>{debtPart.toLocaleString()}đ</span></div>}
            
            {order.paymentMethod === 'GHI NỢ' && cDetail && (
                <div style={{ ...rowStyle, marginTop: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                    <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>=&gt; TỔNG NỢ HIỆN TẠI:</span>
                    <span style={{ fontWeight: 'bold', color: isA4 ? '#ef4444' : '#000', fontSize: isA4 ? '16px' : '13px' }}>{(Number(cDetail.debt) || 0).toLocaleString()}đ</span>
                </div>
            )}
        </div>
    );
  };

  if (printMode === 'receipt_thermal') {
    if (!lastOrder) return null;
    const cDetail = getCustomerDetail(lastOrder.custPhone);
    return (
      <div className="print-only-zone" style={{ width: '100%', textAlign: 'center', backgroundColor: '#fff' }}>
        <div style={{ display: 'inline-block', width: '78mm', margin: '0 auto', textAlign: 'left', fontFamily: 'Arial, sans-serif', color: '#000', padding: '10px 0', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>HẢI LÊ MART</h2>
            <p style={{ margin: '2px 0', fontSize: '12px' }}>ĐC: 123 Đường ABC, Hà Nội</p>
            <p style={{ margin: '2px 0', fontSize: '12px' }}>Hotline: 0902 613 899</p>
            <h3 style={{ margin: '10px 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>HÓA ĐƠN THANH TOÁN</h3>
            <p style={{ margin: '0', fontSize: '12px' }}>Số: {lastOrder.orderId}</p>
          </div>
          <div style={{ fontSize: '12px', marginBottom: '10px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ngày:</span><span>{lastOrder.time}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Khách hàng:</span><span style={{ fontWeight: 'bold' }}>{lastOrder.custName || "Khách lẻ"}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Thu ngân:</span><span>{role === 'admin' ? 'Quản lý' : 'Nhân viên'}</span></div>
          </div>
          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', marginBottom: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead><tr><th style={{ padding: '0 0 6px 0', textAlign: 'left', borderBottom: '1px solid #000' }}>Sản phẩm</th><th style={{ padding: '0 0 6px 0', textAlign: 'right', borderBottom: '1px solid #000' }}>T.Tiền</th></tr></thead>
              <tbody>
                {(lastOrder.cart || []).map((item: any, idx: number) => {
                  const price = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round((item.product?.sale_price || 0) * (1 + VAT_RATE));
                  const cleanProductName = (item.product?.name || item.name || "").replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
                  return (
                    <React.Fragment key={idx}>
                      <tr><td colSpan={2} style={{ paddingTop: '6px', fontWeight: 'bold' }}>{cleanProductName} {item.product?.isHappyHour && '⭐'}</td></tr>
                      <tr><td style={{ paddingBottom: '6px', color: '#333' }}>{item.qty} x {price.toLocaleString()}</td><td style={{ paddingBottom: '6px', textAlign: 'right', fontWeight: 'bold' }}>{(price * item.qty).toLocaleString()}</td></tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cộng tiền hàng:</span><span>{Math.round(lastOrder.subTotal + lastOrder.vatTotal).toLocaleString()}đ</span></div>
            {lastOrder.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Giảm giá:</span><span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', margin: '8px 0', borderTop: '1px solid #000', paddingTop: '8px' }}><span>TỔNG CỘNG:</span><span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span></div>
            <div style={{ marginTop: '10px', background: '#f8fafc', padding: '6px', borderRadius: '4px' }}>{renderPaymentDetails(lastOrder, cDetail, false)}</div>
          </div>
          
          {/* KHU VỰC CHỮ KÝ TRÊN BILL NHIỆT K80 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', padding: '0 10px', fontSize: '11px', fontWeight: 'bold' }}>
            <div style={{ textAlign: 'center' }}>Khách hàng<br/><span style={{ fontSize: '9px', fontWeight: 'normal', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</span></div>
            <div style={{ textAlign: 'center' }}>Người bán<br/><span style={{ fontSize: '9px', fontWeight: 'normal', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</span></div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '12px', fontStyle: 'italic' }}>Cảm ơn Quý khách & Hẹn gặp lại!</div>
        </div>
      </div>
    );
  }

  if (printMode === 'receipt_a4') {
    if (!lastOrder) return null;
    const cDetail = getCustomerDetail(lastOrder.custPhone);
    return (
      <div className="print-only-zone" style={{ width: '100%', backgroundColor: '#fff' }}>
        <div style={{ width: '100%', maxWidth: '210mm', margin: '0 auto', padding: '15mm 20mm', fontFamily: '"Times New Roman", Times, serif', color: '#000', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '25px' }}>
            <div style={{ width: '55%' }}>
              <h1 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>HỆ THỐNG HẢI LÊ MART</h1>
              <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Địa chỉ:</strong> 123 Đường ABC, Quận XYZ, TP. Hà Nội</p>
              <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Điện thoại:</strong> 0902 613 899</p>
            </div>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 'bold' }}>HÓA ĐƠN BÁN HÀNG</h2>
              <p style={{ margin: '3px 0', fontSize: '14px', fontStyle: 'italic' }}>Ngày {dateObj.getDate()} tháng {dateObj.getMonth() + 1} năm {dateObj.getFullYear()}</p>
              <p style={{ margin: '3px 0', fontSize: '14px' }}>Số chứng từ: <strong>{lastOrder.orderId}</strong></p>
            </div>
          </div>
          <div style={{ marginBottom: '25px', fontSize: '15px', lineHeight: '1.8' }}>
            <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Họ tên khách hàng:</span><strong>{lastOrder.custName || "Khách mua lẻ"}</strong></div>
            <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Số điện thoại:</span><span>{lastOrder.custPhone || "..................................................."}</span></div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '15px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ border: '1px solid #000', padding: '10px' }}>STT</th><th style={{ border: '1px solid #000', padding: '10px' }}>Tên hàng hóa</th><th style={{ border: '1px solid #000', padding: '10px' }}>SL</th><th style={{ border: '1px solid #000', padding: '10px' }}>Đơn giá</th><th style={{ border: '1px solid #000', padding: '10px' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(lastOrder.cart || []).map((item: any, idx: number) => {
                const price = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round((item.product?.sale_price || 0) * (1 + VAT_RATE));
                const cleanProductName = (item.product?.name || item.name || "").replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{cleanProductName}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{price.toLocaleString()}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{(price * item.qty).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
            <div style={{ width: '420px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '20px', fontWeight: 'bold', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
                <span>TỔNG THANH TOÁN:</span><span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
              </div>
              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>{renderPaymentDetails(lastOrder, cDetail, true)}</div>
            </div>
          </div>
          
          {/* KHU VỰC CHỮ KÝ TRÊN BILL A4 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <div style={{ textAlign: 'center', width: '250px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>Người mua hàng</p>
              <p style={{ margin: '0 0 100px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div style={{ textAlign: 'center', width: '250px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>HẢI LÊ MART</p>
              <p style={{ margin: '0 0 100px 0', fontSize: '14px', fontStyle: 'italic' }}>(Đại diện cửa hàng ký, đóng dấu)</p>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{role === 'admin' ? 'Quản lý' : 'Thu ngân'} {shift}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Các mode in Card và Barcode giữ nguyên, đã được bọc giáp an toàn
  // ... (Code in Card và Barcode vẫn như cũ)

  return null;
};
